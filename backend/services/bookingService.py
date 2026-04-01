from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models import (
    Course, Enrollment, TeacherAvailability, ClassBooking, Notification,
    CourseType, EnrollmentStatus, BookingStatus,
    NotificationChannel, NotificationStatus,
)

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_enrollment_or_404(enrollment_id: int, db: Session) -> Enrollment:
    enrollment = db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    return enrollment


def _get_availability_or_404(availability_id: int, db: Session) -> TeacherAvailability:
    slot = db.get(TeacherAvailability, availability_id)
    if not slot:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Availability slot not found")
    return slot


def _get_booking_or_404(booking_id: int, db: Session) -> ClassBooking:
    booking = db.get(ClassBooking, booking_id)
    if not booking:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return booking


def _hours_remaining(enrollment: Enrollment) -> Decimal:
    return Decimal(str(enrollment.hours_total)) - Decimal(str(enrollment.hours_used))


def _slot_duration_hours(slot: TeacherAvailability) -> Decimal:
    """Calculate the duration of an availability slot in hours."""
    start = datetime.combine(slot.date, slot.start_time)
    end = datetime.combine(slot.date, slot.end_time)
    delta_hours = Decimal(str((end - start).total_seconds() / 3600))
    return delta_hours


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
# Booking logic
# ---------------------------------------------------------------------------

def book_individual_class(
    enrollment_id: int,
    availability_id: int,
    db: Session,
) -> ClassBooking:
    """
    Book a class for an individual-type course.

    The student selects a specific teacher availability slot. The slot is
    reserved immediately and hours are pre-deducted (deducted at booking time,
    not at class completion — consistent with the hours_used field on Enrollment).

    Business rules:
      - Enrollment must be active and belong to an individual-type course.
      - Enrollment must have sufficient remaining hours to cover the slot duration.
      - The chosen availability slot must not already be booked (is_booked=False).
      - hours_used on the enrollment is incremented by the slot duration.
      - The slot's is_booked flag is set to True to prevent double-booking.
      - A WhatsApp reminder notification is queued.

    Returns the created ClassBooking.

    Raises:
      404  ENROLLMENT_NOT_FOUND / SLOT_NOT_FOUND
      400  ENROLLMENT_NOT_ACTIVE
      400  WRONG_COURSE_TYPE  if the enrollment is for a group course
      400  SLOT_ALREADY_BOOKED
      400  INSUFFICIENT_HOURS
    """
    enrollment = _get_enrollment_or_404(enrollment_id, db)
    slot = _get_availability_or_404(availability_id, db)

    if enrollment.status != EnrollmentStatus.active:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="ENROLLMENT_NOT_ACTIVE: Cannot book a class for an inactive enrollment.",
        )

    # Validate course type
    course = db.get(Course, enrollment.course_id)
    if not course:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Course not found")

    if course.type != CourseType.individual:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=(
                "WRONG_COURSE_TYPE: Individual booking is only available for individual-type courses. "
                "Group courses have a fixed schedule."
            ),
        )

    if slot.is_booked:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="SLOT_ALREADY_BOOKED: This availability slot has already been taken.",
        )

    hours_needed = _slot_duration_hours(slot)
    remaining = _hours_remaining(enrollment)

    if remaining < hours_needed:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=(
                f"INSUFFICIENT_HOURS: This slot requires {hours_needed}h but "
                f"only {remaining}h remain in your enrollment."
            ),
        )

    # Reserve the slot
    slot.is_booked = True
    db.add(slot)

    # Deduct hours upfront
    enrollment.hours_used = Decimal(str(enrollment.hours_used)) + hours_needed
    db.add(enrollment)

    booking = ClassBooking(
        enrollment_id=enrollment_id,
        availability_id=availability_id,
        status=BookingStatus.scheduled,
        hours_deducted=hours_needed,
        booked_at=datetime.now(timezone.utc),
    )
    db.add(booking)
    db.flush()

    _queue_notification(
        user_id=enrollment.user_id,
        channel=NotificationChannel.whatsapp,
        notif_type="class_reminder",
        content=(
            f"Your class has been booked for {slot.date} "
            f"from {slot.start_time} to {slot.end_time}. "
            "See you then!"
        ),
        db=db,
    )

    db.commit()
    db.refresh(booking)
    return booking


def complete_booking(booking_id: int, db: Session) -> ClassBooking:
    """
    Mark a scheduled booking as completed.

    Called by admin or an automated process after the class has taken place.
    For group courses, hours are deducted at this point (not at booking time,
    since group classes happen on a fixed schedule and students do not
    explicitly book them — they are enrolled and attend automatically).

    Business rules:
      - Booking must be in 'scheduled' status.
      - For individual courses: hours were already deducted at booking time; no change.
      - For group courses: deduct hours_deducted from enrollment.hours_used now.

    Returns the updated ClassBooking.

    Raises:
      404  BOOKING_NOT_FOUND
      400  BOOKING_NOT_SCHEDULED
    """
    booking = _get_booking_or_404(booking_id, db)

    if booking.status != BookingStatus.scheduled:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"BOOKING_NOT_SCHEDULED: Cannot complete a booking with status '{booking.status}'.",
        )

    enrollment = _get_enrollment_or_404(booking.enrollment_id, db)
    course = db.get(Course, enrollment.course_id)

    # For group courses, deduct hours upon completion (not at scheduling time)
    if course and course.type == CourseType.group:
        slot = db.get(TeacherAvailability, booking.availability_id)
        if slot:
            hours_to_deduct = _slot_duration_hours(slot)
            booking.hours_deducted = hours_to_deduct
            enrollment.hours_used = Decimal(str(enrollment.hours_used)) + hours_to_deduct
            db.add(enrollment)

    booking.status = BookingStatus.completed
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


def mark_no_show(booking_id: int, db: Session) -> ClassBooking:
    """
    Mark a booking as no_show when the student did not attend.

    For individual courses: the hours that were pre-deducted are NOT refunded
    (the teacher's time was reserved). This is the business's discretion;
    adjust if a no-show refund policy is introduced.

    For group courses: hours are not deducted (complete_booking was never called).

    Returns the updated ClassBooking.

    Raises:
      404  BOOKING_NOT_FOUND
      400  BOOKING_NOT_SCHEDULED
    """
    booking = _get_booking_or_404(booking_id, db)

    if booking.status != BookingStatus.scheduled:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot mark no-show for a booking with status '{booking.status}'.",
        )

    booking.status = BookingStatus.no_show
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


# ---------------------------------------------------------------------------
# Read helpers
# ---------------------------------------------------------------------------

def get_available_slots(teacher_id: int, db: Session) -> list[TeacherAvailability]:
    """Return all unbooked future availability slots for a teacher."""
    today = datetime.now(timezone.utc).date()
    return (
        db.query(TeacherAvailability)
        .filter(
            TeacherAvailability.teacher_id == teacher_id,
            TeacherAvailability.is_booked == False,  # noqa: E712
            TeacherAvailability.date >= today,
        )
        .order_by(TeacherAvailability.date.asc(), TeacherAvailability.start_time.asc())
        .all()
    )


def get_enrollment_bookings(enrollment_id: int, db: Session) -> list[ClassBooking]:
    """Return all bookings for a given enrollment, most recent first."""
    return (
        db.query(ClassBooking)
        .filter(ClassBooking.enrollment_id == enrollment_id)
        .order_by(ClassBooking.booked_at.desc())
        .all()
    )


def get_booking(booking_id: int, db: Session) -> ClassBooking:
    return _get_booking_or_404(booking_id, db)