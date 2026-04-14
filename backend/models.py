from sqlalchemy import (Column, BigInteger, String, Text, Enum, DateTime, Date,
    Time, Boolean, Numeric, SmallInteger, Integer, ForeignKey, UniqueConstraint)
from sqlalchemy.sql import func
from database import Base
import enum

# --- Enum Types ---

class UserRole(str, enum.Enum):
    student = "student"
    admin = "admin"

class CourseLevel(str, enum.Enum):
    A1 = "A1"; A2 = "A2"; B1 = "B1"; B2 = "B2"; C1 = "C1"; C2 = "C2"
    Business = "Business"

class CourseType(str, enum.Enum):
    individual = "individual"
    group = "group"

class CourseRegime(str, enum.Enum):
    remote = "remote"
    in_person = "in-person"
    hybrid = "hybrid"

class CourseStatus(str, enum.Enum):
    draft = "draft"; active = "active"; full = "full"; completed = "completed"

class DayOfWeek(str, enum.Enum):
    Mon = "Mon"; Tue = "Tue"; Wed = "Wed"; Thu = "Thu"
    Fri = "Fri"; Sat = "Sat"; Sun = "Sun"

class WaitlistStatus(str, enum.Enum):
    waiting = "waiting"; offered = "offered"
    accepted = "accepted"; expired = "expired"

class PaymentStatus(str, enum.Enum):
    pending = "pending"; paid = "paid"
    failed = "failed"; refunded = "refunded"

class PaymentType(str, enum.Enum):
    package = "package"; extra_hour = "extra_hour"; trial = "trial"

class EnrollmentStatus(str, enum.Enum):
    active = "active"; completed = "completed"
    transferred = "transferred"; canceled = "canceled"

class PreEnrollmentStatus(str, enum.Enum):
    pending = "pending"; converted = "converted"; cancelled = "cancelled"
    
class CommentStatus(str, enum.Enum):
    pending = "pending"; published = "published"; hidden = "hidden"

class NotificationChannel(str, enum.Enum):
    whatsapp = "whatsapp"; email = "email"

class NotificationStatus(str, enum.Enum):
    pending = "pending"; sent = "sent"; failed = "failed"

class BookingStatus(str, enum.Enum):
    scheduled = "scheduled"; completed = "completed"
    cancelled = "cancelled"; no_show = "no_show"


# --- Models ---

class User(Base):
    __tablename__ = "users"
    id = Column(BigInteger, primary_key=True, index=True)
    full_name = Column(String)
    name = Column(String)
    email = Column(String, unique=True)
    phone = Column(String)
    hashed_password = Column(String)
    password = Column(String)
    google_id = Column(String)
    facebook_id = Column(String)
    apple_id = Column(String)
    email_verified_at = Column(DateTime)
    role = Column(Enum(UserRole))
    is_active = Column(Boolean, default=True)
    street = Column(String)
    city = Column(String)
    postal_code = Column(String)
    country = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String)
    bio = Column(Text)
    photo_url = Column(String)
    email = Column(String)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class HourPackage(Base):
    __tablename__ = "hour_packages"
    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String)
    hours = Column(Numeric(5, 1))
    price = Column(Numeric(8, 2))
    is_trial = Column(Boolean)
    is_active = Column(Boolean)
    is_popular = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Course(Base):
    __tablename__ = "courses"
    id = Column(BigInteger, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text)
    level = Column(Enum(CourseLevel))
    type = Column(Enum(CourseType))
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    total_hours = Column(Numeric(5, 1))
    max_students = Column(SmallInteger)
    regime = Column(Enum(CourseRegime))
    location = Column(String)
    teacher_id = Column(BigInteger, ForeignKey("teachers.id"))
    status = Column(Enum(CourseStatus), default=CourseStatus.draft)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class CourseSchedule(Base):
    __tablename__ = "course_schedules"
    id = Column(BigInteger, primary_key=True, index=True)
    course_id = Column(BigInteger, ForeignKey("courses.id"))
    day_of_week = Column(Enum(DayOfWeek))
    start_time = Column(Time)
    end_time = Column(Time)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Waitlist(Base):
    __tablename__ = "waitlist"
    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"))
    course_id = Column(BigInteger, ForeignKey("courses.id"))
    position = Column(Integer)
    status = Column(Enum(WaitlistStatus), default=WaitlistStatus.waiting)
    notified_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())

