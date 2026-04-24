from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, APIRouter, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from sqlalchemy import inspect, text
from decimal import Decimal
from datetime import date, timedelta
import os

from database import SessionLocal, engine
import models
from routers.auth import router as auth_router
from routers.courses import router as courses_router
from routers.comments import router as comments_router
from routers.fun_facts import router as fun_facts_router
from routers.fun_fact_tags import router as fun_fact_tags_router
from routers.hour_packages import router as hour_packages_router
from Services.auth_services import get_password_hash

import uuid

app = FastAPI(title="Portuguese Academy API")

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Autenticação"])
app.include_router(courses_router, prefix="/courses", tags=["Cursos"])
app.include_router(comments_router, prefix="/comments", tags=["Comments"])
app.include_router(fun_facts_router, prefix="/fun-facts", tags=["Fun Facts"])
app.include_router(fun_fact_tags_router, prefix="/fun-fact-tags", tags=["Fun Fact Tags"])
app.include_router(hour_packages_router, prefix="/hour-packages", tags=["Hour Packages"])

DEFAULT_STUDENT_PASSWORD = os.getenv("DEFAULT_STUDENT_PASSWORD", "PLA2026")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _normalize_student_is_active(student):
    if student.is_active is None:
        return True

    return bool(student.is_active)


def _get_student_course_map(db: Session, student_ids: list[int]):
    if not student_ids:
        return {}

    enrollment_rows = (
        db.query(
            models.Enrollment.user_id,
            models.Course.title,
            models.Enrollment.enrolled_at,
            models.Enrollment.id,
        )
        .join(models.Course, models.Course.id == models.Enrollment.course_id)
        .filter(
            models.Enrollment.user_id.in_(student_ids),
            models.Enrollment.status == models.EnrollmentStatus.active,
        )
        .order_by(models.Enrollment.enrolled_at.desc(), models.Enrollment.id.desc())
        .all()
    )

    course_map = {}
    for row in enrollment_rows:
        if row.user_id not in course_map:
            course_map[row.user_id] = row.title

    return course_map


def _get_student_hour_package(db: Session, student_id: int):
    payment_row = (
        db.query(models.Payment, models.HourPackage)
        .join(models.HourPackage, models.HourPackage.id == models.Payment.package_id)
        .filter(
            models.Payment.user_id == student_id,
            models.Payment.status == models.PaymentStatus.paid,
            models.Payment.type == models.PaymentType.package,
            models.Payment.package_id.isnot(None),
        )
        .order_by(models.Payment.paid_at.desc().nullslast(), models.Payment.id.desc())
        .first()
    )

    if not payment_row:
        return None

    payment, hour_package = payment_row

    return {
        "id": hour_package.id,
        "name": hour_package.name,
        "hours": float(hour_package.hours or 0),
        "price": float(hour_package.price or 0),
        "isTrial": hour_package.is_trial,
        "isActive": hour_package.is_active,
        "isPopular": hour_package.is_popular,
        "paidAt": payment.paid_at,
    }


def _get_active_enrollment(db: Session, student_id: int):
    return (
        db.query(models.Enrollment)
        .filter(
            models.Enrollment.user_id == student_id,
            models.Enrollment.status == models.EnrollmentStatus.active,
        )
        .order_by(models.Enrollment.enrolled_at.desc().nullslast(), models.Enrollment.id.desc())
        .first()
    )


def _parse_slot_date(value):
    if not value:
        return None

    if isinstance(value, date):
        return value

    if isinstance(value, str):
        try:
            return date.fromisoformat(value)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=f"Invalid date format: {value}. Expected YYYY-MM-DD") from exc

    raise HTTPException(status_code=400, detail="Invalid date value")


def _seed_default_teacher_availability(db: Session, teacher_id: int, horizon_days: int = 56):
    valid_existing_count = (
        db.query(models.Availability)
        .filter(
            models.Availability.teacher_id == teacher_id,
            models.Availability.slot_date.isnot(None),
        )
        .count()
    )
    if valid_existing_count > 0:
        return

    db.query(models.Availability).filter(
        models.Availability.teacher_id == teacher_id,
        models.Availability.slot_date.is_(None),
    ).delete()

    today = date.today()
    default_slots = []

    for offset in range(horizon_days):
        slot_date = today + timedelta(days=offset)
        if slot_date.weekday() >= 5:
            continue

        default_slots.append(
            models.Availability(
                teacher_id=teacher_id,
                slot_date=slot_date,
                start_time="09:00",
                end_time="17:00",
                is_available=True,
            )
        )

    if default_slots:
        db.add_all(default_slots)


