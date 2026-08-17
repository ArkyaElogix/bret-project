"""add single use registration completed audit action

Revision ID: d0ebd6cd4463
Revises: 0762ca80777a
Create Date: 2026-08-17 11:51:54.686870

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd0ebd6cd4463'
down_revision: Union[str, Sequence[str], None] = '0762ca80777a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("""
        ALTER TABLE audit_logs
        MODIFY COLUMN action ENUM(
            'USER_REGISTER',
            'USER_LOGIN',
            'USER_LOGOUT',
            'DATA_EXPORT',
            'ACCOUNT_DELETE',
            'PASSWORD_RESET_REQUEST',
            'PASSWORD_RESET_COMPLETE',
            'ADMIN_VIEW_USER',
            'ADMIN_VIEW_SESSION',
            'CONSENT_GIVEN',
            'DUPLICATE_FLAGGED',
            'DUPLICATE_REVIEWED',
            'USER_PROFILE_UPDATE',
            'SINGLE_USE_CREATED',
            'SINGLE_USE_REGISTRATION_COMPLETED',
            'SINGLE_USE_LOCKED',
            'SINGLE_USE_ADMIN_UNLOCK',
            'SINGLE_USE_DELETED'
        ) NOT NULL
    """)


def downgrade():
    op.execute("""
        ALTER TABLE audit_logs
        MODIFY COLUMN action ENUM(
            'USER_REGISTER',
            'USER_LOGIN',
            'USER_LOGOUT',
            'DATA_EXPORT',
            'ACCOUNT_DELETE',
            'PASSWORD_RESET_REQUEST',
            'PASSWORD_RESET_COMPLETE',
            'ADMIN_VIEW_USER',
            'ADMIN_VIEW_SESSION',
            'CONSENT_GIVEN',
            'DUPLICATE_FLAGGED',
            'DUPLICATE_REVIEWED',
            'USER_PROFILE_UPDATE',
            'SINGLE_USE_CREATED',
            'SINGLE_USE_LOCKED',
            'SINGLE_USE_ADMIN_UNLOCK',
            'SINGLE_USE_DELETED'
        ) NOT NULL
    """)