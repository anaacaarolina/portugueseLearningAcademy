"""create core tables

Revision ID: 9d2b6c4f1a8e
Revises:
Create Date: 2026-04-22 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9d2b6c4f1a8e"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "comments",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("author", sa.String(), nullable=False),
        sa.Column("rating", sa.SmallInteger(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "published", "hidden", name="commentstatus"),
            nullable=True,
        ),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_comments_id"), "comments", ["id"], unique=False)

    op.create_table(
        "fun_fact_tags",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_fun_fact_tags_id"), "fun_fact_tags", ["id"], unique=False)

    op.create_table(
        "hour_packages",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("hours", sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column("price", sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column("is_trial", sa.Boolean(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("is_popular", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_hour_packages_id"), "hour_packages", ["id"], unique=False)

    op.create_table(
        "students",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("course", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_students_id"), "students", ["id"], unique=False)

    op.create_table(
        "teachers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("photo_url", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("course", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_teachers_id"), "teachers", ["id"], unique=False)

    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("password", sa.String(), nullable=True),
        sa.Column("google_id", sa.String(), nullable=True),
        sa.Column("facebook_id", sa.String(), nullable=True),
        sa.Column("apple_id", sa.String(), nullable=True),
        sa.Column("email_verified_at", sa.DateTime(), nullable=True),
        sa.Column("role", sa.Enum("student", "admin", name="userrole"), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("street", sa.String(), nullable=True),
        sa.Column("city", sa.String(), nullable=True),
        sa.Column("postal_code", sa.String(), nullable=True),
        sa.Column("country", sa.String(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    op.create_table(
        "availability",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("teacher_id", sa.Integer(), nullable=True),
        sa.Column("day_of_week", sa.String(), nullable=True),
        sa.Column("start_time", sa.String(), nullable=True),
        sa.Column("end_time", sa.String(), nullable=True),
        sa.Column("is_available", sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(["teacher_id"], ["teachers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_availability_id"), "availability", ["id"], unique=False)

    op.create_table(
        "courses",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "level",
            sa.Enum("A1", "A2", "B1", "B2", "C1", "C2", "Business", name="courselevel"),
            nullable=True,
        ),
        sa.Column("type", sa.Enum("individual", "group", name="coursetype"), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("total_hours", sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column("max_students", sa.SmallInteger(), nullable=True),
        sa.Column(
            "regime",
            sa.Enum("remote", "in_person", "hybrid", name="courseregime"),
            nullable=True,
        ),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("teacher_id", sa.BigInteger(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("draft", "active", "full", "completed", name="coursestatus"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["teacher_id"], ["teachers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_courses_id"), "courses", ["id"], unique=False)

    op.create_table(
        "fun_facts",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("tag_id", sa.BigInteger(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("key_points", sa.Text(), nullable=False),
        sa.Column("did_you_know", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(), nullable=True),
        sa.Column("is_published", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["tag_id"], ["fun_fact_tags.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_fun_facts_id"), "fun_facts", ["id"], unique=False)
    op.create_index(op.f("ix_fun_facts_slug"), "fun_facts", ["slug"], unique=False)

    op.create_table(
        "notifications",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("channel", sa.Enum("whatsapp", "email", name="notificationchannel"), nullable=True),
        sa.Column("type", sa.String(), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "sent", "failed", name="notificationstatus"),
            nullable=True,
        ),
        sa.Column("sent_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_id"), "notifications", ["id"], unique=False)

    op.create_table(
        "payments",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("package_id", sa.BigInteger(), nullable=True),
        sa.Column("stripe_payment_id", sa.String(), nullable=True),
        sa.Column("stripe_receipt_url", sa.String(), nullable=True),
        sa.Column("amount", sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "paid", "failed", "refunded", name="paymentstatus"),
            nullable=True,
        ),
        sa.Column(
            "type",
            sa.Enum("package", "extra_hour", "trial", name="paymenttype"),
            nullable=True,
        ),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["package_id"], ["hour_packages.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_payments_id"), "payments", ["id"], unique=False)

    op.create_table(
        "teacher_availability",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("teacher_id", sa.BigInteger(), nullable=True),
        sa.Column("date", sa.Date(), nullable=True),
        sa.Column("start_time", sa.Time(), nullable=True),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column("is_booked", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["teacher_id"], ["teachers.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_teacher_availability_id"), "teacher_availability", ["id"], unique=False
    )

    op.create_table(
        "course_schedules",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("course_id", sa.BigInteger(), nullable=True),
        sa.Column(
            "day_of_week",
            sa.Enum("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", name="dayofweek"),
            nullable=True,
        ),
        sa.Column("start_time", sa.Time(), nullable=True),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_course_schedules_id"), "course_schedules", ["id"], unique=False)

    op.create_table(
        "enrollments",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("course_id", sa.BigInteger(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "active", "completed", "transferred", "canceled", name="enrollmentstatus"
            ),
            nullable=True,
        ),
        sa.Column("hours_total", sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column("hours_used", sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column("enrolled_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "course_id"),
    )
    op.create_index(op.f("ix_enrollments_id"), "enrollments", ["id"], unique=False)

    op.create_table(
        "hour_transfers",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("from_user_id", sa.BigInteger(), nullable=True),
        sa.Column("to_user_id", sa.BigInteger(), nullable=True),
        sa.Column("hours_transferred", sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["from_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["to_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_hour_transfers_id"), "hour_transfers", ["id"], unique=False)

    op.create_table(
        "pre_enrollments",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("course_id", sa.BigInteger(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "converted", "cancelled", name="preenrollmentstatus"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "course_id"),
    )
    op.create_index(op.f("ix_pre_enrollments_id"), "pre_enrollments", ["id"], unique=False)

    op.create_table(
        "waitlist",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=True),
        sa.Column("course_id", sa.BigInteger(), nullable=True),
        sa.Column("position", sa.Integer(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("waiting", "offered", "accepted", "expired", name="waitliststatus"),
            nullable=True,
        ),
        sa.Column("notified_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_waitlist_id"), "waitlist", ["id"], unique=False)

    op.create_table(
        "class_bookings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("enrollment_id", sa.BigInteger(), nullable=True),
        sa.Column("availability_id", sa.BigInteger(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "scheduled", "completed", "cancelled", "no_show", name="bookingstatus"
            ),
            nullable=True,
        ),
        sa.Column("hours_deducted", sa.Numeric(precision=5, scale=1), nullable=True),
        sa.Column("booked_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["availability_id"], ["teacher_availability.id"]),
        sa.ForeignKeyConstraint(["enrollment_id"], ["enrollments.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_class_bookings_id"), "class_bookings", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_class_bookings_id"), table_name="class_bookings")
    op.drop_table("class_bookings")

    op.drop_index(op.f("ix_waitlist_id"), table_name="waitlist")
    op.drop_table("waitlist")

    op.drop_index(op.f("ix_pre_enrollments_id"), table_name="pre_enrollments")
    op.drop_table("pre_enrollments")

    op.drop_index(op.f("ix_hour_transfers_id"), table_name="hour_transfers")
    op.drop_table("hour_transfers")

    op.drop_index(op.f("ix_enrollments_id"), table_name="enrollments")
    op.drop_table("enrollments")

    op.drop_index(op.f("ix_course_schedules_id"), table_name="course_schedules")
    op.drop_table("course_schedules")

    op.drop_index(op.f("ix_teacher_availability_id"), table_name="teacher_availability")
    op.drop_table("teacher_availability")

    op.drop_index(op.f("ix_payments_id"), table_name="payments")
    op.drop_table("payments")

    op.drop_index(op.f("ix_notifications_id"), table_name="notifications")
    op.drop_table("notifications")

    op.drop_index(op.f("ix_fun_facts_slug"), table_name="fun_facts")
    op.drop_index(op.f("ix_fun_facts_id"), table_name="fun_facts")
    op.drop_table("fun_facts")

    op.drop_index(op.f("ix_courses_id"), table_name="courses")
    op.drop_table("courses")

    op.drop_index(op.f("ix_availability_id"), table_name="availability")
    op.drop_table("availability")

    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")

    op.drop_index(op.f("ix_teachers_id"), table_name="teachers")
    op.drop_table("teachers")

    op.drop_index(op.f("ix_students_id"), table_name="students")
    op.drop_table("students")

    op.drop_index(op.f("ix_hour_packages_id"), table_name="hour_packages")
    op.drop_table("hour_packages")

    op.drop_index(op.f("ix_fun_fact_tags_id"), table_name="fun_fact_tags")
    op.drop_table("fun_fact_tags")

    op.drop_index(op.f("ix_comments_id"), table_name="comments")
    op.drop_table("comments")