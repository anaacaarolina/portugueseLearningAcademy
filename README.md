# Portuguese Learning Academy

Portuguese Learning Academy is a full-stack web platform for managing language courses, enrollments, and student learning flows.

This repository currently contains:

- A React 19 + Vite frontend in frontend/
- A FastAPI + SQLAlchemy backend in backend/

The project is designed to support A1-C2 Portuguese courses and Business English, with room for payments, waitlists, notifications, and student/admin workflows.

## Table of Contents

- Project Snapshot
- Architecture
- Repository Structure
- Tech Stack
- Frontend
- Backend
- Domain Model Summary
- API and Routes
- Local Development Setup
- Environment Variables
- Verification and Quality Checks
- Known Notes and Pitfalls
- Development Conventions
- Roadmap Alignment

## Project Snapshot

Current implementation status:

- Frontend routing and UI pages are in place for public, auth, student, and admin views.
- Shared app shell is implemented through MainLayout (header + footer + page outlet).
- Backend app bootstraps FastAPI, enables CORS for localhost origins, and creates database tables from SQLAlchemy models on startup.
- A minimal health-style API is available at / and /api/test.
- SQLAlchemy models and Pydantic schemas for major business entities already exist.

## Architecture

The project follows a decoupled SPA + API architecture:

- Browser SPA (React + Vite) communicates with backend via REST/JSON.
- Backend (FastAPI) handles business logic and data access.
- Database layer uses PostgreSQL through SQLAlchemy.

For full architecture details, business flows, and future modular router/service design, see architecture.md.

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

### Frontend

- React 19
- Vite 7.3.1
- React Router DOM 7
- Bootstrap 5
- ESLint 9

### Backend

- FastAPI
- SQLAlchemy
- Pydantic
- python-dotenv
- PostgreSQL (via DATABASE_URL)

## Frontend

Frontend lives in frontend/ and uses a component/page structure by area.

### App boot flow

1. main.jsx mounts BrowserRouter and imports global Bootstrap and CSS.
2. App.jsx registers routes.
3. MainLayout wraps route content with Header and Footer.

### Implemented frontend routes (current)

- /
- /course
- /courses
- /enrollment
- /payment
- /login
- /register
- /fun-fact
- /fun-facts
- /admin-dashboard
- /student-dashboard
- /student-details

## Backend

Backend lives in backend/.

### Current behavior

- Loads environment variables from backend/.env.
- Reads DATABASE_URL from environment.
- Creates SQLAlchemy engine and SessionLocal.
- Creates all tables from models.Base.metadata on startup.
- Exposes endpoints:
  - GET /
  - GET /api/test
- Configures CORS for:
  - http://localhost:5173
  - http://localhost:3000

### Data layer

Major entities are modeled in backend/models.py, including:

- users
- teachers
- courses
- course_schedules
- enrollments
- pre_enrollments
- waitlist
- hour_packages
- payments
- hour_transfers
- teacher_availability
- class_bookings
- notifications

Pydantic schemas for API payloads are defined in backend/schemas.py.

## Domain Model Summary

The schema already reflects core business constraints such as:

- one enrollment per user+course pair
- one pre-enrollment per user+course pair
- payment tracking by status/type
- waitlist position and lifecycle states
- hour package and transfer support

For an expanded explanation of business rules and relationship mapping, see architecture.md.

## API and Routes

At this stage, backend exposes only bootstrap endpoints:

- GET / -> backend status message
- GET /api/test -> API connectivity message

The architecture document outlines target domains for future router modules such as auth, courses, enrollments, waitlist, bookings, payments, notifications, and admin operations.

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

Default dev URL is typically http://localhost:5173.

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

Backend runs by default at http://127.0.0.1:8000.

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
- Avoid editing generated/dependency folders such as frontend/node_modules, frontend/dist, backend/venv, and **pycache**.

## Development Conventions

Follow the conventions already used in this repository:

- Keep frontend and backend changes scoped unless a task explicitly needs full-stack updates.
- Register frontend routes centrally in frontend/src/App.jsx.
- Keep one JSX + one CSS file co-located per page/component where applicable.
- Use functional React components and ES modules.
- Use backend/database.py get_db pattern for DB session lifecycle when adding API endpoints.
- Keep targeted, minimal diffs instead of broad refactors.

## Roadmap Alignment

This repository already contains a strong data model and frontend page structure aligned with the architecture goals. The next major milestone is to connect frontend flows to dedicated FastAPI router modules and service-layer business logic described in architecture.md.
