from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import (
    User, Course, Enrollment, PreEnrollment, Waitlist, Notification,
    CourseType, CourseStatus, EnrollmentStatus, PreEnrollmentStatus,
    WaitlistStatus, NotificationChannel, NotificationStatus,
)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_user_or_404(user_id: int, db: Session) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def _get_course_or_404(course_id: int, db: Session) -> Course:
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


def _get_enrollment_or_404(enrollment_id: int, db: Session) -> Enrollment:
    enrollment = db.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    return enrollment


def _count_active_enrollments(course_id: int, db: Session) -> int:
    return (
        db.query(func.count(Enrollment.id))
        .filter(
            Enrollment.course_id == course_id,
            Enrollment.status == EnrollmentStatus.active,
        )
        .scalar()
    )


def _queue_notification(user_id: int, channel: NotificationChannel,
                         notif_type: str, content: str, db: Session) -> None:
    """Insert a pending notification record. Dispatching is handled by notification_service."""
    notif = Notification(
        user_id=user_id,
        channel=channel,
        type=notif_type,
        content=content,
        status=NotificationStatus.pending,
    )
    db.add(notif)


def _next_waitlist_position(course_id: int, db: Session) -> int:
    max_pos = (
        db.query(func.max(Waitlist.position))
        .filter(Waitlist.course_id == course_id)
        .scalar()
    )
    return (max_pos or 0) + 1


# ---------------------------------------------------------------------------
# Pre-condition validation
# ---------------------------------------------------------------------------

def _validate_user_email_verified(user: User) -> None:
    if not user.email_verified_at:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            detail="Email address must be verified before enrolling.",
        )


def _validate_course_enrollable(course: Course) -> None:
    if course.status not in (CourseStatus.active, CourseStatus.full):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Course is not available for enrollment (status: {course.status}).",
        )


def _validate_no_duplicate_enrollment(user_id: int, course_id: int, db: Session) -> None:
    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == user_id,
            Enrollment.course_id == course_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Student is already enrolled in this course.",
        )


def _validate_group_capacity(course: Course, db: Session) -> None:
    """Raise COURSE_FULL if the group course has no remaining seats."""
    if course.type != CourseType.group:
        return
    active_count = _count_active_enrollments(course.id, db)
    if active_count >= course.max_students:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="COURSE_FULL",
        )


# ---------------------------------------------------------------------------
# Core enrollment creation (shared by enroll + convert_pre_enrollments)
# ---------------------------------------------------------------------------

def _create_enrollment(user_id: int, course_id: int, db: Session) -> Enrollment:
    enrollment = Enrollment(
        user_id=user_id,
        course_id=course_id,
        status=EnrollmentStatus.active,
        hours_total=0,
        hours_used=0,
        enrolled_at=datetime.now(timezone.utc),
    )
    db.add(enrollment)
    db.flush()  # populate enrollment.id before notification insert

    _queue_notification(
        user_id=user_id,
        channel=NotificationChannel.email,
        notif_type="enrollment_confirmation",
        content=f"You have been successfully enrolled in course {course_id}.",
        db=db,
    )

    return enrollment


def _update_course_status_if_full(course: Course, db: Session) -> None:
    active_count = _count_active_enrollments(course.id, db)
    if course.type == CourseType.group and active_count >= course.max_students:
        course.status = CourseStatus.full
        db.add(course)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def enroll(user_id: int, course_id: int, db: Session) -> Enrollment:
    """
    Enroll a student in a course.

    Business rules enforced:
      - User email must be verified.
      - No duplicate enrollment for the same (user, course) pair.
      - Course must be active (status 'full' also checked — raises COURSE_FULL).
      - Group courses: active enrollment count must be below max_students.

    On success:
      - Creates an Enrollment record (hours_total=0, hours_used=0).
      - Queues an enrollment-confirmation email notification.
      - Updates course status to 'full' if max capacity is now reached.

    Raises:
      403  if email is not verified.
      404  if user or course does not exist.
      409  COURSE_FULL if group course has no seats.
      409  if student is already enrolled.
      400  if course is not in an enrollable state.
    """
    user = _get_user_or_404(user_id, db)
    course = _get_course_or_404(course_id, db)

    _validate_user_email_verified(user)
    _validate_no_duplicate_enrollment(user_id, course_id, db)
    _validate_course_enrollable(course)
    _validate_group_capacity(course, db)

    enrollment = _create_enrollment(user_id, course_id, db)
    _update_course_status_if_full(course, db)

    db.commit()
    db.refresh(enrollment)
    return enrollment


