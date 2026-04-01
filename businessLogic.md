# Business Logic — Portuguese Learning Academy

This document describes the core business flows and rules for enrollment, hour packages, class scheduling, and hour transfers. It complements `architecture.md` and should be read alongside it.

Status note: these rules reflect the currently implemented service-layer behavior in `backend/services`.

---

## 1. Enrollment System

### 1.1 Overview

Enrollment is the act of linking a student (`user_id`) to a course (`course_id`). The behaviour diverges based on `courses.type`:

| `courses.type` | Schedule source          | Capacity rule                   |
| -------------- | ------------------------ | ------------------------------- |
| `individual`   | Student picks time slots | No cap (one student per class)  |
| `group`        | Fixed `course_schedules` | Max 6 students (`max_students`) |

---

### 1.2 Pre-conditions

Before creating an `enrollments` record, the service must verify:

1. **Email verified** — `users.email_verified_at` is non-null.
2. **No duplicate enrollment** — no existing `enrollments` row with the same `(user_id, course_id)` (enforced by `UNIQUE` constraint, but catch at service layer for a clean error).
3. **Course is enrollable** — `courses.status` is `active` or `full` (for `full`, enrollment attempts are expected to resolve through waitlist handling).
4. **Capacity available (group only)** — count of `enrollments` rows for this `course_id` where `status = 'active'` is less than `courses.max_students` (6). If full, redirect to the waitlist flow (see §1.4).

---

### 1.3 Enrollment Flow

```
Student requests enrollment
        │
        ▼
enrollmentService.enroll(user_id, course_id)
        │
        ├─ [group] Count active enrollments for course
        │       ├─ Count < max_students → proceed
        │       └─ Count >= max_students → raise COURSE_FULL error
        │                                  (caller should redirect to waitlist)
        │
        ├─ Validate pre-conditions (§1.2)
        │
        ▼
INSERT enrollments (user_id, course_id, status='active',
                    hours_total=0, hours_used=0, enrolled_at=now())
        │
        ▼
Trigger notification: "enrollment confirmation" (Email)
        │
        ▼
[individual] Student must purchase an hour package to credit hours
[group]      Student attends classes on the fixed course_schedules
```

`hours_total` starts at 0 and is credited when a payment is confirmed (see §2).

---

### 1.4 Waitlist Flow (Group Courses Only)

When `courses.status = 'full'`:

1. Insert into `waitlist` with `status = 'waiting'` and `position` = current max position + 1.
2. When a slot opens, `waitlistService` promotes the next entry:
   - Set `waitlist.status = 'offered'`, record `notified_at = now()`.
   - Send offer notification via WhatsApp + Email.
   - Student has a defined window to accept. On acceptance → run normal enrollment flow.
   - If window expires → set `status = 'expired'`, promote next in queue.

---

### 1.5 Pre-Enrollment (Future Courses)

For courses with `status = 'draft'` that are not yet open:

1. Insert into `pre_enrollments` with `status = 'pending'`.
2. `UNIQUE` on `(user_id, course_id)` prevents duplicates.
3. When the course transitions to `status = 'active'`, `enrollmentService` converts all `pending` pre-enrollments:
   - Respect `max_students`; excess pre-enrollees go to the waitlist in insertion order.
   - Set `pre_enrollments.status = 'converted'`.

---

## 2. Hour Packages

### 2.1 Overview

Hours are the currency of the platform. A student purchases an `hour_packages` bundle; the resulting payment credits `enrollments.hours_total`. Classes deduct from `hours_used`.

```
hours_remaining = enrollments.hours_total − enrollments.hours_used
```

---

### 2.2 One Active Package Rule

**A student may have only one active hour package in progress per enrollment at a time.**

"Active" means the enrollment has `hours_remaining > 0` and `status = 'active'`.

The service must reject a new purchase if:

```
hours_remaining > 0  →  PACKAGE_ALREADY_ACTIVE error
```

A new package may be purchased only when `hours_remaining = 0` (hours fully consumed) or after a full transfer of remaining hours (see §3).

> **Note:** Package purchases are scoped per enrollment, not per student globally. A student enrolled in two different courses may hold one active package per enrollment.

---

### 2.3 Package Purchase Flow

```
Student selects an hour_packages record
        │
        ▼
paymentService.create_checkout(user_id, enrollment_id, package_id)
        │
        ├─ Validate one-active-package rule (§2.2)
        ├─ Validate enrollment is active
        │
        ▼
INSERT payments (user_id, package_id, status='pending',
                 type='package', amount=package.price)
        │
        ▼
Create Stripe Checkout Session → redirect student
        │
        ▼
Stripe webhook POST /payments/webhook
        │
        ├─ status = 'paid'
        │       ├─ UPDATE payments.status = 'paid', paid_at = now()
        │       └─ UPDATE enrollments.hours_total += package.hours
        │
        ├─ status = 'failed'
        │       ├─ UPDATE payments.status = 'failed'
        │       └─ Notify student (Email)
        │
        └─ status = 'refunded'
                ├─ UPDATE payments.status = 'refunded'
                └─ UPDATE enrollments.hours_total -= package.hours
                   (hours_used must not exceed new hours_total — validate)
```

