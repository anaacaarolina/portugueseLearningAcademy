from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, APIRouter, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from sqlalchemy import inspect, text
from decimal import Decimal
from datetime import date, timedelta, time
import os

from database import SessionLocal, engine
import models
from routers.auth import router as auth_router
from routers.courses import router as courses_router
from routers.comments import router as comments_router
from routers.fun_facts import router as fun_facts_router
from routers.fun_fact_tags import router as fun_fact_tags_router
from routers.hour_packages import router as hour_packages_router
from routers.stripe_routes import router as stripe_router
from Services.auth_services import get_password_hash
from Services.email_service import send_email
from Services.email_templates import custom_message_email

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
app.include_router(stripe_router, prefix="/api/stripe", tags=["Stripe"])

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


def _parse_slot_time(value, default_value):
    if value is None or value == "":
        value = default_value

    if isinstance(value, time):
        return value

    if isinstance(value, str):
        try:
            return time.fromisoformat(value)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=f"Invalid time format: {value}. Expected HH:MM") from exc

    raise HTTPException(status_code=400, detail="Invalid time value")


def _seed_default_teacher_availability(db: Session, teacher_id: int, horizon_days: int = 56):
    valid_existing_count = (
        db.query(models.TeacherAvailability)
        .filter(
            models.TeacherAvailability.teacher_id == teacher_id,
            models.TeacherAvailability.date.isnot(None),
        )
        .count()
    )
    if valid_existing_count > 0:
        return

    today = date.today()
    default_slots = []

    for offset in range(horizon_days):
        slot_date = today + timedelta(days=offset)
        if slot_date.weekday() >= 5:
            continue

        default_slots.append(
            models.TeacherAvailability(
                teacher_id=teacher_id,
                date=slot_date,
                start_time=time(9, 0),
                end_time=time(17, 0),
                is_booked=False,
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


@app.get("/api/admin/email-recipients")
def get_admin_email_recipients(db: Session = Depends(get_db)):
    user_rows = (
        db.query(models.User.name, models.User.email)
        .filter(models.User.email.isnot(None))
        .all()
    )
    teacher_rows = (
        db.query(models.Teacher.name, models.Teacher.email)
        .filter(models.Teacher.email.isnot(None))
        .all()
    )

    recipients_by_email: dict[str, dict] = {}

    for row in user_rows:
        email = str(row.email or "").strip().lower()
        if not email or "@" not in email:
            continue

        if email not in recipients_by_email:
            recipients_by_email[email] = {
                "email": email,
                "name": str(row.name or "").strip() or email,
                "source": "user",
            }

    for row in teacher_rows:
        email = str(row.email or "").strip().lower()
        if not email or "@" not in email:
            continue

        if email not in recipients_by_email:
            recipients_by_email[email] = {
                "email": email,
                "name": str(row.name or "").strip() or email,
                "source": "teacher",
            }

    recipients = sorted(
        recipients_by_email.values(),
        key=lambda item: (str(item["name"]).lower(), str(item["email"]).lower()),
    )

    return recipients


@app.post("/api/admin/send-email")
def send_admin_email(body: dict):
    raw_to = body.get("to", [])
    subject = str(body.get("subject", "")).strip()
    message = str(body.get("message", "")).strip()

    if isinstance(raw_to, str):
        recipients = [segment.strip().lower() for segment in raw_to.split(",") if segment.strip()]
    elif isinstance(raw_to, list):
        recipients = [str(item).strip().lower() for item in raw_to if str(item).strip()]
    else:
        recipients = []

    deduped_recipients = []
    seen = set()
    for recipient in recipients:
        if "@" not in recipient or recipient in seen:
            continue
        seen.add(recipient)
        deduped_recipients.append(recipient)

    if not deduped_recipients:
        raise HTTPException(status_code=400, detail="Recipient email is required")

    if not subject:
        raise HTTPException(status_code=400, detail="Email subject is required")

    if not message:
        raise HTTPException(status_code=400, detail="Email body is required")

    html = custom_message_email(subject, message)

    for recipient in deduped_recipients:
        send_email(recipient, subject, html)

    return {
        "message": "Email sent successfully",
        "sentCount": len(deduped_recipients),
    }

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

    def _format_time(value):
        if value is None:
            return None
        if hasattr(value, "strftime"):
            return value.strftime("%H:%M")
        return str(value)[:5]

    for b in bookings:
        availability = db.query(models.TeacherAvailability).filter(
            models.TeacherAvailability.id == b.availability_id
        ).first()

        if not availability:
            continue

        result.append({
            "id": b.id,
            "status": b.status.value if hasattr(b.status, "value") else str(b.status),
            "date": availability.date.isoformat() if availability.date else None,
            "day": availability.date.strftime("%a") if availability.date else None,
            "start": _format_time(availability.start_time),
            "end": _format_time(availability.end_time),
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

    student_ids = [student.id for student in students]
    course_map = _get_student_course_map(db, student_ids)

    active_course_map = {}
    if student_ids:
        enrollment_rows = (
            db.query(
                models.Enrollment.user_id,
                models.Enrollment.course_id,
                models.Course.type,
            )
            .join(models.Course, models.Course.id == models.Enrollment.course_id)
            .filter(
                models.Enrollment.user_id.in_(student_ids),
                models.Enrollment.status == models.EnrollmentStatus.active,
            )
            .order_by(models.Enrollment.enrolled_at.desc().nullslast(), models.Enrollment.id.desc())
            .all()
        )

        for row in enrollment_rows:
            if row.user_id not in active_course_map:
                active_course_map[row.user_id] = {
                    "course_id": row.course_id,
                    "course_type": row.type.value if hasattr(row.type, "value") else str(row.type),
                }

    response_payload = []
    for student in students:
        payload = _serialize_student(student, course_map.get(student.id))
        active_course = active_course_map.get(student.id)
        if active_course:
            payload["activeCourseId"] = active_course["course_id"]
            payload["activeCourseType"] = active_course["course_type"]
        else:
            payload["activeCourseId"] = None
            payload["activeCourseType"] = None
        response_payload.append(payload)

    return response_payload

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
def delete_teacher(teacher_id: int, force: bool = False, db: Session = Depends(get_db)):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()

    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    has_bookings = (
        db.query(models.ClassBooking.id)
        .join(models.TeacherAvailability, models.TeacherAvailability.id == models.ClassBooking.availability_id)
        .filter(models.TeacherAvailability.teacher_id == teacher_id)
        .first()
        is not None
    )

    if has_bookings and not force:
        raise HTTPException(status_code=400, detail="Teacher has booked classes and cannot be deleted")

    if force:
        availability_ids = (
            db.query(models.TeacherAvailability.id)
            .filter(models.TeacherAvailability.teacher_id == teacher_id)
            .subquery()
        )
        db.query(models.ClassBooking).filter(
            models.ClassBooking.availability_id.in_(availability_ids)
        ).delete(synchronize_session=False)

    db.query(models.TeacherAvailability).filter(models.TeacherAvailability.teacher_id == teacher_id).delete(synchronize_session=False)
    db.query(models.Availability).filter(models.Availability.teacher_id == teacher_id).delete(synchronize_session=False)
    db.query(models.Course).filter(models.Course.teacher_id == teacher_id).update({"teacher_id": None}, synchronize_session=False)

    db.delete(teacher)
    db.commit()

    return {"message": "Teacher deleted successfully"}

@app.post("/api/teachers/{teacher_id}/availability")
def set_availability(teacher_id: int, data: list = Body(...), db: Session = Depends(get_db)):
    booked_ids = {
        row[0]
        for row in db.query(models.ClassBooking.availability_id)
        .join(models.TeacherAvailability, models.TeacherAvailability.id == models.ClassBooking.availability_id)
        .filter(models.TeacherAvailability.teacher_id == teacher_id)
        .all()
    }

    delete_query = db.query(models.TeacherAvailability).filter(models.TeacherAvailability.teacher_id == teacher_id)
    if booked_ids:
        delete_query = delete_query.filter(models.TeacherAvailability.id.notin_(booked_ids))
    delete_query.delete(synchronize_session=False)

    for slot in data:
        slot_date = _parse_slot_date(slot.get("date"))
        if slot_date is None:
            raise HTTPException(status_code=400, detail="Each slot must include a valid date")

        start_time = _parse_slot_time(slot.get("start"), "09:00")
        end_time = _parse_slot_time(slot.get("end"), "17:00")

        is_available = bool(slot.get("isAvailable", True))
        existing = db.query(models.TeacherAvailability).filter(
            models.TeacherAvailability.teacher_id == teacher_id,
            models.TeacherAvailability.date == slot_date,
            models.TeacherAvailability.start_time == start_time,
            models.TeacherAvailability.end_time == end_time,
        ).first()

        if existing:
            if not existing.is_booked:
                existing.is_booked = not is_available
            continue

        availability = models.TeacherAvailability(
            teacher_id=teacher_id,
            date=slot_date,
            start_time=start_time,
            end_time=end_time,
            is_booked=not is_available,
        )
        db.add(availability)
    db.commit()

    return {"message": "Availability updated"}

@app.get("/api/teachers/{teacher_id}/availability")
def get_availability(teacher_id: int, db: Session = Depends(get_db)):
    _seed_default_teacher_availability(db, teacher_id)
    db.commit()

    slots = (
        db.query(models.TeacherAvailability)
        .filter(
            models.TeacherAvailability.teacher_id == teacher_id,
            models.TeacherAvailability.date.isnot(None),
        )
        .order_by(models.TeacherAvailability.date.asc(), models.TeacherAvailability.start_time.asc())
        .all()
    )
    return [
        {
            "date": a.date.isoformat() if a.date else None,
            "start": a.start_time.strftime("%H:%M") if a.start_time else None,
            "end": a.end_time.strftime("%H:%M") if a.end_time else None,
            "isAvailable": not bool(a.is_booked),
        }
        for a in slots
    ]

@app.get("/api/teachers/{teacher_id}/available-slots")
def get_available_slots(teacher_id: int, db: Session = Depends(get_db)):
    _seed_default_teacher_availability(db, teacher_id)
    db.commit()

    slots = db.query(models.TeacherAvailability).filter(
        models.TeacherAvailability.teacher_id == teacher_id,
        models.TeacherAvailability.date.isnot(None),
        models.TeacherAvailability.is_booked == False,
    ).all()

    return [
        {
            "id": s.id,
            "date": s.date.isoformat() if s.date else None,
            "day": s.date.strftime("%a") if s.date else None,
            "start": s.start_time.strftime("%H:%M") if s.start_time else None,
            "end": s.end_time.strftime("%H:%M") if s.end_time else None
        }
        for s in slots
    ]


@app.get("/api/admin/scheduled-classes")
def get_scheduled_classes(db: Session = Depends(get_db)):
    scheduled_rows = (
        db.query(
            models.ClassBooking.id,
            models.ClassBooking.status,
            models.TeacherAvailability.date,
            models.TeacherAvailability.start_time,
            models.TeacherAvailability.end_time,
            models.Teacher.id.label("teacher_id"),
            models.Teacher.name.label("teacher_name"),
            models.User.id.label("student_id"),
            models.User.name.label("student_name"),
            models.Course.id.label("course_id"),
            models.Course.title.label("course_title"),
        )
        .join(models.Enrollment, models.Enrollment.id == models.ClassBooking.enrollment_id)
        .join(models.User, models.User.id == models.Enrollment.user_id)
        .join(models.TeacherAvailability, models.TeacherAvailability.id == models.ClassBooking.availability_id)
        .join(models.Teacher, models.Teacher.id == models.TeacherAvailability.teacher_id)
        .outerjoin(models.Course, models.Course.id == models.Enrollment.course_id)
        .filter(models.ClassBooking.status == models.BookingStatus.scheduled)
        .order_by(models.TeacherAvailability.date.asc(), models.TeacherAvailability.start_time.asc(), models.ClassBooking.id.asc())
        .all()
    )

    return [
        {
            "bookingId": row.id,
            "status": row.status.value if hasattr(row.status, "value") else str(row.status),
            "date": row.date.isoformat() if row.date else None,
            "day": row.date.strftime("%a") if row.date else None,
            "start": row.start_time.strftime("%H:%M") if row.start_time else None,
            "end": row.end_time.strftime("%H:%M") if row.end_time else None,
            "teacherId": row.teacher_id,
            "teacherName": row.teacher_name,
            "studentId": row.student_id,
            "studentName": row.student_name,
            "courseId": row.course_id,
            "courseTitle": row.course_title,
        }
        for row in scheduled_rows
        if row.date is not None
    ]


@app.get("/api/admin/dashboard-kpis")
def get_dashboard_kpis(db: Session = Depends(get_db)):
    active_students = (
        db.query(models.User)
        .filter(models.User.role == models.UserRole.student)
        .filter((models.User.is_active.is_(True)) | (models.User.is_active.is_(None)))
        .count()
    )

    total_courses = db.query(models.Course).count()

    revenue_total = (
        db.query(func.coalesce(func.sum(models.Payment.amount), 0))
        .filter(
            models.Payment.status == models.PaymentStatus.paid,
            models.Payment.type == models.PaymentType.package,
            models.Payment.package_id.isnot(None),
        )
        .scalar()
    )

    return {
        "activeStudents": active_students,
        "totalCourses": total_courses,
        "totalRevenue": float(revenue_total or 0),
    }

@app.post("/api/bookings")
def create_booking(data: dict, db: Session = Depends(get_db)):
    student_id = data["studentId"]
    teacher_id = data["teacherId"]
    slots = data["slots"]

    def _time_to_minutes(value):
        if not value:
            return None
        if hasattr(value, "hour") and hasattr(value, "minute"):
            return value.hour * 60 + value.minute
        parts = str(value).split(":")
        if len(parts) < 2:
            return None
        try:
            hours = int(parts[0])
            minutes = int(parts[1])
        except ValueError:
            return None
        return hours * 60 + minutes

    def _minutes_to_time_label(total_minutes):
        if total_minutes is None:
            return None
        hours = total_minutes // 60
        minutes = total_minutes % 60
        return time(hour=hours, minute=minutes)

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
        availability = db.query(models.TeacherAvailability).filter(
            models.TeacherAvailability.id == slot["id"],
            models.TeacherAvailability.is_booked == False
        ).first()

        if not availability:
            raise HTTPException(status_code=400, detail="Slot not available")

        slot_start = slot.get("start")
        slot_end = slot.get("end")
        if slot_start and slot_end:
            availability_start = _time_to_minutes(availability.start_time)
            availability_end = _time_to_minutes(availability.end_time)
            requested_start = _time_to_minutes(slot_start)
            requested_end = _time_to_minutes(slot_end)

            if None in (availability_start, availability_end, requested_start, requested_end):
                raise HTTPException(status_code=400, detail="Invalid time values")

            if requested_end <= requested_start:
                raise HTTPException(status_code=400, detail="Invalid time window")

            if requested_start < availability_start or requested_end > availability_end:
                raise HTTPException(status_code=400, detail="Requested slot is outside availability")

            if requested_start > availability_start:
                db.add(models.TeacherAvailability(
                    teacher_id=availability.teacher_id,
                    date=availability.date,
                    start_time=_minutes_to_time_label(availability_start),
                    end_time=_minutes_to_time_label(requested_start),
                    is_booked=False,
                ))

            if requested_end < availability_end:
                db.add(models.TeacherAvailability(
                    teacher_id=availability.teacher_id,
                    date=availability.date,
                    start_time=_minutes_to_time_label(requested_end),
                    end_time=_minutes_to_time_label(availability_end),
                    is_booked=False,
                ))

            availability.start_time = _minutes_to_time_label(requested_start)
            availability.end_time = _minutes_to_time_label(requested_end)

        availability.is_booked = True

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
