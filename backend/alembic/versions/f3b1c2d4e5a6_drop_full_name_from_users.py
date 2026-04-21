"""drop full_name from users

Revision ID: f3b1c2d4e5a6
Revises: d1c8b0d3a9ef
Create Date: 2026-04-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f3b1c2d4e5a6"
down_revision: Union[str, Sequence[str], None] = "d1c8b0d3a9ef"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Preserve data by filling empty/NULL name values from full_name before dropping the column.
    op.execute(
        sa.text(
            """
            UPDATE users
            SET name = full_name
            WHERE full_name IS NOT NULL
              AND (name IS NULL OR TRIM(name) = '')
            """
        )
    )

    # batch_alter_table keeps this portable for SQLite and Postgres.
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("full_name")


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("full_name", sa.String(), nullable=True))

    op.execute(
        sa.text(
            """
            UPDATE users
            SET full_name = name
            WHERE name IS NOT NULL
            """
        )
    )
