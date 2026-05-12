"""add terms acceptance to users

Revision ID: a1c2d3e4f5a6
Revises: e1b4a9d2c7f3
Create Date: 2026-05-06 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1c2d3e4f5a6"
down_revision: Union[str, Sequence[str], None] = "e1b4a9d2c7f3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(
            sa.Column(
                "terms_accepted",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            )
        )
        batch_op.add_column(sa.Column("terms_accepted_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("terms_accepted_at")
        batch_op.drop_column("terms_accepted")
