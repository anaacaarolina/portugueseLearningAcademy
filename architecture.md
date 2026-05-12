# Architecture — Portuguese Learning Academy

## Table of Contents

- [Architecture — Portuguese Learning Academy](#architecture--portuguese-learning-academy)
  - [Table of Contents](#table-of-contents)
  - [1. Project Overview](#1-project-overview)
  - [2. High-Level Architecture](#2-high-level-architecture)
  - [3. Repository Structure](#3-repository-structure)
  - [4. Frontend](#4-frontend)
    - [4.1 Stack](#41-stack)
    - [4.2 Page Map (Current Routes)](#42-page-map-current-routes)
    - [4.3 Conventions](#43-conventions)
  - [5. Backend](#5-backend)
    - [5.1 Stack](#51-stack)
    - [5.2 Router Modules](#52-router-modules)
    - [5.3 App-Level Endpoints (main.py)](#53-app-level-endpoints-mainpy)
    - [5.4 Service Helpers](#54-service-helpers)
    - [5.5 Environment Variables](#55-environment-variables)
  - [6. Database](#6-database)
    - [6.1 Table Summary](#61-table-summary)
    - [6.2 Key Relationships](#62-key-relationships)
    - [6.3 Business Rules Reflected in the Schema](#63-business-rules-reflected-in-the-schema)
  - [7. Authentication \& Authorization](#7-authentication--authorization)
  - [8. Payment Flow](#8-payment-flow)
  - [9. Notification Flow](#9-notification-flow)
  - [10. Non-Functional Requirements](#10-non-functional-requirements)
  - [11. Development Commands](#11-development-commands)
    - [Frontend (frontend/)](#frontend-frontend)
    - [Backend (backend/)](#backend-backend)
  - [12. Coding Conventions \& Agent Guidance](#12-coding-conventions--agent-guidance)

## 1. Project Overview

**Portuguese Learning Academy** is a web platform for a Portuguese language school offering courses at levels A1 through C2 and Business English. It supports individual and group courses, an hour-based payment model, waitlists, class scheduling, and admin-managed content such as fun facts and testimonials.

**Key stakeholders:** Portuguese (Learning) Academy Gaia (product owner), Sharkcoder Gaia (technical partner).

---

## 2. High-Level Architecture

``` bash
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│           React 19 + Vite SPA  (frontend/)              │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / REST JSON
┌────────────────────────▼────────────────────────────────┐
│              FastAPI Application  (backend/)            │
│ main.py · routers/ · Services/ · models.py · schemas.py │
└──────┬───────────────────────┬──────────────────────────┘
       │                       │
┌──────▼──────┐      ┌─────────▼──────────┐
│  PostgreSQL │      │  External Services │
│  (database) │      │  · Stripe          │
└─────────────┘      │  · SMTP / Email    │
                     └────────────────────┘
```

The frontend is a pure SPA with no server-side rendering. Business logic lives in the FastAPI backend. The two apps are developed and deployed independently.

---

## 3. Repository Structure

``` bash
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
│   │       ├── auth/           # Login, register
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
│   ├── models.py               # SQLAlchemy ORM models
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── routers/                # FastAPI APIRouter modules
│   ├── Services/               # Auth + email helpers
│   ├── alembic/                # Migrations
│   ├── .env.example
│   └── requirements.txt        # UTF-16 LE encoded — handle with care
│
└── architecture.md             # This file
```

---

## 4. Frontend

### 4.1 Stack

| Concern     | Choice                                         |
| ----------- | ------------------------------------------     |
| Framework   | React 19                                       |
| Bundler     | Vite 7.3.1 (requires Node >= 20.19)            |
| Styling     | Bootstrap (global) + per-component CSS         |
| Routing     | React Router (registered in App.jsx)           |
| Rich text   | TipTap                                         |
| Utilities   | DOMPurify, React Select, Lucide, React Icons   |

### 4.2 Page Map (Current Routes)

| Path                       | Area    | Description                                  |
| -------------------------- | ------- | -------------------------------------------- |
| `/`                        | public  | Homepage                                     |
| `/courses`                 | public  | Course listing                               |
| `/courses/:courseSlug`     | public  | Course detail                                |
| `/enrollment`              | public  | Enrollment flow entry                        |
| `/payment`                 | public  | Payment selection                            |
| `/payment-success`         | public  | Stripe success landing                       |
| `/payment-cancelled`       | public  | Stripe cancel landing                        |
| `/fun-facts`               | public  | Fun fact catalog                             |
| `/fun-facts/:slug`         | public  | Fun fact detail                              |
| `/login`                   | auth    | Email/password login                         |
| `/register`                | auth    | Student registration                         |
| `/admin-dashboard`         | Admin   | Admin dashboard                              |
| `/student-details/:id?`    | Admin   | Student detail (optional id param)           |
| `/student-dashboard`       | Student | Student dashboard                            |

Route protection uses role-based guards in the frontend (`admin`, `student`, `unrolled_student`).

### 4.3 Conventions

- One .jsx + one .css per component/page, co-located.
- Component directories and filenames: PascalCase.
- CSS classes: kebab-case, prefixed with component name.
- Data-driven rendering with map() for repeated UI.
- All new routes must be registered in frontend/src/App.jsx.

---

## 5. Backend

### 5.1 Stack

| Concern       | Choice                                            |
| ------------- | ------------------------------------------------- |
| Framework     | FastAPI                                           |
| ORM           | SQLAlchemy (sync sessions via get_db)             |
| Validation    | Pydantic v2 schemas                               |
| Database      | PostgreSQL                                        |
| Payments      | Stripe Checkout + Webhooks                        |
| Email         | SMTP via Services/email_service.py                |
| Auth          | JWT (email/password)                              |

### 5.2 Router Modules

Each router owns a domain area and is registered in backend/main.py.

| Module           | Prefix           | Responsibility                                |
| ---------------- | ---------------- | --------------------------------------------- |
| auth             | /auth            | Register, login, change password, profile     |
| courses          | /courses         | Course CRUD + schedules + exceptions          |
| hour_packages    | /hour-packages   | Hour package CRUD                             |
| fun_facts        | /fun-facts       | Fun fact CRUD                                 |
| fun_fact_tags    | /fun-fact-tags   | Fun fact tag CRUD                             |
| comments         | /comments        | Testimonials/comments CRUD                    |
| stripe_routes    | /api/stripe      | Stripe checkout + webhook                     |

### 5.3 App-Level Endpoints (main.py)

Admin and operational endpoints live directly in backend/main.py.

- Admin utilities: email recipients, send email, dashboard KPIs, scheduled classes.
- Student management: CRUD, profile update, hour package assignment, course assignment, hours add, attendance updates, notes.
- Teacher management: CRUD, availability management, available slots, teacher lookup by course.
- Booking creation for scheduled classes.

### 5.4 Service Helpers

The Services/ folder currently provides:

- auth_services.py: password hashing and JWT token creation.
- email_service.py + email_templates.py: SMTP delivery and HTML templates.
- notification_service.py + notification_type.py: notification helpers (not fully wired yet).

### 5.5 Environment Variables

Defined in backend/.env.example. Key variables:

```bash
DATABASE_URL=postgresql://...
SECRET_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASSWORD=...
FRONTEND_URL=http://localhost:5173
DEFAULT_STUDENT_PASSWORD=...
```

---

## 6. Database

### 6.1 Table Summary

| Table                       | Purpose                                                                 |
| --------------------------- | ----------------------------------------------------------------------- |
| users                       | Students and admin accounts, auth data, billing fields, notes           |
| teachers                    | Teacher profiles and metadata                                           |
| courses                     | Course catalog, type, level, regime, status                             |
| course_schedules            | Weekly recurring schedule slots                                         |
| course_schedule_exceptions  | One-off schedule changes or cancellations                               |
| enrollments                 | Active student-course relationship and hour tracking                    |
| pre_enrollments             | Intent to join a future course                                          |
| waitlist                    | Queue for full courses                                                  |
| hour_packages               | Purchasable hour bundles                                                |
| payments                    | Stripe-backed payments                                                  |
| hour_transfers              | Hour balance transfers between students                                 |
| teacher_availability        | Teacher availability slots (date + time range)                          |
| class_bookings              | Booked classes tied to availability                                     |
| notifications               | Notification log                                                        |
| fun_facts                   | Content cards for cultural facts                                        |
| fun_fact_tags               | Tag taxonomy for fun facts                                              |
| comments                    | Testimonials/comments with rating + status                              |
| students (legacy)           | Legacy student snapshot table (used for seed/debug)                     |
| availability (legacy)       | Legacy availability table                                               |

### 6.2 Key Relationships

```bash
users ──< enrollments >── courses
users ──< pre_enrollments >── courses
users ──< waitlist >── courses
users ──< payments >── hour_packages
users ──< hour_transfers (from / to)
enrollments ──< class_bookings >── teacher_availability
teachers ──< courses
teachers ──< teacher_availability
fun_fact_tags ──< fun_facts
```

### 6.3 Business Rules Reflected in the Schema

- One enrollment per user+course (unique constraint on enrollments).
- One pre-enrollment per user+course (unique constraint on pre_enrollments).
- Enrollment status supports active, completed, transferred, canceled.
- Payment type supports package, extra_hour, trial; status includes pending, paid, failed, refunded.

---

## 7. Authentication & Authorization

- Email/password with JWT access token returned by /auth/login.
- Role values in DB: student and admin.
- API responses compute a derived role `unrolled_student` when a student lacks an active enrollment.
- Frontend route guards map to these roles for admin and student access control.

---

## 8. Payment Flow

```bash
Student selects package
       │
       ▼
POST /api/stripe/create-checkout-session
       │
       ▼
Redirect to Stripe hosted page
       │
       ▼
Stripe calls POST /api/stripe/webhook
       │
       └─ On paid: create payment record and update enrollment hours
```

Stripe metadata includes `package_id`, optional `course_id`, and optional `user_id` to associate records.

---

## 9. Notification Flow

Email is currently used for admin-driven messages via /api/admin/send-email, using HTML templates from Services/email_templates.py. WhatsApp support is planned but not wired in the current code.

---

## 10. Non-Functional Requirements

| Concern           | Decision                                                                  |
| ----------------- | ------------------------------------------------------------------------- |
| Mobile-first      | Frontend components are designed for small screens first                  |
| Localization      | UI in Portuguese (PT); prices in EUR                                      |
| Accessibility     | WCAG AA target; Bootstrap provides baseline                               |
| CORS              | Localhost-only in development; production origin via env var              |

---

## 11. Development Commands

### Frontend (frontend/)

```bash
npm install        # Install dependencies
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run preview    # Preview production build locally
npm run lint       # ESLint
```

### Backend (backend/)

```bash
pip install -r requirements.txt   # Note: file is UTF-16 LE encoded
uvicorn main:app --reload          # Start FastAPI dev server
```

No automated backend test command is defined yet. Document it here when added.

---

## 12. Coding Conventions & Agent Guidance

- Make targeted, minimal diffs; avoid broad refactors unless explicitly requested.
- Never edit generated or dependency folders: `frontend/node_modules`, `frontend/dist`, `backend/venv`, `__pycache__`.
- Preserve existing folder structure and naming unless reorganization is requested.
- When scope is unclear: confirm whether the change is frontend-only, backend-only, or full-stack before proceeding.
- If a request touches routing or layout, confirm expected navigation paths.
- If a request touches DB behavior, confirm DATABASE_URL and local DB availability.
- Link existing files in documentation rather than duplicating their content.
