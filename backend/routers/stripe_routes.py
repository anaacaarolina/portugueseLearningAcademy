import os
from decimal import Decimal

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

import models
from database import get_db

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter()


class CheckoutSessionRequest(BaseModel):
    package_id: int
    course_id: int | None = None
    user_id: int | None = None
    email: EmailStr | None = None


def _build_frontend_urls() -> tuple[str, str]:
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    success_url = f"{frontend_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{frontend_url}/payment-cancelled"
    return success_url, cancel_url


@router.post("/create-checkout-session")
async def create_checkout_session(body: CheckoutSessionRequest, db: Session = Depends(get_db)):
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe secret key is not configured")

    hour_package = (
        db.query(models.HourPackage)
        .filter(models.HourPackage.id == body.package_id, models.HourPackage.is_active.is_(True))
        .first()
    )
    if not hour_package:
        raise HTTPException(status_code=404, detail="Hour package not found or inactive")

    course = None
    if body.course_id is not None:
        course = db.query(models.Course).filter(models.Course.id == body.course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

    user_email = body.email
    if body.user_id is not None:
        user = db.query(models.User).filter(models.User.id == body.user_id).first()
        if user:
            if user_email is None and user.email:
                user_email = user.email

    metadata = {
        "package_id": str(body.package_id),
        "course_id": str(body.course_id) if body.course_id is not None else "",
        "user_id": str(body.user_id) if body.user_id is not None else "",
    }

    success_url, cancel_url = _build_frontend_urls()

    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "eur",
                        "unit_amount": int(Decimal(hour_package.price or 0) * 100),
                        "product_data": {
                            "name": hour_package.name or "Hour Package",
                            "description": (
                                f"{float(hour_package.hours or 0):g}h package"
                                + (
                                    f" for {course.title}" if course and course.title else ""
                                )
                            ),
                        },
                    },
                    "quantity": 1,
                }
            ],
            customer_email=user_email,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata,
        )
    except stripe.error.StripeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {"sessionId": session.id, "url": session.url}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe secret key is not configured")

    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    if not endpoint_secret:
        raise HTTPException(status_code=500, detail="Stripe webhook secret is not configured")

    payload = await request.body()
    signature = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, signature, endpoint_secret)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid payload") from exc
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail="Invalid signature") from exc

    if event.get("type") != "checkout.session.completed":
        return {"status": "ignored"}

    session = event["data"]["object"]
    metadata = session.get("metadata") or {}
    payment_status = session.get("payment_status")

    if payment_status != "paid":
        return {"status": "ignored"}

    user_id_raw = metadata.get("user_id")
    package_id_raw = metadata.get("package_id")
    course_id_raw = metadata.get("course_id")

    user_id = int(user_id_raw) if user_id_raw and user_id_raw.isdigit() else None
    package_id = int(package_id_raw) if package_id_raw and package_id_raw.isdigit() else None
    course_id = int(course_id_raw) if course_id_raw and course_id_raw.isdigit() else None

    if user_id is None or package_id is None:
        return {"status": "received"}

    package = db.query(models.HourPackage).filter(models.HourPackage.id == package_id).first()
    if not package:
        return {"status": "received"}

    stripe_payment_id = str(session.get("payment_intent") or session.get("id"))
    existing_payment = (
        db.query(models.Payment)
        .filter(models.Payment.stripe_payment_id == stripe_payment_id)
        .first()
    )
    if existing_payment:
        return {"status": "already_processed"}

    amount_total = Decimal(session.get("amount_total") or 0) / Decimal("100")

    payment = models.Payment(
        user_id=user_id,
        package_id=package.id,
        amount=amount_total,
        status=models.PaymentStatus.paid,
        type=models.PaymentType.package,
        paid_at=func.now(),
        stripe_payment_id=stripe_payment_id,
    )
    db.add(payment)

    if course_id is not None:
        course = db.query(models.Course).filter(models.Course.id == course_id).first()
        if course:
            enrollment = (
                db.query(models.Enrollment)
                .filter(
                    models.Enrollment.user_id == user_id,
                    models.Enrollment.course_id == course_id,
                )
                .first()
            )
            package_hours = Decimal(package.hours or 0)

            active_enrollment = (
                db.query(models.Enrollment)
                .filter(
                    models.Enrollment.user_id == user_id,
                    models.Enrollment.status == models.EnrollmentStatus.active,
                )
                .order_by(models.Enrollment.id.desc())
                .first()
            )
            if active_enrollment and (enrollment is None or active_enrollment.id != enrollment.id):
                active_enrollment.status = models.EnrollmentStatus.transferred

            if enrollment:
                enrollment.status = models.EnrollmentStatus.active
                enrollment.hours_total = package_hours
                enrollment.hours_used = Decimal(enrollment.hours_used or 0)
                if enrollment.enrolled_at is None:
                    enrollment.enrolled_at = func.now()
            else:
                db.add(
                    models.Enrollment(
                        user_id=user_id,
                        course_id=course_id,
                        status=models.EnrollmentStatus.active,
                        hours_total=package_hours,
                        hours_used=Decimal("0"),
                        enrolled_at=func.now(),
                    )
                )

    db.commit()
    return {"status": "success"}