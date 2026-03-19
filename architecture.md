# Architecture — Portuguese Learning Academy

## 1. Project Overview

**Portuguese Learning Academy** is a web platform for a Portuguese language school offering courses at levels A1 through C2 and Business English. It supports individual and group courses, an hour-based payment model, waitlists, class scheduling, and WhatsApp/email notifications.

**Key stakeholders:** Portuguese (Learning) Academy Gaia (product owner), Sharkcoder Gaia (technical partner).

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│           React 19 + Vite SPA  (frontend/)              │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / REST JSON
┌────────────────────────▼────────────────────────────────┐
│              FastAPI Application  (backend/)             │
│   main.py · routers/ · services/ · models/ · schemas/   │
└──────┬───────────────────────┬──────────────────────────┘
       │                       │
┌──────▼──────┐      ┌─────────▼──────────┐
│  PostgreSQL  │      │  External Services  │
│  (database) │      │  · Stripe           │
└─────────────┘      │  · WhatsApp API     │
                     │  · SMTP / Email     │
                     │  · Google / FB /    │
                     │    Apple OAuth      │
                     └────────────────────┘
```

The frontend is a pure SPA with no server-side rendering. All business logic lives in the FastAPI backend. The two apps are developed and deployed independently.

---

## 3. Repository Structure

```
portugueseLearningAcademy/
├── frontend/                   # React 19 + Vite SPA
│   ├── src/
│   │   ├── App.jsx             # Route wiring (source of truth)
│   │   ├── main.jsx            # Bootstrap, global imports (Bootstrap)
│   │   ├── components/         # Reusable UI components (PascalCase)
│   │   │   └── MainLayout/
│   │   │       └── MainLayout.jsx   # Shared Header + Footer shell
│   │   └── pages/              # Feature pages, grouped by role
│   │       ├── public/         # Unauthenticated pages
│   │       ├── auth/           # Login, register, OAuth callbacks
│   │       ├── Admin/          # Admin dashboard and management
│   │       └── Student/        # Student portal
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                    # FastAPI app
│   ├── main.py                 # App factory, CORS, router registration
│   ├── database.py             # SQLAlchemy engine + get_db() session
│   ├── models/                 # SQLAlchemy ORM models (one file per table)
│   ├── schemas/                # Pydantic request/response schemas
│   ├── routers/                # FastAPI APIRouter modules
│   ├── services/               # Business logic (payments, notifications…)
│   ├── .env.example
│   └── requirements.txt        # UTF-16 LE encoded — handle with care
│
└── ARCHITECTURE.md             # This file
```

---

## 4. Frontend

### 4.1 Stack

| Concern     | Choice                                 |
| ----------- | -------------------------------------- |
| Framework   | React 19                               |
| Bundler     | Vite 7.3.1 (requires Node ≥ 20.19)     |
| Styling     | Bootstrap (global) + per-component CSS |
| Routing     | React Router (registered in `App.jsx`) |
| HTTP client | fetch / axios calling FastAPI          |

### 4.2 Page Map

| Path                      | Area    | Description                                      |
| ------------------------- | ------- | ------------------------------------------------ |
| `/`                       | public  | Homepage — course listing                        |
| `/courses/:id`            | public  | Course detail                                    |
| `/login`                  | auth    | Email/password + OAuth (Google, Facebook, Apple) |
| `/register`               | auth    | Student registration                             |
| `/verify-email`           | auth    | Email verification landing                       |
| `/student/dashboard`      | Student | Hours balance, active enrollment, bookings       |
| `/student/bookings`       | Student | Schedule / book individual classes               |
| `/student/pre-enrollment` | Student | Pre-enroll for a future course                   |
| `/admin/dashboard`        | Admin   | KPIs: total students, per-course headcount       |
| `/admin/users`            | Admin   | User table + detail drawer with notes field      |
| `/admin/courses`          | Admin   | Create / edit courses and schedules              |
| `/admin/enrollments`      | Admin   | Manual enrollment, waitlist management           |
| `/admin/payments`         | Admin   | Payment records                                  |
| `/admin/hour-packages`    | Admin   | Manage hour packages                             |
| `/admin/notifications`    | Admin   | Notification log                                 |

### 4.3 Conventions

- One `.jsx` + one `.css` per component/page, co-located.
- Component directories and filenames: **PascalCase**.
- CSS classes: **kebab-case**, prefixed with component name.
- Data-driven rendering with `map()` for lists and cards.
- All new routes must be registered in `frontend/src/App.jsx`.

---

## 5. Backend

### 5.1 Stack

| Concern       | Choice                                                     |
| ------------- | ---------------------------------------------------------- |
| Framework     | FastAPI                                                    |
| ORM           | SQLAlchemy (async or sync session via `get_db()`)          |
| Validation    | Pydantic v2 schemas                                        |
| Database      | PostgreSQL                                                 |
| Payments      | Stripe                                                     |
| Notifications | WhatsApp Business API + SMTP email                         |
| Auth          | JWT (email/password) + OAuth 2.0 (Google, Facebook, Apple) |

### 5.2 Router Modules

Each router owns one domain area and is registered in `main.py`.

| Module            | Prefix             | Responsibility                                          |
| ----------------- | ------------------ | ------------------------------------------------------- |
| `auth`            | `/auth`            | Register, login, OAuth, email verification, JWT refresh |
| `users`           | `/users`           | Student profile, billing address                        |
| `teachers`        | `/teachers`        | Teacher profiles (admin-managed)                        |
| `courses`         | `/courses`         | Course CRUD, schedules, status transitions              |
| `enrollments`     | `/enrollments`     | Enroll, view, hour balance                              |
| `pre_enrollments` | `/pre-enrollments` | Pre-enroll for future courses                           |
| `waitlist`        | `/waitlist`        | Join, advance, offer/accept/expire                      |
| `bookings`        | `/bookings`        | Book individual classes against teacher availability    |
| `payments`        | `/payments`        | Stripe checkout, webhooks, receipts                     |
| `hour_packages`   | `/hour-packages`   | Package catalog (admin)                                 |
| `hour_transfers`  | `/hour-transfers`  | Transfer hours between students                         |
| `notifications`   | `/notifications`   | Log; dispatch via WhatsApp / email                      |
| `admin`           | `/admin`           | Dashboard stats, manual actions                         |

### 5.3 Service Layer

Business logic that spans multiple tables lives in `services/`, not in routers.

| Service                | Key responsibilities                                               |
| ---------------------- | ------------------------------------------------------------------ |
| `enrollment_service`   | Check capacity, deduct hours, trigger waitlist promotion           |
| `payment_service`      | Create Stripe session, handle webhook, update payment + enrollment |
| `waitlist_service`     | Advance positions, send offer notifications, handle expiry         |
| `notification_service` | Route messages to WhatsApp or email, persist to `notifications`    |
| `booking_service`      | Validate availability, deduct `hours_used` on completion           |
| `transfer_service`     | Move hours between enrollments, write `hour_transfers` record      |

### 5.4 Environment Variables

Defined in `backend/.env.example`. Key variables:

```
DATABASE_URL=postgresql://...
SECRET_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
WHATSAPP_API_TOKEN=...
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
FACEBOOK_APP_ID / FACEBOOK_APP_SECRET
APPLE_CLIENT_ID / APPLE_CLIENT_SECRET
FRONTEND_URL=http://localhost:5173
```

---

## 6. Database

Below is a summary of tables and their roles.

### 6.1 Table Summary

| Table                  | Purpose                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `users`                | Students and the single admin. Stores OAuth IDs, billing address, notes.                                                 |
| `teachers`             | Teacher profiles (bio, photo). Not login accounts.                                                                       |
| `courses`              | Course catalogue. `type` distinguishes individual vs group. `start_date`/`end_date` apply to group courses only.         |
| `course_schedules`     | Weekly recurring slots (day + time window) for a course.                                                                 |
| `enrollments`          | Active student–course relationship. Tracks `hours_total` and `hours_used`. Unique per `(user_id, course_id)`.            |
| `pre_enrollments`      | Intent to join a future course. Converts to enrollment when course opens. Unique per `(user_id, course_id)`.             |
| `waitlist`             | Queue for full courses. Ordered by `position`; status tracks offer lifecycle.                                            |
| `hour_packages`        | Catalog of purchasable hour bundles (including trial).                                                                   |
| `payments`             | All financial transactions. `package_id` is nullable for `extra_hour` and `trial` types. Stripe IDs stored for receipts. |
| `hour_transfers`       | Audit log when a student transfers remaining hours to another student.                                                   |
| `teacher_availability` | Teacher's available time slots. `is_booked` flips when a class is scheduled.                                             |
| `class_bookings`       | Individual class sessions. Links an enrollment to an availability slot; records `hours_deducted`.                        |
| `notifications`        | Outbound message log. Channels: `whatsapp`, `email`.                                                                     |

### 6.2 Key Relationships

```
users ──< enrollments >── courses
users ──< pre_enrollments >── courses
users ──< waitlist >── courses
users ──< payments >── hour_packages
users ──< hour_transfers (from / to)
enrollments ──< class_bookings >── teacher_availability
teachers ──< courses
teachers ──< teacher_availability
```

### 6.3 Business Rules Reflected in the Schema

- A student may hold **only one active enrollment** per course (`UNIQUE` on `enrollments(user_id, course_id)`).
- A student may have **only one pre-enrollment** per course (`UNIQUE` on `pre_enrollments(user_id, course_id)`).
- Enrollment cancellation is **not permitted**; instead, remaining hours are transferred via `hour_transfers`.
- Refund window: up to 5 days — handled by `payments.status = 'refunded'` and a new enrollment or transfer.
- `payments.package_id` is **nullable** to support one-off `extra_hour` and `trial` payment types.

---

## 7. Authentication & Authorisation

- **Email/password** with verified email (`email_verified_at` must be non-null to access protected routes).
- **OAuth** via Google, Facebook, and Apple — IDs stored on `users` table.
- **Roles:** `student` (default) and `admin` (single account). Role is enforced as a FastAPI dependency on every admin-prefixed router.
- **JWT** issued on login; short-lived access token + refresh token pattern.

---

## 8. Payment Flow

```
Student selects package
       │
       ▼
