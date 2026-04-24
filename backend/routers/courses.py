from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Course, Teacher, CourseSchedule, CourseScheduleException, CourseType
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


def _validate_weekly_schedule(schedule_items, course_start_date, course_end_date) -> None:
    for item in schedule_items:
        if item.end_time <= item.start_time:
            raise HTTPException(status_code=400, detail="Schedule end_time must be after start_time")

        if item.effective_from and item.effective_to and item.effective_to < item.effective_from:
            raise HTTPException(status_code=400, detail="Schedule effective_to cannot be before effective_from")

        if course_start_date and item.effective_from and item.effective_from < course_start_date:
            raise HTTPException(status_code=400, detail="Schedule effective_from cannot be before course start_date")

        if course_end_date and item.effective_to and item.effective_to > course_end_date:
            raise HTTPException(status_code=400, detail="Schedule effective_to cannot be after course end_date")


def _validate_schedule_exceptions(exception_items, course_start_date, course_end_date) -> None:
    for item in exception_items:
        if course_start_date and item.exception_date < course_start_date:
            raise HTTPException(status_code=400, detail="Exception date cannot be before course start_date")

        if course_end_date and item.exception_date > course_end_date:
            raise HTTPException(status_code=400, detail="Exception date cannot be after course end_date")

        if item.is_cancelled:
            continue

        if item.start_time is None or item.end_time is None:
            raise HTTPException(status_code=400, detail="Exception start_time and end_time are required unless cancelled")

        if item.end_time <= item.start_time:
            raise HTTPException(status_code=400, detail="Exception end_time must be after start_time")


def _replace_course_schedules(db: Session, course_id: int, weekly_schedule, schedule_exceptions) -> None:
    db.query(CourseScheduleException).filter(CourseScheduleException.course_id == course_id).delete()
    db.query(CourseSchedule).filter(CourseSchedule.course_id == course_id).delete()

    for item in weekly_schedule:
        db.add(
            CourseSchedule(
                course_id=course_id,
                day_of_week=item.day_of_week,
                start_time=item.start_time,
                end_time=item.end_time,
                effective_from=item.effective_from,
                effective_to=item.effective_to,
            )
        )

    db.flush()

    for item in schedule_exceptions:
        db.add(
            CourseScheduleException(
                course_id=course_id,
                course_schedule_id=item.course_schedule_id,
                exception_date=item.exception_date,
                start_time=item.start_time,
                end_time=item.end_time,
                is_cancelled=item.is_cancelled,
                reason=item.reason.strip() if item.reason else None,
            )
        )


def _serialize_course(course: Course, db: Session):
    schedule_rows = (
        db.query(CourseSchedule)
        .filter(CourseSchedule.course_id == course.id)
        .order_by(CourseSchedule.day_of_week.asc(), CourseSchedule.effective_from.asc().nullslast(), CourseSchedule.start_time.asc())
        .all()
    )

    exception_rows = (
        db.query(CourseScheduleException)
        .filter(CourseScheduleException.course_id == course.id)
        .order_by(CourseScheduleException.exception_date.asc(), CourseScheduleException.start_time.asc().nullslast())
        .all()
    )

    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "level": course.level,
        "type": course.type,
        "start_date": course.start_date,
        "end_date": course.end_date,
        "total_hours": course.total_hours,
        "max_students": course.max_students,
        "regime": course.regime,
        "location": course.location,
        "teacher_id": course.teacher_id,
        "status": course.status,
        "created_at": course.created_at,
        "updated_at": course.updated_at,
        "weekly_schedule": [
            {
                "id": row.id,
                "day_of_week": row.day_of_week,
                "start_time": row.start_time,
                "end_time": row.end_time,
                "effective_from": row.effective_from,
                "effective_to": row.effective_to,
            }
            for row in schedule_rows
        ],
        "schedule_exceptions": [
            {
                "id": row.id,
                "course_schedule_id": row.course_schedule_id,
                "exception_date": row.exception_date,
                "start_time": row.start_time,
                "end_time": row.end_time,
                "is_cancelled": bool(row.is_cancelled),
                "reason": row.reason,
            }
            for row in exception_rows
        ],
    }


@router.get("/", response_model=list[CourseResponse])
def list_courses(db: Session = Depends(get_db)):
    courses = (
        db.query(Course)
        .order_by(Course.type.asc(), Course.level.asc(), Course.created_at.desc())
        .all()
    )

    return [_serialize_course(course, db) for course in courses]


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(course_data: CourseCreate, db: Session = Depends(get_db)):
    title = course_data.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Course title is required")

    _validate_numeric_fields(course_data.total_hours, course_data.max_students)
    _validate_date_range(course_data.start_date, course_data.end_date)
    _validate_teacher(course_data.teacher_id, db)
    _validate_weekly_schedule(course_data.weekly_schedule, course_data.start_date, course_data.end_date)
    _validate_schedule_exceptions(course_data.schedule_exceptions, course_data.start_date, course_data.end_date)

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
    db.flush()

    if course_data.type == CourseType.group:
        _replace_course_schedules(db, course.id, course_data.weekly_schedule, course_data.schedule_exceptions)

    db.commit()
    db.refresh(course)
    return _serialize_course(course, db)


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(course_id: int, course_data: CourseUpdate, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    updates = course_data.model_dump(exclude_unset=True)
    weekly_schedule = updates.pop("weekly_schedule", None)
    schedule_exceptions = updates.pop("schedule_exceptions", None)

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

    target_type = course.type
    if target_type == CourseType.group:
        if weekly_schedule is not None:
            _validate_weekly_schedule(weekly_schedule, start_date, end_date)
        if schedule_exceptions is not None:
            _validate_schedule_exceptions(schedule_exceptions, start_date, end_date)

        if weekly_schedule is not None or schedule_exceptions is not None:
            resolved_weekly_schedule = weekly_schedule if weekly_schedule is not None else []
            resolved_schedule_exceptions = schedule_exceptions if schedule_exceptions is not None else []
            _replace_course_schedules(db, course.id, resolved_weekly_schedule, resolved_schedule_exceptions)
    else:
        db.query(CourseScheduleException).filter(CourseScheduleException.course_id == course.id).delete()
        db.query(CourseSchedule).filter(CourseSchedule.course_id == course.id).delete()

    db.commit()
    db.refresh(course)
    return _serialize_course(course, db)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db.delete(course)
    db.commit()
    return None