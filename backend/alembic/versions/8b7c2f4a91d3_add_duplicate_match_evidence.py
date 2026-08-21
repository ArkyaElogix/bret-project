"""add duplicate match evidence

Revision ID: 8b7c2f4a91d3
Revises: d0ebd6cd4463
Create Date: 2026-08-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8b7c2f4a91d3"
down_revision: Union[str, Sequence[str], None] = "d0ebd6cd4463"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "duplicate_flags",
        "prior_session_id",
        existing_type=sa.Integer(),
        nullable=True,
    )

    op.add_column(
        "duplicate_flags",
        sa.Column("match_evidence", sa.JSON(), nullable=True),
    )

    op.execute("""
        ALTER TABLE duplicate_flags
        MODIFY COLUMN match_type ENUM(
            'EMAIL',
            'PHONE',
            'NAME_ADDRESS',
            'PRIOR_ATTEMPT'
        ) NOT NULL
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE duplicate_flags
        MODIFY COLUMN match_type ENUM(
            'EMAIL',
            'PHONE',
            'NAME_ADDRESS'
        ) NOT NULL
    """)

    op.drop_column("duplicate_flags", "match_evidence")

    op.alter_column(
        "duplicate_flags",
        "prior_session_id",
        existing_type=sa.Integer(),
        nullable=False,
    )