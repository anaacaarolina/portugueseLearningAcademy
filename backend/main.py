from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import SessionLocal, engine
#from flask import Flask, request, jsonify
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
#app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///students.db"
#app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

#db.init_app(app)



import models

models.Base.metadata.create_all(bind=engine)

origins = [
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",  # If using CRA
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

#if __name__ == "__main__":
    #with app.app_context():
        #db.create_all()
    #app.run(debug=True)

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

@app.get("/api/students/{id}")
def get_student(id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "phone": student.phone,
        "course": student.course,
        "status": student.status,
        "notes": student.notes
    }


@app.post("/api/students/{id}/notes")
def save_notes(id: int, body: dict, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    student.notes = body.get("notes", "")
    db.commit()

    return {"message": "Notes saved"}


@app.delete("/api/students/{id}")
def delete_student(id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)
    db.commit()

    return {"message": "Student deleted"}
