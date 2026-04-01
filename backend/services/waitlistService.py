from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import (
    User, Course, Enrollment, Waitlist, Notification,
    CourseStatus, EnrollmentStatus,
    WaitlistStatus, NotificationChannel, NotificationStatus,
)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_waitlist_entry_or_404(waitlist_id: int, db: Session) -> Waitlist:
    entry = db.get(Waitlist, waitlist_id)
    if not entry:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Waitlist entry not found")
    return entry


def _get_next_waiting_entry(course_id: int, db: Session) -> Waitlist | None:
    """Return the lowest-position entry still in 'waiting' status, or None."""
    return (
        db.query(Waitlist)
        .filter(
            Waitlist.course_id == course_id,
            Waitlist.status == WaitlistStatus.waiting,
        )
        .order_by(Waitlist.position.asc())
        .first()
    )


def _count_active_enrollments(course_id: int, db: Session) -> int:
    return (
        db.query(func.count(Enrollment.id))
        .filter(
            Enrollment.course_id == course_id,
            Enrollment.status == EnrollmentStatus.active,
        )
        .scalar()
    )


def _queue_notification(
    user_id: int,
    channel: NotificationChannel,
    notif_type: str,
    content: str,
    db: Session,
) -> None:
    """Insert a pending notification row. Dispatching is handled by notification_service."""
    notif = Notification(
        user_id=user_id,
        channel=channel,
        type=notif_type,
        content=content,
        status=NotificationStatus.pending,
    )
    db.add(notif)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def promote_next(course_id: int, db: Session) -> Waitlist | None:
    """
    Offer the next available spot to the first student in the waitlist queue.

    Called automatically when a slot opens — i.e. when an enrollment is
    transferred or marked completed and the course status flips back to 'active'.

    Logic:
      - Find the lowest-position entry with status 'waiting'.
      - Set it to 'offered' and record notified_at.
      - Queue a WhatsApp + Email notification with the offer.
      - Update course status back to 'full' if it was incorrectly set to 'active'.

    Returns the promoted Waitlist entry, or None if the queue is empty.

    Raises:
      404  if course does not exist.
    """
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Course not found")

    next_entry = _get_next_waiting_entry(course_id, db)
    if not next_entry:
        return None  # queue is empty, nothing to promote

    next_entry.status = WaitlistStatus.offered
    next_entry.notified_at = datetime.now(timezone.utc)
    db.add(next_entry)

    # Notify via both channels as per notification flow spec
    for channel in (NotificationChannel.whatsapp, NotificationChannel.email):
        _queue_notification(
            user_id=next_entry.user_id,
            channel=channel,
            notif_type="waitlist_offer",
            content=(
                f"A spot has opened in course {course_id}. "
                "You have a limited time to accept your place. "
                "Log in to confirm your enrollment."
            ),
            db=db,
        )

    db.commit()
    db.refresh(next_entry)
    return next_entry


def accept_offer(waitlist_id: int, db: Session) -> Enrollment:
    """
    Accept a waitlist offer and convert it into a real enrollment.

    Called when the student confirms they want the offered spot.

    Logic:
      - Entry must be in 'offered' status (not expired, not already accepted).
      - Delegates to enrollment_service.enroll() for enrollment creation,
        which handles all pre-condition checks and notifications.
      - Sets the waitlist entry to 'accepted'.

    Returns the created Enrollment.

    Raises:
      404  if waitlist entry does not exist.
      409  if offer has already been accepted or has expired.
      409  COURSE_FULL if another student filled the spot between offer and acceptance
           (handled by enrollment_service).
    """
    # Import here to avoid circular imports between services
    from services import enrollmentService

    entry = _get_waitlist_entry_or_404(waitlist_id, db)

    if entry.status == WaitlistStatus.accepted:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="This waitlist offer has already been accepted.",
        )
    if entry.status == WaitlistStatus.expired:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="This waitlist offer has expired.",
        )
    if entry.status == WaitlistStatus.waiting:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="No offer has been made for this waitlist entry yet.",
        )

    # enrollment_service.enroll() commits its own transaction,
    # so we update the waitlist entry in a separate step after.
    enrollment = enrollmentService.enroll(entry.user_id, entry.course_id, db)

    entry.status = WaitlistStatus.accepted
    db.add(entry)
    db.commit()

    return enrollment