def _build_hours_summary(enrollment):
    if not enrollment:
        return {
            "total": 0,
            "used": 0,
            "remaining": 0,
        }

    total_hours = Decimal(enrollment.hours_total or 0)
    used_hours = Decimal(enrollment.hours_used or 0)
    remaining_hours = max(total_hours - used_hours, Decimal("0"))

    return {
        "total": float(total_hours),
        "used": float(used_hours),
        "remaining": float(remaining_hours),
    }


def _get_student_or_404(db: Session, student_id: int):
    student = (
        db.query(models.User)
        .filter(models.User.id == student_id, models.User.role == models.UserRole.student)
        .first()
    )

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return student


def _serialize_student(student, course_title=None):
    is_active = _normalize_student_is_active(student)

    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "phone": student.phone,
        "course": course_title,
        "is_active": is_active,
        "status": "Active" if is_active else "Inactive",
        "notes": student.notes,
        "enrollmentDate": student.created_at,
    }


@app.get("/")
def root():
    return {"message": "Backend is running!"}

@app.get("/api/test")
def test():
    return {"data": "Hello from FastAPI"}

@app.get("/api/debug/seed")
def seed_students(db: Session = Depends(get_db)):
    students = [
        {
            "name": "Ana Costa",
            "email": "ana.costa@email.com",
            "phone": "+351 912 345 111",
            "course": "Beginner A1-A2",
            "status": "Active",
        },
        {
            "name": "Miguel Ferreira",
            "email": "miguel.ferreira@email.com",
            "phone": "+351 915 889 002",
            "course": "Intermediate B1",
            "status": "Active",
        },
        {
            "name": "Sofia Mendes",
            "email": "sofia.mendes@email.com",
            "phone": "+351 936 778 210",
            "course": "Business Portuguese",
            "status": "Pending",
        },
    ]

    for s in students:
        db.add(models.Student(**s))

    db.commit()

    return {"message": "Seeded successfully"}

@app.get("/api/students/{student_id}")
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = _get_student_or_404(db, student_id)

    course_map = _get_student_course_map(db, [student.id])
    active_enrollment = _get_active_enrollment(db, student_id)

    bookings = (
        db.query(models.ClassBooking)
        .join(models.Enrollment, models.Enrollment.id == models.ClassBooking.enrollment_id)
        .filter(models.Enrollment.user_id == student_id)
        .all()
    )

    result = []

    for b in bookings:
        availability = db.query(models.Availability).filter(
            models.Availability.id == b.availability_id
        ).first()

        if not availability:
            continue

        result.append({
            "id": b.id,
            "status": b.status.value if hasattr(b.status, "value") else str(b.status),
            "date": availability.slot_date.isoformat() if availability.slot_date else None,
            "day": availability.slot_date.strftime("%a") if availability.slot_date else None,
            "start": availability.start_time,
            "end": availability.end_time,
            "teacherId": availability.teacher_id
        })

    student_payload = _serialize_student(student, course_map.get(student.id))
    student_payload["bookings"] = result
    student_payload["hourPackage"] = _get_student_hour_package(db, student.id)
    student_payload["hoursSummary"] = _build_hours_summary(active_enrollment)
    student_payload["activeCourseId"] = active_enrollment.course_id if active_enrollment else None

    return student_payload


@app.get("/api/hour-packages")
def list_hour_packages_api(db: Session = Depends(get_db)):
    packages = (
        db.query(models.HourPackage)
        .order_by(models.HourPackage.is_popular.desc(), models.HourPackage.created_at.desc())
        .all()
    )

    return [
        {
            "id": package.id,
            "name": package.name,
            "hours": float(package.hours or 0),
            "price": float(package.price or 0),
            "is_trial": bool(package.is_trial),
            "is_active": bool(package.is_active),
            "is_popular": bool(package.is_popular),
        }
        for package in packages
    ]


