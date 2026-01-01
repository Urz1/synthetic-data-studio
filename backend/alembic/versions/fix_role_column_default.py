"""fix_role_column_default

Revision ID: fix_role_default
Revises: add_column_count_datasets
Create Date: 2026-01-01

FIX: When Better Auth creates users via direct SQL INSERT, the 'role' column
was not being set because there was no DATABASE-LEVEL default, only a Python
SQLModel default. This caused users to get unexpected role values.

This migration:
1. Adds a DEFAULT 'user' to the role column at the DB level
2. Updates any existing users with NULL or empty role to 'user'
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fix_role_default'
down_revision: Union[str, Sequence[str], None] = 'add_column_count_datasets'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add default 'user' to role column and fix existing bad data."""
    
    # Step 1: Update any existing users with NULL, empty, or unexpected role to 'user'
    # (Exclude the 'admin' role which is legitimate)
    op.execute(sa.text("""
        UPDATE "users" 
        SET "role" = 'user' 
        WHERE "role" IS NULL 
           OR "role" = '' 
           OR "role" NOT IN ('user', 'admin')
    """))
    
    # Step 2: Add a server-side DEFAULT so future inserts (including from Better Auth)
    # will automatically get role='user' without needing Python code to set it
    op.execute(sa.text("""
        ALTER TABLE "users" 
        ALTER COLUMN "role" SET DEFAULT 'user'
    """))


def downgrade() -> None:
    """Remove the default from role column."""
    op.execute(sa.text("""
        ALTER TABLE "users" 
        ALTER COLUMN "role" DROP DEFAULT
    """))
