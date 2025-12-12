"""add_banks_and_bank_accounts

Revision ID: 003_add_banks_and_bank_accounts
Revises: 002_add_user_telegram_ids
Create Date: 2024-12-12 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_add_banks_and_bank_accounts'
down_revision = '002_add_user_telegram_ids'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create banks table (master data)
    op.create_table(
        'banks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('code', sa.String(), nullable=False),
        sa.Column('logo_filename', sa.String(), nullable=True),
        sa.Column('brand_color', sa.String(), nullable=True),
        sa.Column('country', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_banks_id'), 'banks', ['id'], unique=False)
    op.create_index(op.f('ix_banks_name'), 'banks', ['name'], unique=True)
    op.create_index(op.f('ix_banks_code'), 'banks', ['code'], unique=True)
    
    # Create bank_accounts table
    op.create_table(
        'bank_accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('bank_id', sa.Integer(), nullable=False),
        sa.Column('account_holder_name', sa.String(), nullable=False),
        sa.Column('account_number', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['bank_id'], ['banks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_bank_accounts_id'), 'bank_accounts', ['id'], unique=False)
    op.create_index(op.f('ix_bank_accounts_user_id'), 'bank_accounts', ['user_id'], unique=False)
    op.create_index(op.f('ix_bank_accounts_bank_id'), 'bank_accounts', ['bank_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_bank_accounts_bank_id'), table_name='bank_accounts')
    op.drop_index(op.f('ix_bank_accounts_user_id'), table_name='bank_accounts')
    op.drop_index(op.f('ix_bank_accounts_id'), table_name='bank_accounts')
    op.drop_table('bank_accounts')
    
    op.drop_index(op.f('ix_banks_code'), table_name='banks')
    op.drop_index(op.f('ix_banks_name'), table_name='banks')
    op.drop_index(op.f('ix_banks_id'), table_name='banks')
    op.drop_table('banks')

