"""add_user_telegram_ids_table

Revision ID: 002_add_user_telegram_ids
Revises: 001_initial
Create Date: 2024-12-09 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_add_user_telegram_ids'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create user_telegram_ids table
    op.create_table(
        'user_telegram_ids',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('telegram_id', sa.String(), nullable=False),
        sa.Column('telegram_username', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_telegram_ids_user_id'), 'user_telegram_ids', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_telegram_ids_telegram_id'), 'user_telegram_ids', ['telegram_id'], unique=False)
    
    # Create unique constraint for user_id + telegram_id combination
    op.create_index('ix_user_telegram_ids_user_telegram', 'user_telegram_ids', ['user_id', 'telegram_id'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_user_telegram_ids_user_telegram', table_name='user_telegram_ids')
    op.drop_index(op.f('ix_user_telegram_ids_telegram_id'), table_name='user_telegram_ids')
    op.drop_index(op.f('ix_user_telegram_ids_user_id'), table_name='user_telegram_ids')
    op.drop_table('user_telegram_ids')