@app.get("/api/courses")
def list_courses_api(db: Session = Depends(get_db)):
    courses = (
        db.query(models.Course)
        .order_by(models.Course.created_at.desc())
        .all()
    )

    return [
        {
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "level": course.level.value if hasattr(course.level, "value") else str(course.level),
            "type": course.type.value if hasattr(course.type, "value") else str(course.type),
            "start_date": course.start_date.isoformat() if course.start_date else None,
            "end_date": course.end_date.isoformat() if course.end_date else None,
            "total_hours": float(course.total_hours) if course.total_hours is not None else None,
            "max_students": course.max_students,
            "regime": course.regime.value if hasattr(course.regime, "value") else str(course.regime),
            "location": course.location,
            "status": course.status.value if hasattr(course.status, "value") else str(course.status),
        }
        for course in courses
    ]


@app.put("/api/students/{student_id}/profile")
def update_student_profile(student_id: int, body: dict, db: Session = Depends(get_db)):
    student = _get_student_or_404(db, student_id)

    name = str(body.get("name", "")).strip()
    email = str(body.get("email", "")).strip().lower()
    phone = str(body.get("phone", "")).strip()

    if not name:
        raise HTTPException(status_code=400, detail="Student name is required")

    if not email:
        raise HTTPException(status_code=400, detail="Student email is required")

    existing_email_owner = (
        db.query(models.User)
        .filter(models.User.email == email, models.User.id != student_id)
        .first()
    )
    if existing_email_owner:
        raise HTTPException(status_code=400, detail="Email is already in use")

    student.name = name
    student.email = email
    student.phone = phone
    db.commit()

    return {"message": "Student profile updated"}


