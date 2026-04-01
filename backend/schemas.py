from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date, time
from decimal import Decimal
from models import (
    UserRole, CourseLevel, CourseType, CourseRegime, CourseStatus,
    DayOfWeek, WaitlistStatus, PaymentStatus, PaymentType,
    EnrollmentStatus, PreEnrollmentStatus, NotificationChannel,
    NotificationStatus, BookingStatus
)

# ─────────────────────────────────────────
# USERS
# ─────────────────────────────────────────

class UserBase(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    street: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    notes: Optional[str] = None

class UserCreate(UserBase):
    email: EmailStr
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    google_id: Optional[str] = None
    facebook_id: Optional[str] = None
    apple_id: Optional[str] = None
    email_verified_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─────────────────────────────────────────
# TEACHERS
# ─────────────────────────────────────────

class TeacherBase(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    email: Optional[str] = None

class TeacherCreate(TeacherBase):
    name: str
    email: str

class TeacherUpdate(TeacherBase):
    pass

class TeacherResponse(TeacherBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─────────────────────────────────────────
# HOUR PACKAGES
# ─────────────────────────────────────────

class HourPackageBase(BaseModel):
    name: Optional[str] = None
    hours: Optional[Decimal] = None
    price: Optional[Decimal] = None
    is_trial: Optional[bool] = False
    is_active: Optional[bool] = True

class HourPackageCreate(HourPackageBase):
    name: str
    hours: Decimal
    price: Decimal

class HourPackageUpdate(HourPackageBase):
    pass

class HourPackageResponse(HourPackageBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─────────────────────────────────────────
# COURSES
# ─────────────────────────────────────────

class CourseBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    level: Optional[CourseLevel] = None
    type: Optional[CourseType] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_hours: Optional[Decimal] = None
    max_students: Optional[int] = None
    regime: Optional[CourseRegime] = None
    location: Optional[str] = None
    teacher_id: Optional[int] = None
    status: Optional[CourseStatus] = CourseStatus.draft

class CourseCreate(CourseBase):
    title: str
    level: CourseLevel
    type: CourseType
    regime: CourseRegime

class CourseUpdate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─────────────────────────────────────────
# COURSE SCHEDULES
# ─────────────────────────────────────────

class CourseScheduleBase(BaseModel):
    course_id: Optional[int] = None
    day_of_week: Optional[DayOfWeek] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None

class CourseScheduleCreate(CourseScheduleBase):
    course_id: int
    day_of_week: DayOfWeek
    start_time: time
    end_time: time

class CourseScheduleUpdate(CourseScheduleBase):
    pass

class CourseScheduleResponse(CourseScheduleBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─────────────────────────────────────────
# WAITLIST
# ─────────────────────────────────────────

class WaitlistBase(BaseModel):
    user_id: Optional[int] = None
    course_id: Optional[int] = None
    position: Optional[int] = None
    status: Optional[WaitlistStatus] = WaitlistStatus.waiting

class WaitlistCreate(WaitlistBase):
    user_id: int
    course_id: int

class WaitlistUpdate(WaitlistBase):
    pass

class WaitlistResponse(WaitlistBase):
    id: int
    notified_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─────────────────────────────────────────
# PAYMENTS
# ─────────────────────────────────────────

class PaymentBase(BaseModel):
    user_id: Optional[int] = None
    package_id: Optional[int] = None
    stripe_payment_id: Optional[str] = None
    stripe_receipt_url: Optional[str] = None
    amount: Optional[Decimal] = None
    status: Optional[PaymentStatus] = PaymentStatus.pending
    type: Optional[PaymentType] = None

class PaymentCreate(PaymentBase):
    user_id: int
    amount: Decimal
    type: PaymentType

class PaymentUpdate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: int
    paid_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─────────────────────────────────────────
# HOUR TRANSFERS
# ─────────────────────────────────────────

class HourTransferBase(BaseModel):
    from_user_id: Optional[int] = None
    to_user_id: Optional[int] = None
    hours_transferred: Optional[Decimal] = None
    reason: Optional[str] = None

class HourTransferCreate(HourTransferBase):
    from_user_id: int
    to_user_id: int
    hours_transferred: Decimal

class HourTransferResponse(HourTransferBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─────────────────────────────────────────
# PRE-ENROLLMENTS
# ─────────────────────────────────────────

class PreEnrollmentBase(BaseModel):
    user_id: Optional[int] = None
    course_id: Optional[int] = None
    status: Optional[PreEnrollmentStatus] = PreEnrollmentStatus.pending

class PreEnrollmentCreate(PreEnrollmentBase):
    user_id: int
    course_id: int

class PreEnrollmentUpdate(PreEnrollmentBase):
    pass

class PreEnrollmentResponse(PreEnrollmentBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─────────────────────────────────────────
# ENROLLMENTS
# ─────────────────────────────────────────

class EnrollmentBase(BaseModel):
    user_id: Optional[int] = None
    course_id: Optional[int] = None
    status: Optional[EnrollmentStatus] = EnrollmentStatus.active
    hours_total: Optional[Decimal] = None
    hours_used: Optional[Decimal] = Decimal("0")
    enrolled_at: Optional[datetime] = None

class EnrollmentCreate(EnrollmentBase):
    user_id: int
    course_id: int
    hours_total: Decimal

class EnrollmentUpdate(EnrollmentBase):
    pass

class EnrollmentResponse(EnrollmentBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─────────────────────────────────────────
# NOTIFICATIONS
# ─────────────────────────────────────────

class NotificationBase(BaseModel):
    user_id: Optional[int] = None
    channel: Optional[NotificationChannel] = None
    type: Optional[str] = None
    content: Optional[str] = None
    status: Optional[NotificationStatus] = NotificationStatus.pending

class NotificationCreate(NotificationBase):
    user_id: int
    channel: NotificationChannel
    type: str

class NotificationUpdate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: int
    sent_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─────────────────────────────────────────
# TEACHER AVAILABILITY
# ─────────────────────────────────────────

class TeacherAvailabilityBase(BaseModel):
    teacher_id: Optional[int] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_booked: Optional[bool] = False

class TeacherAvailabilityCreate(TeacherAvailabilityBase):
    teacher_id: int
    date: date
    start_time: time
    end_time: time

class TeacherAvailabilityUpdate(TeacherAvailabilityBase):
    pass

class TeacherAvailabilityResponse(TeacherAvailabilityBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─────────────────────────────────────────
# CLASS BOOKINGS
# ─────────────────────────────────────────

class ClassBookingBase(BaseModel):
    enrollment_id: Optional[int] = None
    availability_id: Optional[int] = None
    status: Optional[BookingStatus] = BookingStatus.scheduled
    hours_deducted: Optional[Decimal] = None
    booked_at: Optional[datetime] = None

class ClassBookingCreate(ClassBookingBase):
    enrollment_id: int
    availability_id: int
    hours_deducted: Decimal

class ClassBookingUpdate(ClassBookingBase):
    pass

class ClassBookingResponse(ClassBookingBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True