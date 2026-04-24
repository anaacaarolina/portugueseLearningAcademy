from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from database import get_db
from models import UserRole
from schemas import UserCreate, UserResponse, Token
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from Services.auth_services import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM
from jose import jwt, JWTError

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _users_columns(db: Session) -> set[str]:
    inspector = inspect(db.bind)
    return {column["name"] for column in inspector.get_columns("users")}


def _fetch_user_by_email(db: Session, email: str, columns: set[str]):
    selected = ["id", "email"]
    if "role" in columns:
        selected.append("role")
    if "hashed_password" in columns:
        selected.append("hashed_password")
    if "password" in columns:
        selected.append("password")

    query = text(f"SELECT {', '.join(selected)} FROM users WHERE email = :email LIMIT 1")
    return db.execute(query, {"email": email}).mappings().first()


def _get_email_from_token(token: str) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    return str(email)


@router.get("/me")
def get_current_user_profile(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    email = _get_email_from_token(token)
    columns = _users_columns(db)
    user = _fetch_user_by_email(db, email, columns)

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    has_active_enrollment = False
    inspector = inspect(db.bind)
    enrollment_columns = set()
    if "enrollments" in inspector.get_table_names():
        enrollment_columns = {column["name"] for column in inspector.get_columns("enrollments")}

    if {"user_id", "status"}.issubset(enrollment_columns):
        active_enrollment_query = text(
            "SELECT 1 FROM enrollments WHERE user_id = :user_id AND status = :status LIMIT 1"
        )
        has_active_enrollment = (
            db.execute(active_enrollment_query, {"user_id": user["id"], "status": "active"}).scalar()
            is not None
        )

    db_role = (user.get("role") or "student").lower()
    if db_role == UserRole.admin.value:
        user_role = UserRole.admin.value
    else:
        user_role = "student" if has_active_enrollment else "unrolled_student"

    return {
        "id": user["id"],
        "email": user["email"],
        "user_role": user_role,
        "has_active_enrollment": has_active_enrollment,
    }

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    columns = _users_columns(db)
    existing_user = _fetch_user_by_email(db, str(user_data.email), columns)
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="This email is already registered."
        )

    hashed_pwd = get_password_hash(user_data.password)
    insert_values = {
        "email": str(user_data.email),
        "role": UserRole.student.value,
    }

    insert_columns = ["email", "role"]

    if "name" in columns:
        insert_columns.append("name")
        insert_values["name"] = user_data.name

    if "hashed_password" in columns:
        insert_columns.append("hashed_password")
        insert_values["hashed_password"] = hashed_pwd

    if "password" in columns:
        insert_columns.append("password")
        insert_values["password"] = hashed_pwd

    if "is_active" in columns:
        insert_columns.append("is_active")
        insert_values["is_active"] = True

    placeholders = [f":{column}" for column in insert_columns]
    query = text(
        f"INSERT INTO users ({', '.join(insert_columns)}) VALUES ({', '.join(placeholders)}) RETURNING id"
    )

    new_user_id = db.execute(query, insert_values).scalar_one()
    db.commit()

    return {
        "id": new_user_id,
        "email": str(user_data.email),
        "name": user_data.name,
        "role": UserRole.student,
        "is_active": True,
    }



@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    columns = _users_columns(db)
    user = _fetch_user_by_email(db, form_data.username, columns)

    stored_hash = None
    if user:
        stored_hash = user.get("hashed_password") or user.get("password")

    password_valid = False
    if stored_hash:
        password_valid = verify_password(form_data.password, stored_hash)
        if not password_valid:
            password_valid = stored_hash == form_data.password

    if not user or not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    has_active_enrollment = False
    enrollment_columns = set()
    inspector = inspect(db.bind)
    if "enrollments" in inspector.get_table_names():
        enrollment_columns = {column["name"] for column in inspector.get_columns("enrollments")}

    if {"user_id", "status"}.issubset(enrollment_columns):
        active_enrollment_query = text(
            "SELECT 1 FROM enrollments WHERE user_id = :user_id AND status = :status LIMIT 1"
        )
        has_active_enrollment = (
            db.execute(active_enrollment_query, {"user_id": user["id"], "status": "active"}).scalar()
            is not None
        )

    db_role = (user.get("role") or "student").lower()
    if db_role == UserRole.admin.value:
        user_role = UserRole.admin.value
    else:
        user_role = "student" if has_active_enrollment else "unrolled_student"

    access_token = create_access_token(data={"sub": user["email"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_role": user_role,
        "has_active_enrollment": has_active_enrollment,
    }


@router.post("/change-password")
def change_password(body: dict, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    current_password = str(body.get("current_password") or "")
    new_password = str(body.get("new_password") or "")

    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="current_password and new_password are required")

    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long")

    email = _get_email_from_token(token)
    columns = _users_columns(db)
    user = _fetch_user_by_email(db, email, columns)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    stored_hash = user.get("hashed_password") or user.get("password") or ""
    password_valid = verify_password(current_password, stored_hash)
    if not password_valid:
        password_valid = stored_hash == current_password

    if not password_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")

    next_hash = get_password_hash(new_password)
    set_clauses = []
    params = {"id": user["id"]}

    if "hashed_password" in columns:
        set_clauses.append("hashed_password = :hashed_password")
        params["hashed_password"] = next_hash

    if "password" in columns:
        set_clauses.append("password = :password")
        params["password"] = next_hash

    if not set_clauses:
        raise HTTPException(status_code=500, detail="No password field found in users table")

    query = text(f"UPDATE users SET {', '.join(set_clauses)} WHERE id = :id")
    db.execute(query, params)
    db.commit()

    return {"message": "Password updated successfully"}