POST /payments → payment_service creates Stripe Checkout Session
       │
       ▼
Redirect to Stripe hosted page
       │
       ▼
Stripe calls POST /payments/webhook
       │
       ├─ status = 'paid'  → update payment, credit hours to enrollment
       ├─ status = 'failed' → update payment, notify student
       └─ status = 'refunded' → update payment, reverse hours
```

All prices are in **EUR**. Stripe handles multi-currency display; the platform stores amounts in euros.

---

## 9. Notification Flow

Notifications are queued as `pending` records in the `notifications` table and dispatched by `notification_service`.

| Event                             | Channel                                                            |
| --------------------------------- | ------------------------------------------------------------------ |
| Registration / email verification | Email                                                              |
| Payment receipt                   | Email (Stripe receipt URL stored in `payments.stripe_receipt_url`) |
| Enrollment confirmation           | Email                                                              |
| Class reminder                    | WhatsApp                                                           |
| Waitlist offer                    | WhatsApp + Email                                                   |
| Waitlist offer expired            | Email                                                              |

---

## 10. Non-Functional Requirements

| Concern           | Decision                                                                      |
| ----------------- | ----------------------------------------------------------------------------- |
| **Mobile-first**  | All frontend components designed for small screens first                      |
| **Hosting**       | Hostinger (previous provider); to be re-evaluated for best cost/quality ratio |
| **Localisation**  | UI in Portuguese (PT); prices always in EUR                                   |
| **Accessibility** | WCAG AA target; Bootstrap base provides baseline                              |
| **CORS**          | Localhost-only in development; production origin added via env var            |
| **Certificates**  | Feature on standby — not in current scope                                     |

---

## 11. Development Commands

### Frontend (`frontend/`)

```bash
npm install        # Install dependencies
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run preview    # Preview production build locally
npm run lint       # ESLint
```

### Backend (`backend/`)

```bash
pip install -r requirements.txt   # Note: file is UTF-16 LE encoded
uvicorn main:app --reload          # Start FastAPI dev server
```

> No automated backend test command is defined yet. Document it here when added.

---

## 12. Coding Conventions & Agent Guidance

- Make **targeted, minimal diffs**; avoid broad refactors unless explicitly requested.
- Never edit generated or dependency folders: `frontend/node_modules`, `frontend/dist`, `backend/venv`, `__pycache__`.
- Preserve existing folder structure and naming unless reorganisation is requested.
- When scope is unclear: confirm whether the change is frontend-only, backend-only, or full-stack before proceeding.
- If a request touches routing or layout, confirm expected navigation paths.
- If a request touches DB behaviour, confirm `DATABASE_URL` and local DB availability.
- Link existing files in documentation rather than duplicating their content.