class Payment(Base):
    __tablename__ = "payments"
    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"))
    package_id = Column(BigInteger, ForeignKey("hour_packages.id"), nullable=True)
    stripe_payment_id = Column(String)
    stripe_receipt_url = Column(String)
    amount = Column(Numeric(8, 2))
    status = Column(Enum(PaymentStatus), default=PaymentStatus.pending)
    type = Column(Enum(PaymentType))
    paid_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())

class HourTransfer(Base):
    __tablename__ = "hour_transfers"
    id = Column(BigInteger, primary_key=True, index=True)
    from_user_id = Column(BigInteger, ForeignKey("users.id"))
    to_user_id = Column(BigInteger, ForeignKey("users.id"))
    hours_transferred = Column(Numeric(5, 1))
    reason = Column(Text)
    created_at = Column(DateTime, default=func.now())

class PreEnrollment(Base):
    __tablename__ = "pre_enrollments"
    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"))
    course_id = Column(BigInteger, ForeignKey("courses.id"))
    status = Column(Enum(PreEnrollmentStatus), default=PreEnrollmentStatus.pending)
    created_at = Column(DateTime, default=func.now())
    __table_args__ = (UniqueConstraint("user_id", "course_id"),)

class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"))
    course_id = Column(BigInteger, ForeignKey("courses.id"))
    status = Column(Enum(EnrollmentStatus), default=EnrollmentStatus.active)
    hours_total = Column(Numeric(5, 1))
    hours_used = Column(Numeric(5, 1), default=0)
    enrolled_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    __table_args__ = (UniqueConstraint("user_id", "course_id"),)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"))
    channel = Column(Enum(NotificationChannel))
    type = Column(String)
    content = Column(Text)
    status = Column(Enum(NotificationStatus), default=NotificationStatus.pending)
    sent_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())

class TeacherAvailability(Base):
    __tablename__ = "teacher_availability"
    id = Column(BigInteger, primary_key=True, index=True)
    teacher_id = Column(BigInteger, ForeignKey("teachers.id"))
    date = Column(Date)
    start_time = Column(Time)
    end_time = Column(Time)
    is_booked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class ClassBooking(Base):
    __tablename__ = "class_bookings"
    id = Column(BigInteger, primary_key=True, index=True)
    enrollment_id = Column(BigInteger, ForeignKey("enrollments.id"))
    availability_id = Column(BigInteger, ForeignKey("teacher_availability.id"))
    status = Column(Enum(BookingStatus), default=BookingStatus.scheduled)
    hours_deducted = Column(Numeric(5, 1))
    booked_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
class FunFactTag(Base):
    __tablename__ = "fun_fact_tags"
    id         = Column(BigInteger, primary_key=True, index=True)
    name       = Column(String, unique=True, nullable=False) 
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class FunFact(Base):
    __tablename__ = "fun_facts"
    id                = Column(BigInteger, primary_key=True, index=True)
    title             = Column(String, nullable=False)
    slug              = Column(String, unique=True, nullable=False, index=True)
    tag_id            = Column(BigInteger, ForeignKey("fun_fact_tags.id"), nullable=False)
    body              = Column(Text, nullable=False)
    key_points        = Column(Text, nullable=False, default=list)
    did_you_know      = Column(Text, nullable=True)
    image_url         = Column(String, nullable=True)
    is_published      = Column(Boolean, default=False, nullable=False)
    created_at        = Column(DateTime, default=func.now())
    updated_at        = Column(DateTime, default=func.now(), onupdate=func.now())
    
class Comment(Base):
    __tablename__ = "comments"
    id          = Column(BigInteger, primary_key=True, index=True)
    author      = Column (String, nullable=False)
    rating      = Column(SmallInteger, nullable=False)
    status      = Column(Enum(CommentStatus), default=CommentStatus.pending)
    body        = Column(Text, nullable=False)
    created_at  = Column(DateTime, default=func.now())
    updated_at  = Column(DateTime, default=func.now(), onupdate=func.now())
