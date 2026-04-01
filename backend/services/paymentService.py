import os
from datetime import datetime, timezone
from decimal import Decimal

import stripe
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models import (
    User, Enrollment, HourPackage, Payment,
    EnrollmentStatus, PaymentStatus, PaymentType,
    NotificationChannel, NotificationStatus, Notification,
)

# Stripe is configured once at import time from the environment variable.
# The key is set in backend/.env as STRIPE_SECRET_KEY.
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_enrollment_or_404(enrollment_id: int, db: Session) -> Enrollment:
    enrollment = db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    return enrollment


def _get_package_or_404(package_id: int, db: Session) -> HourPackage:
    package = db.get(HourPackage, package_id)
    if not package:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Hour package not found")
    return package


def _get_payment_or_404(payment_id: int, db: Session) -> Payment:
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return payment


def _hours_remaining(enrollment: Enrollment) -> Decimal:
    return Decimal(str(enrollment.hours_total)) - Decimal(str(enrollment.hours_used))


def _validate_enrollment_active(enrollment: Enrollment) -> None:
    if enrollment.status != EnrollmentStatus.active:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Cannot purchase hours for an enrollment that is not active.",
        )


def _validate_one_active_package(enrollment: Enrollment) -> None:
    """
    Enforce the one-active-package-per-enrollment rule.
    A student may not purchase a new package while hours_remaining > 0.
    """
    if _hours_remaining(enrollment) > 0:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=(
                "PACKAGE_ALREADY_ACTIVE: This enrollment still has remaining hours. "
                "Purchase a new package only after all hours are consumed or transferred."
            ),
        )


def _validate_package_active(package: HourPackage) -> None:
    if not package.is_active:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="This hour package is no longer available for purchase.",
        )


def _queue_notification(
    user_id: int,
    channel: NotificationChannel,
    notif_type: str,
    content: str,
    db: Session,
) -> None:
    """Insert a pending notification row. Dispatching handled by notification_service."""
    notif = Notification(
        user_id=user_id,
        channel=channel,
        type=notif_type,
        content=content,
        status=NotificationStatus.pending,
    )
    db.add(notif)


def _find_payment_by_stripe_id(stripe_payment_id: str, db: Session) -> Payment | None:
    return (
        db.query(Payment)
        .filter(Payment.stripe_payment_id == stripe_payment_id)
        .first()
    )


# ---------------------------------------------------------------------------
# Package purchase flow
# ---------------------------------------------------------------------------

def create_checkout(
    user_id: int,
    enrollment_id: int,
    package_id: int,
    db: Session,
) -> dict:
    """
    Initiate a Stripe Checkout Session for purchasing an hour package.

    Business rules enforced:
      - Enrollment must be active.
      - One-active-package rule: hours_remaining must be 0.
      - Package must exist and be active (is_active=True).

    On success:
      - INSERTs a Payment record with status='pending'.
      - Creates a Stripe Checkout Session.
      - Returns { "payment_id": int, "checkout_url": str } for the router
        to return to React, which redirects the student to Stripe.

    Raises:
      400  if enrollment is not active or package is inactive.
      404  if enrollment or package does not exist.
      409  PACKAGE_ALREADY_ACTIVE if hours_remaining > 0.
    """
    enrollment = _get_enrollment_or_404(enrollment_id, db)
    package = _get_package_or_404(package_id, db)

    _validate_enrollment_active(enrollment)
    _validate_one_active_package(enrollment)
    _validate_package_active(package)

    # Record the pending payment before calling Stripe so we have an ID
    # to store in Stripe metadata for webhook reconciliation.
    payment = Payment(
        user_id=user_id,
        package_id=package_id,
        amount=package.price,
        status=PaymentStatus.pending,
        type=PaymentType.trial if package.is_trial else PaymentType.package,
    )
    db.add(payment)
    db.flush()  # get payment.id before Stripe call

    # Amount in cents (Stripe requires integer smallest currency unit)
    amount_cents = int(package.price * 100)

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "eur",
                        "product_data": {"name": package.name},
                        "unit_amount": amount_cents,
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=f"{FRONTEND_URL}/student/dashboard?payment=success",
            cancel_url=f"{FRONTEND_URL}/student/dashboard?payment=cancelled",
            metadata={
                "payment_id": str(payment.id),
                "enrollment_id": str(enrollment_id),
                "package_id": str(package_id),
                "user_id": str(user_id),
            },
        )
    except stripe.StripeError as e:
        # Roll back the pending payment row if Stripe fails
        db.rollback()
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail=f"Stripe error: {str(e)}",
        )

    payment.stripe_payment_id = session.payment_intent
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "payment_id": payment.id,
        "checkout_url": session.url,
    }


