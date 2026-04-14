from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import HourPackage
from schemas import HourPackageCreate, HourPackageResponse, HourPackageUpdate

router = APIRouter()


def _clear_other_popular_packages(db: Session, package_id: Optional[int] = None) -> None:
    query = db.query(HourPackage).filter(HourPackage.is_popular.is_(True))
    if package_id is not None:
        query = query.filter(HourPackage.id != package_id)
    query.update({HourPackage.is_popular: False}, synchronize_session=False)


@router.get("/", response_model=list[HourPackageResponse])
def list_hour_packages(db: Session = Depends(get_db)):
    return (
        db.query(HourPackage)
        .order_by(HourPackage.is_popular.desc(), HourPackage.created_at.desc())
        .all()
    )


@router.post("/", response_model=HourPackageResponse, status_code=status.HTTP_201_CREATED)
def create_hour_package(package_data: HourPackageCreate, db: Session = Depends(get_db)):
    name = package_data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Hour package name is required")

    if package_data.hours <= 0:
        raise HTTPException(status_code=400, detail="Hour package hours must be greater than zero")

    if package_data.price < 0:
        raise HTTPException(status_code=400, detail="Hour package price cannot be negative")

    package = HourPackage(
        name=name,
        hours=package_data.hours,
        price=package_data.price,
        is_trial=bool(package_data.is_trial),
        is_active=bool(package_data.is_active),
        is_popular=bool(package_data.is_popular),
    )
    db.add(package)
    db.flush()

    if package.is_popular:
        _clear_other_popular_packages(db, package.id)

    db.commit()
    db.refresh(package)
    return package


@router.put("/{package_id}", response_model=HourPackageResponse)
def update_hour_package(package_id: int, package_data: HourPackageUpdate, db: Session = Depends(get_db)):
    package = db.query(HourPackage).filter(HourPackage.id == package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Hour package not found")

    name = package_data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Hour package name is required")

    if package_data.hours <= 0:
        raise HTTPException(status_code=400, detail="Hour package hours must be greater than zero")

    if package_data.price < 0:
        raise HTTPException(status_code=400, detail="Hour package price cannot be negative")

    package.name = name
    package.hours = package_data.hours
    package.price = package_data.price
    package.is_trial = bool(package_data.is_trial)
    package.is_active = bool(package_data.is_active)
    package.is_popular = bool(package_data.is_popular)

    if package.is_popular:
        _clear_other_popular_packages(db, package.id)

    db.commit()
    db.refresh(package)
    return package


@router.delete("/{package_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hour_package(package_id: int, db: Session = Depends(get_db)):
    package = db.query(HourPackage).filter(HourPackage.id == package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Hour package not found")

    db.delete(package)
    db.commit()
    return None
