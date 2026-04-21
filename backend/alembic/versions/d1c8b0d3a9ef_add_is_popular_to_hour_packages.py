"""add is_popular to hour_packages

Revision ID: d1c8b0d3a9ef
Revises: 7a45fa66c209
Create Date: 2026-04-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1c8b0d3a9ef'
down_revision: Union[str, Sequence[str], None] = '7a45fa66c209'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("hour_packages")}

    if "is_popular" not in columns:
        op.add_column(
            "hour_packages",
            sa.Column("is_popular", sa.Boolean(), nullable=True, server_default=sa.text("0")),
        )


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("hour_packages")}

    if "is_popular" in columns:
        op.drop_column("hour_packages", "is_popular")
