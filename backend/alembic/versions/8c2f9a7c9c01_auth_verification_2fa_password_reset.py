"""Auth: email verification, 2FA fields, password reset tokens

Revision ID: 8c2f9a7c9c01
Revises: 3b86159cc15f
Create Date: 2025-12-12

"""

from typing import Sequence, Union, Any, cast

from alembic import op
import sqlalchemy as sa
# Alembic op module uses dynamic attributes that type checkers can't resolve.
# These are false positives - the code is correct and functional.
# type: ignore

# revision identifiers, used by Alembic.
revision: str = "8c2f9a7c9c01"
down_revision: str | None = "3b86159cc15f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users: email verification
    op.add_column("users", sa.Column("is_email_verified", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("email_verified_at", sa.DateTime(), nullable=True))

    # Users: brute-force lockout
    op.add_column("users", sa.Column("failed_login_attempts", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("locked_until", sa.DateTime(), nullable=True))

    # Users: optional 2FA
    op.add_column("users", sa.Column("is_2fa_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("totp_secret_encrypted", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("last_2fa_verified_at", sa.DateTime(), nullable=True))

    # Users: phone verification plumbing
    op.add_column("users", sa.Column("phone_number", sa.String(), nullable=True))
    op.add_column("users", sa.Column("is_phone_verified", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("phone_verified_at", sa.DateTime(), nullable=True))

    op.create_index(op.f("ix_users_is_email_verified"), "users", ["is_email_verified"], unique=False)
    op.create_index(op.f("ix_users_is_2fa_enabled"), "users", ["is_2fa_enabled"], unique=False)
    op.create_index(op.f("ix_users_is_phone_verified"), "users", ["is_phone_verified"], unique=False)
    op.create_index(op.f("ix_users_phone_number"), "users", ["phone_number"], unique=False)

    # Composite uniqueness for OAuth identity (allows multiple NULLs)
    op.create_unique_constraint("uq_users_oauth_provider_id", "users", ["oauth_provider", "oauth_id"])

    # Email verification tokens
    op.create_table(
        "email_verification_tokens",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("consumed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_email_verification_tokens_user_id"), "email_verification_tokens", ["user_id"], unique=False)
    op.create_index(op.f("ix_email_verification_tokens_token_hash"), "email_verification_tokens", ["token_hash"], unique=True)

    # Password reset tokens
    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("request_ip", sa.String(length=255), nullable=True),
        sa.Column("user_agent", sa.String(length=1000), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_password_reset_tokens_user_id"), "password_reset_tokens", ["user_id"], unique=False)
    op.create_index(op.f("ix_password_reset_tokens_token_hash"), "password_reset_tokens", ["token_hash"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_password_reset_tokens_token_hash"), table_name="password_reset_tokens")
    op.drop_index(op.f("ix_password_reset_tokens_user_id"), table_name="password_reset_tokens")
    op.drop_table("password_reset_tokens")

    op.drop_index(op.f("ix_email_verification_tokens_token_hash"), table_name="email_verification_tokens")
    op.drop_index(op.f("ix_email_verification_tokens_user_id"), table_name="email_verification_tokens")
    op.drop_table("email_verification_tokens")

    op.drop_constraint("uq_users_oauth_provider_id", "users", type_="unique")

    op.drop_index(op.f("ix_users_phone_number"), table_name="users")
    op.drop_index(op.f("ix_users_is_phone_verified"), table_name="users")
    op.drop_index(op.f("ix_users_is_2fa_enabled"), table_name="users")
    op.drop_index(op.f("ix_users_is_email_verified"), table_name="users")

    op.execute(sa.text('ALTER TABLE "users" DROP COLUMN IF EXISTS "phone_verified_at"'))
    op.execute(sa.text('ALTER TABLE "users" DROP COLUMN IF EXISTS "is_phone_verified"'))
    op.execute(sa.text('ALTER TABLE "users" DROP COLUMN IF EXISTS "phone_number"'))

    op.execute(sa.text('ALTER TABLE "users" DROP COLUMN IF EXISTS "last_2fa_verified_at"'))
    op.execute(sa.text('ALTER TABLE "users" DROP COLUMN IF EXISTS "totp_secret_encrypted"'))
    op.execute(sa.text('ALTER TABLE "users" DROP COLUMN IF EXISTS "is_2fa_enabled"'))

    op.execute(sa.text('ALTER TABLE "users" DROP COLUMN IF EXISTS "locked_until"'))
    op.execute(sa.text('ALTER TABLE "users" DROP COLUMN IF EXISTS "failed_login_attempts"'))

    op.execute(sa.text('ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verified_at"'))
    op.execute(sa.text('ALTER TABLE "users" DROP COLUMN IF EXISTS "is_email_verified"'))