@app.post("/api/students/{student_id}/hour-package")
def change_student_hour_package(student_id: int, body: dict, db: Session = Depends(get_db)):
    _get_student_or_404(db, student_id)

    package_id = body.get("packageId")
    if not package_id:
        raise HTTPException(status_code=400, detail="Package id is required")

    package = db.query(models.HourPackage).filter(models.HourPackage.id == package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Hour package not found")

    payment = models.Payment(
        user_id=student_id,
        package_id=package.id,
        amount=package.price,
        status=models.PaymentStatus.paid,
        type=models.PaymentType.package,
        paid_at=func.now(),
        stripe_payment_id=f"manual_{uuid.uuid4().hex[:24]}",
    )
    db.add(payment)

    enrollment = _get_active_enrollment(db, student_id)
    if enrollment:
        package_hours = Decimal(package.hours or 0)
        used_hours = Decimal(enrollment.hours_used or 0)
        enrollment.hours_total = max(package_hours, used_hours)

    db.commit()
    return {"message": "Hour package changed successfully"}


@app.post("/api/students/{student_id}/course")
def assign_student_to_course(student_id: int, body: dict, db: Session = Depends(get_db)):
    _get_student_or_404(db, student_id)

    course_id = body.get("courseId")
    if not course_id:
        raise HTTPException(status_code=400, detail="Course id is required")

    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    active_enrollment = _get_active_enrollment(db, student_id)
    if active_enrollment and active_enrollment.course_id == course.id:
        return {"message": "Student is already assigned to this course"}

    existing_enrollment_for_course = (
        db.query(models.Enrollment)
        .filter(models.Enrollment.user_id == student_id, models.Enrollment.course_id == course.id)
        .first()
    )

    if active_enrollment and active_enrollment.course_id != course.id:
        active_enrollment.status = models.EnrollmentStatus.transferred

    initial_hours = Decimal("0")
    hour_package = _get_student_hour_package(db, student_id)
    if hour_package:
        initial_hours = Decimal(str(hour_package.get("hours", 0)))

    if existing_enrollment_for_course:
        existing_enrollment_for_course.status = models.EnrollmentStatus.active
        if existing_enrollment_for_course.hours_total is None:
            existing_enrollment_for_course.hours_total = initial_hours
        if existing_enrollment_for_course.enrolled_at is None:
            existing_enrollment_for_course.enrolled_at = func.now()
    else:
        db.add(
            models.Enrollment(
                user_id=student_id,
                course_id=course.id,
                status=models.EnrollmentStatus.active,
                hours_total=initial_hours,
                hours_used=Decimal("0"),
                enrolled_at=func.now(),
            )
        )

    db.commit()

    return {"message": "Student assigned to course successfully"}


@app.post("/api/students/{student_id}/hours")
def add_student_hours(student_id: int, body: dict, db: Session = Depends(get_db)):
    _get_student_or_404(db, student_id)
    enrollment = _get_active_enrollment(db, student_id)

    if not enrollment:
        raise HTTPException(status_code=400, detail="Student has no active enrollment")

    try:
        hours_to_add = Decimal(str(body.get("hours", "0")))
    except Exception:
        raise HTTPException(status_code=400, detail="Hours must be a valid number")

    if hours_to_add <= 0:
        raise HTTPException(status_code=400, detail="Hours to add must be greater than zero")

    enrollment.hours_total = Decimal(enrollment.hours_total or 0) + hours_to_add
    db.commit()

    return {
        "message": "Hours added successfully",
        "hoursSummary": _build_hours_summary(enrollment),
    }


@app.patch("/api/students/{student_id}/bookings/{booking_id}/attendance")
def update_student_attendance(student_id: int, booking_id: int, body: dict, db: Session = Depends(get_db)):
    _get_student_or_404(db, student_id)

    status_raw = str(body.get("status", "")).strip().lower()
    allowed_statuses = {
        models.BookingStatus.scheduled.value,
        models.BookingStatus.completed.value,
        models.BookingStatus.cancelled.value,
        models.BookingStatus.no_show.value,
    }
    if status_raw not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid attendance status")

    booking = (
        db.query(models.ClassBooking)
        .join(models.Enrollment, models.Enrollment.id == models.ClassBooking.enrollment_id)
        .filter(models.ClassBooking.id == booking_id, models.Enrollment.user_id == student_id)
        .first()
    )

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found for student")

    booking.status = models.BookingStatus(status_raw)
    db.commit()

    return {"message": "Attendance updated"}


@app.post("/api/students/{id}/notes")
def save_notes(id: int, body: dict, db: Session = Depends(get_db)):
    student = (
        db.query(models.User)
        .filter(models.User.id == id, models.User.role == models.UserRole.student)
        .first()
    )

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.notes = body.get("notes", "")
    db.commit()

    return {"message": "Notes saved"}

@app.get("/api/students")
def get_students(db: Session = Depends(get_db)):
    students = (
        db.query(models.User)
        .filter(models.User.role == models.UserRole.student)
        .order_by(models.User.created_at.desc())
        .all()
    )

    course_map = _get_student_course_map(db, [student.id for student in students])

    return [_serialize_student(student, course_map.get(student.id)) for student in students]

@app.post("/api/students")
def create_student(data: dict, db: Session = Depends(get_db)):
    is_active = data.get("is_active")

    if isinstance(is_active, str):
        is_active = is_active.lower() in {"true", "1", "yes", "on"}
    elif is_active is None and "status" in data:
        is_active = str(data["status"]).strip().lower() == "active"
    elif is_active is None:
        is_active = True

    student = models.User(
        name=data["name"],
        email=data["email"],
        phone=data["phone"],
        password=get_password_hash(DEFAULT_STUDENT_PASSWORD),
        role=models.UserRole.student,
        is_active=bool(is_active),
        notes=data.get("notes", ""),
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    return {
        "message": "Student created",
        "id": student.id,
        "temporary_password": DEFAULT_STUDENT_PASSWORD,
    }

@app.delete("/api/students/{id}")
def delete_student(id: int, db: Session = Depends(get_db)):
    student = (
        db.query(models.User)
        .filter(models.User.id == id, models.User.role == models.UserRole.student)
        .first()
    )

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)
    db.commit()
    return {"message": "Student deleted"}

@app.post("/api/teachers")
def create_teacher(data: dict, db: Session = Depends(get_db)):
    teacher = models.Teacher(
        name=data["name"],
        email=data["email"],
        bio=data.get("bio"),
        photo_url=data.get("photo_url"),
        course=data.get("course"),
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    _seed_default_teacher_availability(db, teacher.id)
    db.commit()

    return {"id": teacher.id}

@app.get("/api/teachers")
def get_teachers(db: Session = Depends(get_db)):
    teachers = db.query(models.Teacher).all()

    teacher_ids = [teacher.id for teacher in teachers]
    course_rows = (
        db.query(models.Course.teacher_id, models.Course.title)
        .filter(models.Course.teacher_id.in_(teacher_ids))
        .all()
        if teacher_ids
        else []
    )

    course_map: dict[int, list[str]] = {}
    for row in course_rows:
        if row.teacher_id is None:
            continue
        course_map.setdefault(int(row.teacher_id), []).append(row.title)

    return [
        {
            "id": t.id,
            "name": t.name,
            "course": ", ".join(course_map.get(int(t.id), [])) or t.course,
        }
        for t in teachers
    ]

@app.delete("/api/teachers/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()

    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    db.delete(teacher)
    db.commit()

    return {"message": "Teacher deleted successfully"}

@app.post("/api/teachers/{teacher_id}/availability")
def set_availability(teacher_id: int, data: list = Body(...), db: Session = Depends(get_db)):

    db.query(models.Availability).filter(models.Availability.teacher_id == teacher_id).delete()

    for slot in data:
        slot_date = _parse_slot_date(slot.get("date"))
        if slot_date is None:
            raise HTTPException(status_code=400, detail="Each slot must include a valid date")

        start_time = slot.get("start") or "09:00"
        end_time = slot.get("end") or "17:00"

        availability = models.Availability(
            teacher_id=teacher_id,
            slot_date=slot_date,
            start_time=start_time,
            end_time=end_time,
            is_available=bool(slot.get("isAvailable", True)),
        )
        db.add(availability)
    db.commit()

    return {"message": "Availability updated"}

@app.get("/api/teachers/{teacher_id}/availability")
def get_availability(teacher_id: int, db: Session = Depends(get_db)):
    _seed_default_teacher_availability(db, teacher_id)
    db.commit()

    slots = (
        db.query(models.Availability)
        .filter(
            models.Availability.teacher_id == teacher_id,
            models.Availability.slot_date.isnot(None),
        )
        .order_by(models.Availability.slot_date.asc(), models.Availability.start_time.asc())
        .all()
    )
    return [
        {
            "date": a.slot_date.isoformat() if a.slot_date else None,
            "start": a.start_time,
            "end": a.end_time,
            "isAvailable": bool(a.is_available),
        }
        for a in slots
    ]

@app.get("/api/teachers/{teacher_id}/available-slots")
def get_available_slots(teacher_id: int, db: Session = Depends(get_db)):
    slots = db.query(models.Availability).filter(
        models.Availability.teacher_id == teacher_id,
        models.Availability.slot_date.isnot(None),
        models.Availability.is_available == True,
    ).all()

    return [
        {
            "id": s.id,
            "date": s.slot_date.isoformat() if s.slot_date else None,
            "day": s.slot_date.strftime("%a") if s.slot_date else None,
            "start": s.start_time,
            "end": s.end_time
        }
        for s in slots
    ]

@app.post("/api/bookings")
def create_booking(data: dict, db: Session = Depends(get_db)):
    student_id = data["studentId"]
    teacher_id = data["teacherId"]
    slots = data["slots"]

    enrollment = (
        db.query(models.Enrollment)
        .filter(
            models.Enrollment.user_id == student_id,
            models.Enrollment.status == models.EnrollmentStatus.active,
        )
        .order_by(models.Enrollment.enrolled_at.desc(), models.Enrollment.id.desc())
        .first()
    )

    if not enrollment:
        raise HTTPException(status_code=400, detail="Student has no active enrollment")

    for slot in slots:
        availability = db.query(models.Availability).filter(
            models.Availability.id == slot["id"],
            models.Availability.is_available == True
        ).first()

        if not availability:
            raise HTTPException(status_code=400, detail="Slot not available")

        availability.is_available = False

        booking = models.ClassBooking(
            enrollment_id=enrollment.id,
            availability_id=availability.id,
            status="scheduled",
            booked_at=func.now()
        )

        db.add(booking)

    db.commit()

    return {"message": "Classes booked"}

@app.get("/api/teachers/by_course/{course}")
def get_teachers_by_course(course: str, db: Session = Depends(get_db)):
    teachers = db.query(models.Teacher).filter(
        models.Teacher.course == course
    ).all()

    return [
        {
            "id": t.id,
            "name": t.name,
            "course": t.course
        }
        for t in teachers
    ]
