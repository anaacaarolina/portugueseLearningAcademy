from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Course, Teacher
from schemas import CourseCreate, CourseResponse, CourseUpdate

router = APIRouter()


def _validate_date_range(start_date, end_date) -> None:
    if start_date and end_date and end_date < start_date:
        raise HTTPException(status_code=400, detail="End date cannot be before start date")


def _validate_numeric_fields(total_hours, max_students) -> None:
    if total_hours is not None and total_hours <= 0:
        raise HTTPException(status_code=400, detail="Total hours must be greater than zero")
    if max_students is not None and max_students <= 0:
        raise HTTPException(status_code=400, detail="Max students must be greater than zero")


def _validate_teacher(teacher_id: int | None, db: Session) -> None:
    if teacher_id is None:
        return

    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=400, detail="Invalid teacher_id")


@router.get("/", response_model=list[CourseResponse])
def list_courses(db: Session = Depends(get_db)):
    return (
        db.query(Course)
        .order_by(Course.type.asc(), Course.level.asc(), Course.created_at.desc())
        .all()
    )


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(course_data: CourseCreate, db: Session = Depends(get_db)):
    title = course_data.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Course title is required")

    _validate_numeric_fields(course_data.total_hours, course_data.max_students)
    _validate_date_range(course_data.start_date, course_data.end_date)
    _validate_teacher(course_data.teacher_id, db)

    course = Course(
        title=title,
        description=course_data.description.strip() if course_data.description else None,
        level=course_data.level,
        type=course_data.type,
        regime=course_data.regime,
        start_date=course_data.start_date,
        end_date=course_data.end_date,
        total_hours=course_data.total_hours,
        max_students=course_data.max_students,
        location=course_data.location.strip() if course_data.location else None,
        teacher_id=course_data.teacher_id,
        status=course_data.status,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(course_id: int, course_data: CourseUpdate, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    updates = course_data.model_dump(exclude_unset=True)

    if "title" in updates:
        title = (updates.get("title") or "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="Course title is required")
        updates["title"] = title

    if "description" in updates and updates["description"] is not None:
        updates["description"] = updates["description"].strip()

    if "location" in updates and updates["location"] is not None:
        updates["location"] = updates["location"].strip()

    total_hours = updates.get("total_hours", course.total_hours)
    max_students = updates.get("max_students", course.max_students)
    _validate_numeric_fields(total_hours, max_students)

    start_date = updates.get("start_date", course.start_date)
    end_date = updates.get("end_date", course.end_date)
    _validate_date_range(start_date, end_date)

    if "teacher_id" in updates:
        _validate_teacher(updates.get("teacher_id"), db)

    for field, value in updates.items():
        setattr(course, field, value)

    db.commit()
    db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db.delete(course)
    db.commit()
    return None