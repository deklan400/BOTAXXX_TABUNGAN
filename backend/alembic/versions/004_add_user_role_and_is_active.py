"""Add user role and is_active fields

Revision ID: 004_add_user_role_and_is_active
Revises: 003_add_banks_and_bank_accounts
Create Date: 2025-12-12 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_add_user_role_and_is_active'
down_revision = '003_add_banks_and_bank_accounts'
branch_labels = None
depends_on = None


def upgrade():
    # Add role column with default 'user' for existing users
    op.add_column('users', sa.Column('role', sa.String(), nullable=False, server_default='user'))
    
    # Add is_active column with default True for existing users
    op.add_column('users', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))


def downgrade():
    # Remove columns
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'role')

