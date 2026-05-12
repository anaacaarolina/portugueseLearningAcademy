# User Instructions - Portuguese Learning Academy

This guide explains how to use the app from a business owner/admin perspective. It covers both the Admin Dashboard and the Student Dashboard, plus key public pages like courses, enrollment, and payments.

## Table of Contents

- [User Instructions - Portuguese Learning Academy](#user-instructions---portuguese-learning-academy)
  - [Table of Contents](#table-of-contents)
  - [Who This Is For](#who-this-is-for)
  - [Access and Roles](#access-and-roles)
  - [Quick Navigation](#quick-navigation)
  - [Admin Dashboard](#admin-dashboard)
    - [1. KPI Summary](#1-kpi-summary)
    - [2. Scheduled Classes Calendar](#2-scheduled-classes-calendar)
    - [3. Teachers Management](#3-teachers-management)
    - [4. Students Management](#4-students-management)
    - [5. Student Details (Admin-Only)](#5-student-details-admin-only)
    - [6. Manage Content](#6-manage-content)
      - [Course guidance (important)](#course-guidance-important)
      - [Fun facts guidance](#fun-facts-guidance)
      - [Comments (testimonials) guidance](#comments-testimonials-guidance)
    - [7. Send Email (Admin)](#7-send-email-admin)
  - [Student Dashboard](#student-dashboard)
    - [1. Classes and Calendar](#1-classes-and-calendar)
    - [2. Schedule Class (Individual Courses Only)](#2-schedule-class-individual-courses-only)
    - [3. Stats Panel](#3-stats-panel)
  - [Public Website (Student-Facing)](#public-website-student-facing)
    - [Homepage (/)](#homepage-)
    - [Course Catalog (/courses)](#course-catalog-courses)
    - [Course Detail (/courses/:courseSlug)](#course-detail-coursescourseslug)
    - [Enrollment (/enrollment)](#enrollment-enrollment)
    - [Payment (/payment)](#payment-payment)
    - [Payment Results](#payment-results)
    - [Fun Facts](#fun-facts)
  - [Common Troubleshooting](#common-troubleshooting)
  - [Support Notes](#support-notes)

## Who This Is For

- Admin users (school owners/managers) who manage courses, teachers, students, content, and communications.
- Student users who view schedules, book classes (when eligible), and track hours.

## Access and Roles

- Admin users access the Admin Dashboard at /admin-dashboard.
- Student users access the Student Dashboard at /student-dashboard.
- Students without an active enrollment are treated as unrolled_student in the UI and see limited scheduling options.

To sign in, use /login. If you are setting up locally, make sure:

- Frontend is running (default: `http://localhost:5173`)
- Backend is running (default: `http://localhost:8000`)

## Quick Navigation

- Public pages
  - / (Homepage)
  - /courses (Course catalog)
  - /courses/:courseSlug (Course detail)
  - /fun-facts (Fun facts)
  - /fun-facts/:slug (Fun fact detail)
  - /enrollment (Choose course + package)
  - /payment (Checkout)
- Auth
  - /login
  - /register
- Admin
  - /admin-dashboard
  - /student-details/:id
- Student
  - /student-dashboard

## Admin Dashboard

The Admin Dashboard is the control center for students, teachers, classes, and content.

### 1. KPI Summary

At the top you will see:

- Active Students
- Total Courses
- Total Revenue (EUR)

These values help you monitor the overall health of the academy.

### 2. Scheduled Classes Calendar

The calendar summarizes scheduled classes for the month.

**How to use:**

1. Use the left/right arrows to move between months.
2. Click any day to view scheduled classes for that date.
3. The right panel shows the list of classes for the selected day.
4. Highlighted days indicate the number of scheduled classes.

---

**Notes:**

- Group course schedules are included automatically based on weekly schedules and exceptions.
- Individual bookings appear once they are scheduled.

### 3. Teachers Management

The Teachers section lets you:

- Create teachers
- Set and view availability
- Delete teachers

---

**Create a teacher:**

1. Click `Create Teacher`.
2. Fill out name, email, bio (optional), and photo URL (optional).
3. Click `Create Teacher` to save.

---

**Set availability:**

1. Click `Set Availability` for a teacher.
2. Add date, start time, end time, and availability status.
3. Use `Add Slot` to build a list.
4. Click `Save Availability` to confirm.

---

**View availability details:**

1. Click `View Details`.
2. Use the calendar to inspect available/unavailable slots by date.

---

**Delete a teacher:**

- Use `Delete` only when necessary. The system may block deletion if there are booked classes.

### 4. Students Management

The Students table lists all students with:

- Name, email, phone, course, enrollment date, status

**Key actions:**

- `View Details`: Opens the full student management screen.
- `Schedule Class`: Appears only for students in an individual course with a teacher assigned.

---

**Create a student:**

1. Click `Create Student`.
2. Fill name, email, phone, course (optional), and status.
3. Click `Create Student` to save.
4. A temporary password is shown in a popup. Share it with the student.

### 5. Student Details (Admin-Only)

This page is the most detailed student management area.

**Profile section:**

- Click Edit profile to update name, email, or phone.
- Click Apply changes to save updates.

---

**Enrollment & hour package management:**

- Click ``Edit enrollment`` to change:
  - Assigned course
  - Hour package
  - Add hours
  - Schedule a class (choose teacher and available slot)

---

**Attendance tracking:**

- Each booking includes a status dropdown:
  - Scheduled
  - Attended
  - No show
  - Cancelled
- Click ``Save attendance`` after changing status.

---

**Notes:**

- Write internal notes about the student.
- Use ``Clear Notes`` to remove text.
- Click ``Apply changes`` to save updates.

---

**Important:**

- The ``Apply changes`` button confirms all pending edits at once.

### 6. Manage Content

This section controls content visible on the public website.

**Content types:**

- Courses
- Fun Facts
- Fun Fact Tags
- Hour Packages
- Comments (Testimonials)

---

**Create content:**

1. Click ``Create`` for the desired content type.
2. Fill out the form.
3. Click ``Create`` to save.

---

**Edit content:**

1. Click ``Edit`` for the desired content type.
2. Select an item from the list.
3. Click ``Confirm``.
4. Make updates and click ``Save``.

**Delete content:**

- Use ``Delete`` in the edit modal to remove items.

---

#### Course guidance (important)

- Group courses require weekly schedules and can include one-time exceptions.
- Individual courses do not use weekly schedules.
- For group courses, fill:
  - Day of week, start/end time
  - Effective dates
  - One-time changes for rescheduled or cancelled sessions

#### Fun facts guidance

- Only Published fun facts appear on the public Fun Facts page.
- Tags must exist before assigning them to a fun fact.
- The slug is used in the URL. Keep it unique.

#### Comments (testimonials) guidance

- Only Published comments appear on the homepage.

### 7. Send Email (Admin)

Use Send Email to contact students or teachers.

**Steps:**

1. Click ``Send Email``.
2. Choose a template (optional).
3. Select recipients from the platform list.
4. Add any manual emails (comma or newline separated).
5. Enter subject and message.
6. Click ``Send``.

## Student Dashboard

The Student Dashboard helps students track their classes and schedule sessions when eligible.

### 1. Classes and Calendar

Students can view upcoming sessions in two ways:

- Calendar View: Click any day to see classes.
- List View: Full list of scheduled items.

If the student has no active enrollment, the dashboard shows a notice and limited actions.

### 2. Schedule Class (Individual Courses Only)

The ``Schedule Class`` button appears only when:

- The student is enrolled in an individual course, AND
- The course has a teacher assigned, AND
- The teacher has availability slots.

**To schedule:**

1. Click ``Schedule Class``.
2. Select a date with available time slots.
3. Pick a time.
4. Click ``Confirm``.

### 3. Stats Panel

Students can see:

- Current course
- Hours completed vs total
- Attendance percentage
- Next class

## Public Website (Student-Facing)

### Homepage (/)

- Highlights courses and published testimonials.
- Testimonials come from Comments with status Published.

### Course Catalog (/courses)

- Filter by course type and location.
- Click a course to view details.

### Course Detail (/courses/:courseSlug)

- Shows level, schedule, class size, and course summary.
- ``Enroll Now`` opens the enrollment flow with the course preselected.

### Enrollment (/enrollment)

- Select a course and an hour package.
- Click ``Buy Now`` to proceed to checkout.

### Payment (/payment)

- Shows a summary of the chosen course and package.
- Clicking ``Complete Purchase`` redirects to *Stripe* checkout.
- If the user is signed in, the system links the purchase to their account.

### Payment Results

- /payment-success redirects students to their dashboard.
- /payment-cancelled returns to enrollment.

### Fun Facts

- /fun-facts lists all Published fun facts.
- /fun-facts/:slug shows the full article.

## Common Troubleshooting

- "No courses" or empty catalog: create courses in Manage Content.
- "No available slots": set teacher availability in the Teachers section.
- "Schedule Class" not visible: course must be individual and have a teacher assigned.
- Fun facts not visible: ensure the fun fact is Published and has a tag.
- Testimonials missing: set comment status to Published.

## Support Notes

If something looks wrong (missing data, errors, or unexpected behavior), the most common fixes are:

- Check that the backend API is running.
- Confirm the relevant content has been created and marked as active/published.
- Verify the student has an active enrollment and a valid hour package.
  