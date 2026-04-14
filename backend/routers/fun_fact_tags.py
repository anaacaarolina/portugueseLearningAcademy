from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import FunFactTag
from schema import FunFactTagCreate, FunFactTagResponse, FunFactTagUpdate

router = APIRouter()


@router.get("/", response_model=list[FunFactTagResponse])
def list_fun_fact_tags(db: Session = Depends(get_db)):
    return db.query(FunFactTag).order_by(FunFactTag.name.asc()).all()


@router.post("/", response_model=FunFactTagResponse, status_code=status.HTTP_201_CREATED)
def create_fun_fact_tag(tag_data: FunFactTagCreate, db: Session = Depends(get_db)):
    name = tag_data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Tag name is required")

    tag = FunFactTag(name=name)
    db.add(tag)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A fun fact tag with this name already exists")

    db.refresh(tag)
    return tag


@router.put("/{tag_id}", response_model=FunFactTagResponse)
def update_fun_fact_tag(tag_id: int, tag_data: FunFactTagUpdate, db: Session = Depends(get_db)):
    tag = db.query(FunFactTag).filter(FunFactTag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Fun fact tag not found")

    name = tag_data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Tag name is required")

    tag.name = name

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A fun fact tag with this name already exists")

    db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fun_fact_tag(tag_id: int, db: Session = Depends(get_db)):
    tag = db.query(FunFactTag).filter(FunFactTag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Fun fact tag not found")

    db.delete(tag)
    db.commit()
    return None
