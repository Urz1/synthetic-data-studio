"""Cleanup redundant auth tables after better-auth migration.

This migration:
1. Drops redundant token tables (better-auth handles these)
2. Keeps the `users` table (synced from better-auth via proxy)
3. Keeps all FK references to `users.id`

Revision ID: migrate_to_better_auth
Revises: fix_role_default
Create Date: 2026-01-07

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers
revision = 'migrate_to_better_auth'
down_revision = 'fix_role_default'
branch_labels = None
depends_on = None


def upgrade():
    # =========================================================================
    # Drop redundant token tables (better-auth handles these)
    # =========================================================================
    
    # Drop refresh_tokens - better-auth uses sessions instead
    op.drop_table('refresh_tokens')
    
    # Drop email_verification_tokens - better-auth has built-in verification
    op.drop_table('email_verification_tokens')
    
    # Drop password_reset_tokens - better-auth handles password reset
    op.drop_table('password_reset_tokens')
    
    # NOTE: We KEEP the `users` table because:
    # 1. All our tables have UUID FKs to users.id
    # 2. better-auth uses TEXT IDs, which are incompatible
    # 3. The proxy auto-syncs users from better-auth to our users table


def downgrade():
    # Recreate token tables if needed
    
    op.create_table(
        'refresh_tokens',
        sa.Column('id', postgresql.UUID(), primary_key=True),
        sa.Column('user_id', postgresql.UUID(), nullable=False),
        sa.Column('token_hash', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('revoked_at', sa.DateTime(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('replaced_by', postgresql.UUID(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
    )
    
    op.create_table(
        'email_verification_tokens',
        sa.Column('id', postgresql.UUID(), primary_key=True),
        sa.Column('user_id', postgresql.UUID(), nullable=False),
        sa.Column('token_hash', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('consumed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
    )
    
    op.create_table(
        'password_reset_tokens',
        sa.Column('id', postgresql.UUID(), primary_key=True),
        sa.Column('user_id', postgresql.UUID(), nullable=False),
        sa.Column('token_hash', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('request_ip', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
    )
