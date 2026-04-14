from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import FunFact, FunFactTag
from schemas import FunFactCreate, FunFactResponse, FunFactUpdate

router = APIRouter()


@router.get("/", response_model=list[FunFactResponse])
def list_fun_facts(db: Session = Depends(get_db)):
    return db.query(FunFact).order_by(FunFact.created_at.desc()).all()


@router.post("/", response_model=FunFactResponse, status_code=status.HTTP_201_CREATED)
def create_fun_fact(fact_data: FunFactCreate, db: Session = Depends(get_db)):
    title = fact_data.title.strip()
    slug = fact_data.slug.strip()
    body = fact_data.body.strip()
    key_points = fact_data.key_points.strip()

    if not title:
        raise HTTPException(status_code=400, detail="Fun fact title is required")
    if not slug:
        raise HTTPException(status_code=400, detail="Fun fact slug is required")
    if not body:
        raise HTTPException(status_code=400, detail="Fun fact body is required")
    if not key_points:
        raise HTTPException(status_code=400, detail="Fun fact key points are required")

    tag = db.query(FunFactTag).filter(FunFactTag.id == fact_data.tag_id).first()
    if not tag:
        raise HTTPException(status_code=400, detail="Invalid fun fact tag")

    fact = FunFact(
        title=title,
        slug=slug,
        tag_id=fact_data.tag_id,
        body=body,
        key_points=key_points,
        did_you_know=fact_data.did_you_know.strip() if fact_data.did_you_know else None,
        image_url=fact_data.image_url.strip() if fact_data.image_url else None,
        is_published=bool(fact_data.is_published),
    )
    db.add(fact)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A fun fact with this slug already exists")

    db.refresh(fact)
    return fact


@router.put("/{fact_id}", response_model=FunFactResponse)
def update_fun_fact(fact_id: int, fact_data: FunFactUpdate, db: Session = Depends(get_db)):
    fact = db.query(FunFact).filter(FunFact.id == fact_id).first()
    if not fact:
        raise HTTPException(status_code=404, detail="Fun fact not found")

    title = fact_data.title.strip()
    slug = fact_data.slug.strip()
    body = fact_data.body.strip()
    key_points = fact_data.key_points.strip()

    if not title:
        raise HTTPException(status_code=400, detail="Fun fact title is required")
    if not slug:
        raise HTTPException(status_code=400, detail="Fun fact slug is required")
    if not body:
        raise HTTPException(status_code=400, detail="Fun fact body is required")
    if not key_points:
        raise HTTPException(status_code=400, detail="Fun fact key points are required")

    tag = db.query(FunFactTag).filter(FunFactTag.id == fact_data.tag_id).first()
    if not tag:
        raise HTTPException(status_code=400, detail="Invalid fun fact tag")

    fact.title = title
    fact.slug = slug
    fact.tag_id = fact_data.tag_id
    fact.body = body
    fact.key_points = key_points
    fact.did_you_know = fact_data.did_you_know.strip() if fact_data.did_you_know else None
    fact.image_url = fact_data.image_url.strip() if fact_data.image_url else None
    fact.is_published = bool(fact_data.is_published)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A fun fact with this slug already exists")

    db.refresh(fact)
    return fact


@router.delete("/{fact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fun_fact(fact_id: int, db: Session = Depends(get_db)):
    fact = db.query(FunFact).filter(FunFact.id == fact_id).first()
    if not fact:
        raise HTTPException(status_code=404, detail="Fun fact not found")

    db.delete(fact)
    db.commit()
    return None
