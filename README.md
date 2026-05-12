# Portuguese Learning Academy

Portuguese Learning Academy is a full-stack web platform for managing language courses, enrollments, and student/admin workflows.

This repository contains:

- A React 19 + Vite frontend in frontend/
- A FastAPI + SQLAlchemy backend in backend/

For deeper system and data model details, see [architecture.md](architecture.md).

## Table of Contents

- [Portuguese Learning Academy](#portuguese-learning-academy)
  - [Table of Contents](#table-of-contents)
  - [Project Snapshot](#project-snapshot)
  - [Repository Structure](#repository-structure)
  - [Tech Stack](#tech-stack)
    - [Frontend Stack](#frontend-stack)
    - [Backend Stack](#backend-stack)
  - [Frontend](#frontend)
    - [App boot flow](#app-boot-flow)
    - [Implemented frontend routes](#implemented-frontend-routes)
  - [Backend](#backend)
    - [Current behavior](#current-behavior)
    - [Data layer](#data-layer)
  - [API and Routes](#api-and-routes)
    - [Router modules (backend/routers)](#router-modules-backendrouters)
    - [App-level endpoints (backend/main.py)](#app-level-endpoints-backendmainpy)
  - [Local Development Setup](#local-development-setup)
    - [Prerequisites](#prerequisites)
    - [1. Clone and open](#1-clone-and-open)
    - [2. Frontend setup](#2-frontend-setup)
    - [3. Backend setup](#3-backend-setup)
  - [Environment Variables](#environment-variables)
  - [Verification and Quality Checks](#verification-and-quality-checks)
  - [Known Notes and Pitfalls](#known-notes-and-pitfalls)
  - [Development Conventions](#development-conventions)

## Project Snapshot

Current implementation highlights:

- Frontend routing covers public, auth, admin, and student flows, with route-level role protection.
- Shared app shell is implemented through `MainLayout` (header + footer + page outlet).
- Backend combines modular routers (auth, courses, hour packages, fun facts, comments, Stripe) with app-level admin and student management endpoints.
- Stripe checkout is wired for hour package purchases, with webhook handling to update payments and enrollments.
- SQLAlchemy models and Pydantic schemas cover the core domain plus admin tools like comments and fun facts.

## Repository Structure

Top-level overview:

- frontend/: React app
- backend/: FastAPI app
- architecture.md: architecture and product/technical direction
- .github/copilot-instructions.md: repository-specific coding and editing guidance

Important source-of-truth files:

- Frontend route wiring: frontend/src/App.jsx
- Frontend bootstrap: frontend/src/main.jsx
- Shared layout wrapper: frontend/src/components/MainLayout/MainLayout.jsx
- Backend entrypoint: backend/main.py
- Backend DB/session setup: backend/database.py

## Tech Stack

### Frontend Stack

- React 19.2
- Vite 7.3.1
- React Router DOM 7.13
- Bootstrap 5.3
- TipTap, DOMPurify, React Select, Lucide, React Icons

### Backend Stack

- FastAPI
- SQLAlchemy
- Pydantic
- python-dotenv
- Stripe (checkout + webhook)
- PostgreSQL (via DATABASE_URL)

## Frontend

Frontend lives in frontend/ and uses a component/page structure by area.

### App boot flow

1. main.jsx mounts BrowserRouter and imports global Bootstrap and CSS.
2. App.jsx registers routes.
3. MainLayout wraps route content with Header and Footer.

### Implemented frontend routes

Public:

- /
- /courses
- /courses/:courseSlug
- /enrollment
- /payment
- /payment-success
- /payment-cancelled
- /fun-facts
- /fun-facts/:slug

Auth:

- /login
- /register

Admin (role: admin):

- /admin-dashboard
- /student-details
- /student-details/:id

Student (roles: student, unrolled_student):

- /student-dashboard

## Backend

Backend lives in backend/.

### Current behavior

- Loads environment variables from backend/.env.
- Reads DATABASE_URL from environment.
- Creates SQLAlchemy engine and SessionLocal.
- Creates all tables from models.Base.metadata on startup.
- Exposes health endpoints:
  - GET /
  - GET /api/test
- Configures CORS for:
  - ` http://localhost:5173 `
  - ` http://localhost:3000 `

### Data layer

Major entities are modeled in backend/models.py, including:

- users
- teachers
- courses, course_schedules, course_schedule_exceptions
- enrollments, pre_enrollments, waitlist
- hour_packages, payments, hour_transfers
- teacher_availability, class_bookings
- notifications
- fun_facts, fun_fact_tags, comments
- legacy/admin tables: students, availability

Pydantic schemas for API payloads are defined in backend/schemas.py.

## API and Routes

The backend exposes both router modules and app-level admin/student endpoints.

### Router modules (backend/routers)

- /auth
  - GET /me
  - POST /register
  - POST /login
  - POST /change-password
- /courses
  - GET /
  - POST /
  - PUT /{course_id}
  - DELETE /{course_id}
- /hour-packages
  - GET /
  - POST /
  - PUT /{package_id}
  - DELETE /{package_id}
- /fun-facts
  - GET /
  - POST /
  - PUT /{fact_id}
  - DELETE /{fact_id}
- /fun-fact-tags
  - GET /
  - POST /
  - PUT /{tag_id}
  - DELETE /{tag_id}
- /comments
  - GET /
  - POST /
  - PUT /{comment_id}
  - DELETE /{comment_id}
- /api/stripe
  - POST /create-checkout-session
  - POST /webhook

### App-level endpoints (backend/main.py)

- Admin helpers
  - GET /api/admin/email-recipients
  - POST /api/admin/send-email
  - GET /api/admin/dashboard-kpis
  - GET /api/admin/scheduled-classes
- Students
  - GET /api/students
  - POST /api/students
  - GET /api/students/{student_id}
  - PUT /api/students/{student_id}/profile
  - POST /api/students/{student_id}/hour-package
  - POST /api/students/{student_id}/course
  - POST /api/students/{student_id}/hours
  - PATCH /api/students/{student_id}/bookings/{booking_id}/attendance
  - POST /api/students/{id}/notes
  - DELETE /api/students/{id}
- Teachers
  - GET /api/teachers
  - POST /api/teachers
  - DELETE /api/teachers/{teacher_id}
  - GET /api/teachers/{teacher_id}/availability
  - POST /api/teachers/{teacher_id}/availability
  - GET /api/teachers/{teacher_id}/available-slots
  - GET /api/teachers/by_course/{course}
- Courses and hour packages (lightweight public lists)
  - GET /api/courses
  - GET /api/hour-packages
- Bookings
  - POST /api/bookings
- Debug
  - GET /api/debug/seed

## Local Development Setup

### Prerequisites

- Node.js 20.19 or newer (recommended for Vite 7.3.1)
- npm
- Python 3.11+
- PostgreSQL

### 1. Clone and open

```bash
git clone <your-repository-url>
cd portugueseLearningAcademy
```

### 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Useful frontend commands:

```bash
npm run build
npm run preview
npm run lint
```

Default dev URL is typically `http://localhost:5173`.

### 3. Backend setup

Create and activate a virtual environment, then install dependencies.

On Windows PowerShell:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs by default at `http://127.0.0.1:8000`.

## Environment Variables

Minimum required backend variable (from backend/.env.example):

```env
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/databaseName
```

Place this value in backend/.env before starting the backend.

## Verification and Quality Checks

Frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

Backend currently has no automated test command configured in this repository.

## Known Notes and Pitfalls

- backend/requirements.txt is encoded as UTF-16 LE. Some tools assume UTF-8 and may fail when reading it.
- backend/main.py currently auto-creates tables on startup via SQLAlchemy metadata.
- CORS is restricted to localhost origins in development.
- Avoid editing generated/dependency folders such as `frontend/node_modules`, `frontend/dist`, `backend/venv`, and `__pycache__`.

## Development Conventions

Follow the conventions already used in this repository:

- Keep frontend and backend changes scoped unless a task explicitly needs full-stack updates.
- Register frontend routes centrally in frontend/src/App.jsx.
- Keep one JSX + one CSS file co-located per page/component where applicable.
- Use functional React components and ES modules.
- Use backend/database.py get_db pattern for DB session lifecycle when adding API endpoints.
- Keep targeted, minimal diffs instead of broad refactors.
