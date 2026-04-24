"""add slot_date to availability

Revision ID: b7f9e2c4d1a0
Revises: 9d2b6c4f1a8e
Create Date: 2026-04-24 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b7f9e2c4d1a0"
down_revision: Union[str, Sequence[str], None] = "9d2b6c4f1a8e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("availability") as batch_op:
        batch_op.add_column(sa.Column("slot_date", sa.Date(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("availability") as batch_op:
        batch_op.drop_column("slot_date")
