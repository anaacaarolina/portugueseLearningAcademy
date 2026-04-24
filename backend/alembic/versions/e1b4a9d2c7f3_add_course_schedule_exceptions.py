"""add course schedule exceptions

Revision ID: e1b4a9d2c7f3
Revises: b7f9e2c4d1a0
Create Date: 2026-04-24 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e1b4a9d2c7f3"
down_revision: Union[str, Sequence[str], None] = "b7f9e2c4d1a0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("course_schedules") as batch_op:
        batch_op.add_column(sa.Column("effective_from", sa.Date(), nullable=True))
        batch_op.add_column(sa.Column("effective_to", sa.Date(), nullable=True))

    op.create_table(
        "course_schedule_exceptions",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("course_id", sa.BigInteger(), nullable=False),
        sa.Column("course_schedule_id", sa.BigInteger(), nullable=True),
        sa.Column("exception_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=True),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column("is_cancelled", sa.Boolean(), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.ForeignKeyConstraint(["course_schedule_id"], ["course_schedules.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_course_schedule_exceptions_id"),
        "course_schedule_exceptions",
        ["id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_course_schedule_exceptions_id"), table_name="course_schedule_exceptions")
    op.drop_table("course_schedule_exceptions")

    with op.batch_alter_table("course_schedules") as batch_op:
        batch_op.drop_column("effective_to")
        batch_op.drop_column("effective_from")
