from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, APIRouter, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from sqlalchemy import inspect, text

from database import SessionLocal, engine
from services.email_service import send_email
import models
from routers.auth import router as auth_router
from routers.courses import router as courses_router
from routers.comments import router as comments_router
from routers.fun_facts import router as fun_facts_router
from routers.fun_fact_tags import router as fun_fact_tags_router
from routers.hour_packages import router as hour_packages_router

import uuid

models.Base.metadata.create_all(bind=engine)

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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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

    student = db.query(models.Student).filter(
        models.Student.id == student_id
    ).first()

    bookings = db.query(models.ClassBooking).filter(
        models.ClassBooking.student_id == student_id
    ).all()

    result = []

    for b in bookings:
        availability = db.query(models.Availability).filter(
            models.Availability.id == b.availability_id
        ).first()

        result.append({
            "id": b.id,
            "status": b.status,
            "day": availability.day_of_week,
            "start": availability.start_time,
            "end": availability.end_time,
            "teacherId": availability.teacher_id
        })

    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "phone": student.phone,
        "course": student.course,
        "status": student.status,
        "notes": student.notes,
        "bookings": result
    }


@app.post("/api/students/{id}/notes")
def save_notes(id: int, body: dict, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.notes = body.get("notes", "")
    db.commit()

    return {"message": "Notes saved"}

@app.get("/api/students")
def get_students(db: Session = Depends(get_db)):
    students = db.query(models.Student).all()

    return [
        {
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "phone": s.phone,
            "course": s.course,
            "status": s.status,
            "notes": s.notes,
        }
        for s in students
    ]

@app.post("/api/students")
def create_student(data: dict, db: Session = Depends(get_db)):
    student = models.Student(
        name=data["name"],
        email=data["email"],
        phone=data["phone"],
        course=data["course"],
        status=data["status"],
        notes=""
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    return {"message": "Student created", "id": student.id}

@app.delete("/api/students/{id}")
def delete_student(id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == id).first()

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
        course=data["course"],
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    return {"id": teacher.id}

@app.get("/api/teachers")
def get_teachers(db: Session = Depends(get_db)):
    teachers = db.query(models.Teacher).all()

    return [
        {
            "id": t.id,
            "name": t.name,
            "course": t.course,
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
        availability = models.Availability(
            teacher_id=teacher_id,
            day_of_week=slot["day"],
            start_time=slot["start"],
            end_time=slot["end"]
        )
        db.add(availability)
    db.commit()

    return {"message": "Availability updated"}

@app.get("/api/teachers/{teacher_id}/availability")
def get_availability(teacher_id: int, db: Session = Depends(get_db)):
    slots = db.query(models.Availability).filter(models.Availability.teacher_id == teacher_id).all()
    return [
        {
            "day": a.day_of_week,
            "start": a.start_time,
            "end": a.end_time
        }
        for a in slots
    ]

@app.get("/api/teachers/{teacher_id}/available-slots")
def get_available_slots(teacher_id: int, db: Session = Depends(get_db)):
    slots = db.query(models.Availability).filter(
        models.Availability.teacher_id == teacher_id,
        models.Availability.is_available == True
    ).all()

    return [
        {
            "id": s.id,
            "day": s.day_of_week,
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

    for slot in slots:
        availability = db.query(models.Availability).filter(
            models.Availability.id == slot["id"],
            models.Availability.is_available == True
        ).first()

        if not availability:
            raise HTTPException(status_code=400, detail="Slot not available")

        availability.is_available = False

        booking = models.ClassBooking(
            student_id=student_id,
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
