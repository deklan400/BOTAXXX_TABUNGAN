"""add_bank_logo_settings

Revision ID: 005_add_bank_logo_settings
Revises: 004_add_user_role_and_is_active
Create Date: 2025-12-12 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_add_bank_logo_settings'
down_revision = '004_add_user_role_and_is_active'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add logo_background column
    op.add_column('banks', sa.Column('logo_background', sa.String(), nullable=True))
    
    # Add logo_size_width column
    op.add_column('banks', sa.Column('logo_size_width', sa.Integer(), nullable=True))
    
    # Add logo_size_height column
    op.add_column('banks', sa.Column('logo_size_height', sa.Integer(), nullable=True))


def downgrade() -> None:
    # Remove columns
    op.drop_column('banks', 'logo_size_height')
    op.drop_column('banks', 'logo_size_width')
    op.drop_column('banks', 'logo_background')