def create_extra_hour_checkout(
    user_id: int,
    enrollment_id: int,
    extra_hour_price: Decimal,
    db: Session,
) -> dict:
    """
    Initiate a Stripe Checkout Session for a single extra hour purchase.

    Used when a student needs one additional hour outside of a package.
    payment.type = 'extra_hour', package_id = NULL.

    Business rules enforced:
      - Enrollment must be active.
      - One-active-package rule applies (hours_remaining must be 0).

    Returns { "payment_id": int, "checkout_url": str }.
    """
    enrollment = _get_enrollment_or_404(enrollment_id, db)

    _validate_enrollment_active(enrollment)
    _validate_one_active_package(enrollment)

    payment = Payment(
        user_id=user_id,
        package_id=None,  # nullable for extra_hour type
        amount=extra_hour_price,
        status=PaymentStatus.pending,
        type=PaymentType.extra_hour,
    )
    db.add(payment)
    db.flush()

    amount_cents = int(extra_hour_price * 100)

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "eur",
                        "product_data": {"name": "Extra Hour"},
                        "unit_amount": amount_cents,
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=f"{FRONTEND_URL}/student/dashboard?payment=success",
            cancel_url=f"{FRONTEND_URL}/student/dashboard?payment=cancelled",
            metadata={
                "payment_id": str(payment.id),
                "enrollment_id": str(enrollment_id),
                "user_id": str(user_id),
                "type": "extra_hour",
            },
        )
    except stripe.StripeError as e:
        db.rollback()
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail=f"Stripe error: {str(e)}",
        )

    payment.stripe_payment_id = session.payment_intent
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "payment_id": payment.id,
        "checkout_url": session.url,
    }


# ---------------------------------------------------------------------------
# Stripe webhook handler
# ---------------------------------------------------------------------------

def handle_webhook(raw_body: bytes, stripe_signature: str, db: Session) -> dict:
    """
    Process an incoming Stripe webhook event.

    Called by POST /payments/webhook. The router passes the raw request body
    (bytes) and the Stripe-Signature header so we can verify the event.

    Handled event types:
      - checkout.session.completed  →  mark payment 'paid', credit hours
      - payment_intent.payment_failed  →  mark payment 'failed', notify student
      - charge.refunded  →  mark payment 'refunded', reverse hours

    Returns { "received": True } on success.

    Raises:
      400  if the webhook signature is invalid (possible spoofed request).
      404  if no matching payment record is found.
    """
    try:
        event = stripe.Webhook.construct_event(
            raw_body, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except stripe.SignatureVerificationError:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Invalid Stripe webhook signature.",
        )

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        _handle_payment_succeeded(data, db)

    elif event_type == "payment_intent.payment_failed":
        _handle_payment_failed(data, db)

    elif event_type == "charge.refunded":
        _handle_payment_refunded(data, db)

    # Other event types are silently acknowledged (Stripe requires a 200 response)
    return {"received": True}


def _handle_payment_succeeded(session_data: dict, db: Session) -> None:
    """
    Stripe checkout.session.completed:
      - Set payment status to 'paid'.
      - Store stripe_receipt_url.
      - Credit hours_total on the enrollment.
      - Queue payment receipt notification.
    """
    payment_id = int(session_data["metadata"]["payment_id"])
    enrollment_id = int(session_data["metadata"]["enrollment_id"])

    payment = _get_payment_or_404(payment_id, db)
    enrollment = _get_enrollment_or_404(enrollment_id, db)

    payment.status = PaymentStatus.paid
    payment.paid_at = datetime.now(timezone.utc)

    # Store the receipt URL from the charge if available
    charges = session_data.get("charges", {}).get("data", [])
    if charges:
        payment.stripe_receipt_url = charges[0].get("receipt_url")

    db.add(payment)

    # Credit hours based on payment type
    if payment.type == PaymentType.extra_hour:
        hours_to_credit = Decimal("1.0")
    elif payment.package_id:
        package = _get_package_or_404(payment.package_id, db)
        hours_to_credit = Decimal(str(package.hours))
    else:
        hours_to_credit = Decimal("0")

    enrollment.hours_total = Decimal(str(enrollment.hours_total)) + hours_to_credit
    db.add(enrollment)

    _queue_notification(
        user_id=payment.user_id,
        channel=NotificationChannel.email,
        notif_type="payment_receipt",
        content=(
            f"Payment of €{payment.amount} confirmed. "
            f"{hours_to_credit} hour(s) have been credited to your enrollment."
        ),
        db=db,
    )

    db.commit()


