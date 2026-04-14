from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Comment
from schema import CommentCreate, CommentResponse, CommentUpdate

router = APIRouter()


@router.get("/", response_model=list[CommentResponse])
def list_comments(db: Session = Depends(get_db)):
    return db.query(Comment).order_by(Comment.created_at.desc(), Comment.id.desc()).all()


@router.post("/", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(comment_data: CommentCreate, db: Session = Depends(get_db)):
    author = comment_data.author.strip()
    body = comment_data.body.strip()
    rating = int(comment_data.rating)

    if not author:
        raise HTTPException(status_code=400, detail="Comment author is required")
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Comment rating must be between 1 and 5")
    if not body:
        raise HTTPException(status_code=400, detail="Comment body is required")

    comment = Comment(
        author=author,
        rating=rating,
        status=comment_data.status,
        body=body,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.put("/{comment_id}", response_model=CommentResponse)
def update_comment(comment_id: int, comment_data: CommentUpdate, db: Session = Depends(get_db)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    author = comment_data.author.strip() if comment_data.author else ""
    body = comment_data.body.strip() if comment_data.body else ""
    rating = int(comment_data.rating) if comment_data.rating is not None else 0

    if not author:
        raise HTTPException(status_code=400, detail="Comment author is required")
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Comment rating must be between 1 and 5")
    if not body:
        raise HTTPException(status_code=400, detail="Comment body is required")

    comment.author = author
    comment.rating = rating
    comment.status = comment_data.status
    comment.body = body

    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    db.delete(comment)
    db.commit()
    return None