def expire_offer(waitlist_id: int, db: Session) -> Waitlist | None:
    """
    Expire a waitlist offer that the student did not respond to in time.

    Intended to be called by a background scheduler (e.g. APScheduler or
    a Celery task) that periodically checks for stale 'offered' entries.

    Logic:
      - Entry must be in 'offered' status.
      - Sets status to 'expired'.
      - Queues an expiry email notification to the student.
      - Calls promote_next() to offer the spot to the next person in queue.

    Returns the next promoted Waitlist entry (or None if queue is now empty).

    Raises:
      404  if waitlist entry does not exist.
      400  if entry is not in 'offered' status.
    """
    entry = _get_waitlist_entry_or_404(waitlist_id, db)

    if entry.status != WaitlistStatus.offered:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot expire an entry with status '{entry.status}'. Must be 'offered'.",
        )

    entry.status = WaitlistStatus.expired
    db.add(entry)

    _queue_notification(
        user_id=entry.user_id,
        channel=NotificationChannel.email,
        notif_type="waitlist_offer_expired",
        content=(
            f"Your waitlist offer for course {entry.course_id} has expired "
            "because it was not accepted in time. "
            "You may re-join the waitlist if you are still interested."
        ),
        db=db,
    )

    db.commit()

    # Immediately promote the next person in the queue
    return promote_next(entry.course_id, db)


def expire_stale_offers(offer_window_hours: int, db: Session) -> int:
    """
    Batch-expire all 'offered' entries whose offer window has passed.

    Designed to be called by a periodic background job (e.g. every 15 minutes).
    Uses offer_window_hours to determine how long a student has to accept.

    Returns the number of entries expired.
    """
    from datetime import timedelta

    cutoff = datetime.now(timezone.utc) - timedelta(hours=offer_window_hours)

    stale_entries = (
        db.query(Waitlist)
        .filter(
            Waitlist.status == WaitlistStatus.offered,
            Waitlist.notified_at <= cutoff,
        )
        .all()
    )

    expired_count = 0
    for entry in stale_entries:
        # expire_offer handles notification + promote_next per entry
        expire_offer(entry.id, db)
        expired_count += 1

    return expired_count


def get_waitlist_position(user_id: int, course_id: int, db: Session) -> dict:
    """
    Return the student's current waitlist status and position for a course.

    Returns a dict with 'status', 'position', and 'queue_length'.

    Raises:
      404  if no waitlist entry exists for this (user, course) pair.
    """
    entry = (
        db.query(Waitlist)
        .filter(
            Waitlist.user_id == user_id,
            Waitlist.course_id == course_id,
        )
        .order_by(Waitlist.created_at.desc())
        .first()
    )
    if not entry:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail="No waitlist entry found for this student and course.",
        )

    # Count how many 'waiting' entries are ahead of this one
    entries_ahead = (
        db.query(func.count(Waitlist.id))
        .filter(
            Waitlist.course_id == course_id,
            Waitlist.status == WaitlistStatus.waiting,
            Waitlist.position < entry.position,
        )
        .scalar()
    )

    queue_length = (
        db.query(func.count(Waitlist.id))
        .filter(
            Waitlist.course_id == course_id,
            Waitlist.status == WaitlistStatus.waiting,
        )
        .scalar()
    )

    return {
        "waitlist_id": entry.id,
        "status": entry.status,
        "position": entry.position,
        "entries_ahead": entries_ahead,
        "queue_length": queue_length,
        "notified_at": entry.notified_at,
    }


def get_course_waitlist(course_id: int, db: Session) -> list[Waitlist]:
    """
    Return all waitlist entries for a course, ordered by position.
    Admin-facing — used in /admin/enrollments to show the full queue.
    """
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Course not found")

    return (
        db.query(Waitlist)
        .filter(Waitlist.course_id == course_id)
        .order_by(Waitlist.position.asc())
        .all()
    )