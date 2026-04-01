from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models import (
    Enrollment, HourTransfer, Notification,
    EnrollmentStatus, NotificationChannel, NotificationStatus,
)

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_enrollment_or_404(enrollment_id: int, db: Session) -> Enrollment:
    enrollment = db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    return enrollment


def _hours_remaining(enrollment: Enrollment) -> Decimal:
    return Decimal(str(enrollment.hours_total)) - Decimal(str(enrollment.hours_used))


def _queue_notification(
    user_id: int,
    channel: NotificationChannel,
    notif_type: str,
    content: str,
    db: Session,
) -> None:
    notif = Notification(
        user_id=user_id,
        channel=channel,
        type=notif_type,
        content=content,
        status=NotificationStatus.pending,
    )
    db.add(notif)


# ---------------------------------------------------------------------------
# Transfer logic
# ---------------------------------------------------------------------------

def transfer_hours(
    from_enrollment_id: int,
    to_enrollment_id: int,
    hours: Decimal,
    reason: str,
    db: Session,
) -> HourTransfer:
    """
    Transfer a specified number of hours from one student's enrollment to another.

    This is the only permitted "cancellation" mechanism: a student cannot cancel
    a class outright, but may transfer unused hours to another student.

    Business rules:
      - Both enrollments must be active.
      - The source enrollment must have at least `hours` remaining
        (hours_total - hours_used >= hours).
      - Hours transferred must be > 0.
      - A student may not transfer hours to themselves.
      - Transfer is atomic: both enrollments are updated and the audit record
        is written in the same transaction.
      - Both students receive an email notification.
      - The source enrollment's hours_total is reduced (not hours_used),
        since the hours were never consumed — they are being reassigned.
      - The destination enrollment's hours_total is increased.
      - If the source enrollment reaches hours_total == hours_used after the
        transfer, its status is updated to 'transferred'.

    Returns the created HourTransfer audit record.

    Raises:
      404  ENROLLMENT_NOT_FOUND (either enrollment)
      400  SAME_ENROLLMENT       if from and to are the same enrollment
      400  ENROLLMENT_NOT_ACTIVE if either enrollment is not active
      400  INVALID_HOURS         if hours <= 0
      400  INSUFFICIENT_HOURS    if source does not have enough remaining hours
    """
    if from_enrollment_id == to_enrollment_id:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="SAME_ENROLLMENT: Cannot transfer hours to the same enrollment.",
        )

    if hours <= Decimal("0"):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="INVALID_HOURS: Hours to transfer must be greater than zero.",
        )

    from_enrollment = _get_enrollment_or_404(from_enrollment_id, db)
    to_enrollment = _get_enrollment_or_404(to_enrollment_id, db)

    if from_enrollment.user_id == to_enrollment.user_id:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="SAME_USER: Cannot transfer hours between your own enrollments.",
        )

    if from_enrollment.status != EnrollmentStatus.active:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="ENROLLMENT_NOT_ACTIVE: The source enrollment is not active.",
        )

    if to_enrollment.status != EnrollmentStatus.active:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="ENROLLMENT_NOT_ACTIVE: The destination enrollment is not active.",
        )

    remaining = _hours_remaining(from_enrollment)
    if remaining < hours:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=(
                f"INSUFFICIENT_HOURS: Only {remaining}h available in source enrollment; "
                f"cannot transfer {hours}h."
            ),
        )

    # Reduce source hours_total (unused hours are being given away)
    from_enrollment.hours_total = Decimal(str(from_enrollment.hours_total)) - hours
    db.add(from_enrollment)

    # If the source enrollment is now fully consumed, mark it as transferred
    new_remaining = _hours_remaining(from_enrollment)
    if new_remaining == Decimal("0"):
        from_enrollment.status = EnrollmentStatus.transferred
        db.add(from_enrollment)

    # Credit destination
    to_enrollment.hours_total = Decimal(str(to_enrollment.hours_total)) + hours
    db.add(to_enrollment)

    # Write audit record
    transfer = HourTransfer(
        from_user_id=from_enrollment.user_id,
        to_user_id=to_enrollment.user_id,
        hours_transferred=hours,
        reason=reason,
    )
    db.add(transfer)

    # Notify both parties
    _queue_notification(
        user_id=from_enrollment.user_id,
        channel=NotificationChannel.email,
        notif_type="hours_transferred_out",
        content=(
            f"You have transferred {hours}h to another student. "
            f"Reason: {reason}. "
            f"Your remaining balance: {new_remaining}h."
        ),
        db=db,
    )
    _queue_notification(
        user_id=to_enrollment.user_id,
        channel=NotificationChannel.email,
        notif_type="hours_received",
        content=(
            f"You have received {hours}h transferred from another student. "
            f"Reason: {reason}. "
            f"Your new balance: {_hours_remaining(to_enrollment)}h."
        ),
        db=db,
    )

    db.commit()
    db.refresh(transfer)
    return transfer


# ---------------------------------------------------------------------------
# Read helpers
# ---------------------------------------------------------------------------

def get_transfer(transfer_id: int, db: Session) -> HourTransfer:
    transfer = db.get(HourTransfer, transfer_id)
    if not transfer:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Transfer record not found")
    return transfer


def get_student_transfers(user_id: int, db: Session) -> list[HourTransfer]:
    """Return all transfers where the student is the sender or receiver, most recent first."""
    return (
        db.query(HourTransfer)
        .filter(
            (HourTransfer.from_user_id == user_id) | (HourTransfer.to_user_id == user_id)
        )
        .order_by(HourTransfer.created_at.desc())
        .all()
    )


def get_all_transfers(db: Session) -> list[HourTransfer]:
    """Admin-facing: all hour transfer records."""
    return (
        db.query(HourTransfer)
        .order_by(HourTransfer.created_at.desc())
        .all()
    )