---

### 2.4 Trial Package

`hour_packages.is_trial = true` identifies a one-time trial session.

- In the current `paymentService` flow, trial purchases are created from a trial package (`package_id` set) and stored with `payments.type = 'trial'`.
- Trial hours are credited to `enrollments.hours_total` identically to a regular package.
- The one-active-package rule applies to trials equally.

---

### 2.5 Extra Hour Purchase

When a student needs a single additional hour outside a bundle:

- `payments.type = 'extra_hour'`, `package_id = NULL`.
- `amount` is set manually or from a fixed extra-hour rate.
- On webhook `paid` → `enrollments.hours_total += 1`.

---

## 3. Hour Transfers (Cancellation Alternative)

### 3.1 Policy

**Students cannot cancel a class or request a refund of hours for a scheduled session.** The only recourse is to transfer remaining hours to another student.

Rationale: this protects teacher scheduling and course revenue while giving students flexibility.

---

### 3.2 Transfer Rules

1. **Source enrollment must be active** — `enrollments.status = 'active'`.
2. **Hours to transfer ≤ `hours_remaining`** on the source enrollment.
3. **Target student must have an active enrollment in a course** (hours are credited to a specific enrollment, not a wallet).
4. **Cross-user transfer only** — source and destination enrollments must belong to different users.
5. Partial transfers are allowed (e.g., transfer 5 of 10 remaining hours).

---

### 3.3 Transfer Flow

```
Student requests transfer (source_enrollment_id, to_user_id,
                           to_enrollment_id, hours_to_transfer, reason)
        │
        ▼
transferService.transfer_hours(...)
        │
        ├─ Validate source hours_remaining >= hours_to_transfer
        ├─ Validate both enrollments are active
        ├─ Validate source and destination are different users
        │
        ▼
UPDATE enrollments SET hours_total = hours_total - hours_to_transfer
  WHERE id = source_enrollment_id
        │
        ▼
UPDATE enrollments SET hours_total = hours_total + hours_to_transfer
  WHERE id = to_enrollment_id
        │
        ▼
INSERT hour_transfers (from_user_id, to_user_id,
                       hours_transferred, reason, created_at=now())
        │
        ▼
[if source hours_remaining = 0 after transfer]
  UPDATE enrollments.status = 'transferred'
        │
        ▼
Notify both students (Email)
```

---

### 3.4 Admin-Initiated Transfer

The admin may also initiate a transfer on behalf of a student (e.g., course cancelled, special circumstances). Same rules apply; the `reason` field documents the justification.

---

## 4. Class Scheduling

### 4.1 Individual Courses

In individual courses the student directly books a slot from the teacher's availability calendar.

```
Student opens /student/bookings
        │
        ▼
GET /bookings/available?enrollment_id=X
  → returns teacher_availability rows where
      teacher_id = course.teacher_id
      AND is_booked = false
      AND date >= today
        │
        ▼
Student selects a slot
        │
        ▼
bookingService.book_individual_class(enrollment_id, availability_id)
        │
        ├─ Re-check availability.is_booked = false (race condition guard)
        ├─ Validate enrollment.hours_remaining >= slot_duration
        │   (slot_duration derived from availability.end_time − availability.start_time)
        │
        ▼
INSERT class_bookings (enrollment_id, availability_id,
                       status='scheduled', hours_deducted=slot_duration,
                       booked_at=now())
        │
        ▼
UPDATE teacher_availability SET is_booked = true
  WHERE id = availability_id
        │
        ▼
UPDATE enrollments SET hours_used = hours_used + hours_deducted
        (for individual classes, hours are deducted at booking time)
        │
        ▼
Trigger notification: class reminder (WhatsApp) — sent before the slot date
```

**No-show handling:** if the student does not attend, admin sets `status = 'no_show'`. For individual classes, pre-deducted hours are not refunded.

---

### 4.2 Group Courses

Group courses run on a fixed recurring schedule defined in `course_schedules`. Students do not book individual slots; they enroll and attend the published schedule.

- `course_schedules` rows define `day_of_week`, `start_time`, `end_time` for the course.
- There are no `class_bookings` rows for group sessions unless attendance tracking is added later.
- Hour deduction for group courses: confirm with product owner whether hours are deducted per session automatically or in bulk at course completion. The schema supports either approach via `class_bookings`.

---

## 5. Cross-Cutting Rules Summary

| Rule                                             | Enforced by                                    |
| ------------------------------------------------ | ---------------------------------------------- |
| One active enrollment per `(user_id, course_id)` | DB UNIQUE + service pre-check                  |
| One active hour package per enrollment           | `paymentService`                               |
| Group course max 6 students                      | `enrollmentService` capacity check             |
| No class cancellation — transfer only            | No cancel endpoint exposed                     |
| Individual-class hours deducted at booking time  | `bookingService.book_individual_class`         |
| Refund window 5 days                             | `payments.status = 'refunded'` + service check |
| Email must be verified before protected routes   | FastAPI auth dependency                        |