def join_waitlist(user_id: int, course_id: int, db: Session) -> Waitlist:
    """
    Place a student on the waitlist for a full group course.

    Intended to be called by the router after receiving a COURSE_FULL error
    from enroll(), or directly when the course is already known to be full.

    Business rules enforced:
      - User email must be verified.
      - Course must be of type 'group' and status 'full'.
      - Student must not already be enrolled in this course.
      - Student must not already have an active waitlist entry.

    Raises:
      403  if email is not verified.
      404  if user or course does not exist.
      400  if course is not a group course or not full.
      409  if student is already enrolled or already on the waitlist.
    """
    user = _get_user_or_404(user_id, db)
    course = _get_course_or_404(course_id, db)

    _validate_user_email_verified(user)

    if course.type != CourseType.group:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Waitlist is only available for group courses.",
        )
    if course.status != CourseStatus.full:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Course is not full; enroll directly instead.",
        )

    already_enrolled = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == user_id,
            Enrollment.course_id == course_id,
            Enrollment.status == EnrollmentStatus.active,
        )
        .first()
    )
    if already_enrolled:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Student is already enrolled in this course.",
        )

    already_waiting = (
        db.query(Waitlist)
        .filter(
            Waitlist.user_id == user_id,
            Waitlist.course_id == course_id,
            Waitlist.status.in_([WaitlistStatus.waiting, WaitlistStatus.offered]),
        )
        .first()
    )
    if already_waiting:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Student is already on the waitlist for this course.",
        )

    entry = Waitlist(
        user_id=user_id,
        course_id=course_id,
        position=_next_waitlist_position(course_id, db),
        status=WaitlistStatus.waiting,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def pre_enroll(user_id: int, course_id: int, db: Session) -> PreEnrollment:
    """
    Express intent to join a course that is not yet open (status='draft').

    Business rules enforced:
      - User email must be verified.
      - Course must be in 'draft' status.
      - No duplicate pre-enrollment for the same (user, course) pair.

    Raises:
      403  if email is not verified.
      404  if user or course does not exist.
      400  if course is not in draft.
      409  if a pre-enrollment already exists.
    """
    user = _get_user_or_404(user_id, db)
    course = _get_course_or_404(course_id, db)

    _validate_user_email_verified(user)

    if course.status != CourseStatus.draft:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Pre-enrollment is only available for courses in draft status.",
        )

    existing = (
        db.query(PreEnrollment)
        .filter(
            PreEnrollment.user_id == user_id,
            PreEnrollment.course_id == course_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail="Student has already pre-enrolled in this course.",
        )

    pre = PreEnrollment(
        user_id=user_id,
        course_id=course_id,
        status=PreEnrollmentStatus.pending,
    )
    db.add(pre)
    db.commit()
    db.refresh(pre)
    return pre


def convert_pre_enrollments(course_id: int, db: Session) -> dict:
    """
    Convert pending pre-enrollments into real enrollments when a course
    transitions from 'draft' to 'active'.

    Called by the courses router (or admin service) after updating
    course.status to 'active'.

    Logic:
      - Fetches all 'pending' pre-enrollments ordered by created_at (FIFO).
      - For each, enrolls the student up to max_students.
      - Once the course is full, remaining pre-enrollees go to the waitlist
        in the same FIFO order.
      - All pre-enrollment records are marked 'converted' regardless of outcome.

    Returns a summary dict: { "enrolled": int, "waitlisted": int }
    """
    course = _get_course_or_404(course_id, db)

    if course.status != CourseStatus.active:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Course must be active before converting pre-enrollments.",
        )

    pending = (
        db.query(PreEnrollment)
        .filter(
            PreEnrollment.course_id == course_id,
            PreEnrollment.status == PreEnrollmentStatus.pending,
        )
        .order_by(PreEnrollment.created_at.asc())
        .all()
    )

    enrolled_count = 0
    waitlisted_count = 0

    for pre in pending:
        active_count = _count_active_enrollments(course_id, db)
        is_full = (
            course.type == CourseType.group
            and active_count >= course.max_students
        )

        if not is_full:
            _create_enrollment(pre.user_id, course_id, db)
            enrolled_count += 1
            _update_course_status_if_full(course, db)
        else:
            entry = Waitlist(
                user_id=pre.user_id,
                course_id=course_id,
                position=_next_waitlist_position(course_id, db),
                status=WaitlistStatus.waiting,
            )
            db.add(entry)
            waitlisted_count += 1

        pre.status = PreEnrollmentStatus.converted
        db.add(pre)

    db.commit()
    return {"enrolled": enrolled_count, "waitlisted": waitlisted_count}


def get_enrollment(enrollment_id: int, db: Session) -> Enrollment:
    """Fetch a single enrollment by ID."""
    return _get_enrollment_or_404(enrollment_id, db)


def get_student_enrollments(user_id: int, db: Session) -> list[Enrollment]:
    """Return all enrollments for a given student, most recent first."""
    _get_user_or_404(user_id, db)
    return (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user_id)
        .order_by(Enrollment.enrolled_at.desc())
        .all()
    )