def _handle_payment_failed(payment_intent_data: dict, db: Session) -> None:
    """
    Stripe payment_intent.payment_failed:
      - Set payment status to 'failed'.
      - Notify student via email.
    """
    stripe_payment_id = payment_intent_data.get("id")
    payment = _find_payment_by_stripe_id(stripe_payment_id, db)

    if not payment:
        # Webhook for a payment we don't recognise — acknowledge and ignore
        return

    payment.status = PaymentStatus.failed
    db.add(payment)

    _queue_notification(
        user_id=payment.user_id,
        channel=NotificationChannel.email,
        notif_type="payment_failed",
        content=(
            f"Your payment of €{payment.amount} could not be processed. "
            "Please try again or use a different payment method."
        ),
        db=db,
    )

    db.commit()


def _handle_payment_refunded(charge_data: dict, db: Session) -> None:
    """
    Stripe charge.refunded:
      - Set payment status to 'refunded'.
      - Reverse hours_total on the enrollment.
      - Validate that hours_used does not exceed the new hours_total.
      - Notify student via email.

    Note: partial refunds are not supported by the current schema.
    A full refund reverses all credited hours.
    """
    payment_intent_id = charge_data.get("payment_intent")
    payment = _find_payment_by_stripe_id(payment_intent_id, db)

    if not payment:
        return

    payment.status = PaymentStatus.refunded
    db.add(payment)

    # Reverse the hours that were credited when this payment succeeded.
    # We need to find the enrollment from the original checkout metadata.
    # Since Payment does not store enrollment_id directly, we look it up
    # via hour_packages if package_id is present, or default to 1 hour for extra_hour.
    # NOTE: if you later add enrollment_id to the Payment model, simplify this lookup.
    if payment.type == PaymentType.extra_hour:
        hours_to_reverse = Decimal("1.0")
    elif payment.package_id:
        package = db.get(HourPackage, payment.package_id)
        hours_to_reverse = Decimal(str(package.hours)) if package else Decimal("0")
    else:
        hours_to_reverse = Decimal("0")

    if hours_to_reverse > 0:
        # Find the most recent active enrollment for this user that has enough total hours
        # This is a best-effort lookup; adding enrollment_id to Payment would make this exact.
        enrollment = (
            db.query(Enrollment)
            .filter(
                Enrollment.user_id == payment.user_id,
                Enrollment.status == EnrollmentStatus.active,
                Enrollment.hours_total >= hours_to_reverse,
            )
            .order_by(Enrollment.enrolled_at.desc())
            .first()
        )

        if enrollment:
            new_hours_total = Decimal(str(enrollment.hours_total)) - hours_to_reverse

            # Safety: hours_used must never exceed hours_total after reversal
            if Decimal(str(enrollment.hours_used)) > new_hours_total:
                # Hours already consumed — partial reversal only
                new_hours_total = Decimal(str(enrollment.hours_used))

            enrollment.hours_total = new_hours_total
            db.add(enrollment)

    _queue_notification(
        user_id=payment.user_id,
        channel=NotificationChannel.email,
        notif_type="payment_refunded",
        content=(
            f"Your payment of €{payment.amount} has been refunded. "
            "The corresponding hours have been removed from your enrollment."
        ),
        db=db,
    )

    db.commit()


# ---------------------------------------------------------------------------
# Read helpers (used by routers and admin views)
# ---------------------------------------------------------------------------

def get_payment(payment_id: int, db: Session) -> Payment:
    """Fetch a single payment by ID."""
    return _get_payment_or_404(payment_id, db)


def get_student_payments(user_id: int, db: Session) -> list[Payment]:
    """Return all payments for a student, most recent first."""
    return (
        db.query(Payment)
        .filter(Payment.user_id == user_id)
        .order_by(Payment.created_at.desc())
        .all()
    )


def get_all_payments(db: Session) -> list[Payment]:
    """Return all payments across all students. Admin-facing."""
    return (
        db.query(Payment)
        .order_by(Payment.created_at.desc())
        .all()
    )