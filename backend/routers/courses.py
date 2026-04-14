from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Course
from schemas import CourseResponse

router = APIRouter()

@router.get("/", response_model=list[CourseResponse])
def list_courses(db: Session = Depends(get_db)):
    return (
        db.query(Course)
        .order_by(Course.type.asc(), Course.level.asc(), Course.created_at.desc())
        .all()
    )