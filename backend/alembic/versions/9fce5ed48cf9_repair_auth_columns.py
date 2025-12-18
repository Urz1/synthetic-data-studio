"""repair auth columns

Revision ID: 9fce5ed48cf9
Revises: 8c2f9a7c9c01
Create Date: 2025-12-13 23:13:34.706595

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9fce5ed48cf9'
down_revision: Union[str, Sequence[str], None] = '8c2f9a7c9c01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    This revision is intentionally idempotent.
    It repairs environments where `alembic_version` was stamped to head but
    the underlying Postgres schema didn't receive the auth migration changes.
    """

    # --- users columns (auth verification / lockout / 2FA / phone plumbing) ---
    op.execute(sa.text('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_email_verified" boolean NOT NULL DEFAULT false'))
    op.execute(sa.text('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp NULL'))

    op.execute(sa.text('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failed_login_attempts" integer NOT NULL DEFAULT 0'))
    op.execute(sa.text('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locked_until" timestamp NULL'))

    op.execute(sa.text('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_2fa_enabled" boolean NOT NULL DEFAULT false'))
    op.execute(sa.text('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_secret_encrypted" text NULL'))
    op.execute(sa.text('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_2fa_verified_at" timestamp NULL'))

    op.execute(sa.text('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_number" text NULL'))
    op.execute(sa.text('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_phone_verified" boolean NOT NULL DEFAULT false'))
    op.execute(sa.text('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_verified_at" timestamp NULL'))

    # Indexes used by common lookups
    op.execute(sa.text('CREATE INDEX IF NOT EXISTS "ix_users_is_email_verified" ON "users" ("is_email_verified")'))
    op.execute(sa.text('CREATE INDEX IF NOT EXISTS "ix_users_is_2fa_enabled" ON "users" ("is_2fa_enabled")'))
    op.execute(sa.text('CREATE INDEX IF NOT EXISTS "ix_users_is_phone_verified" ON "users" ("is_phone_verified")'))
    op.execute(sa.text('CREATE INDEX IF NOT EXISTS "ix_users_phone_number" ON "users" ("phone_number")'))

    # OAuth identity uniqueness
    op.execute(sa.text('CREATE UNIQUE INDEX IF NOT EXISTS "uq_users_oauth_provider_id" ON "users" ("oauth_provider", "oauth_id")'))

    # --- token tables ---
    op.execute(
        sa.text(
            """
            CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
                "id" uuid PRIMARY KEY,
                "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "token_hash" varchar(64) NOT NULL,
                "expires_at" timestamp NOT NULL,
                "consumed_at" timestamp NULL,
                "created_at" timestamp NOT NULL DEFAULT now()
            )
            """
        )
    )
    op.execute(sa.text('CREATE INDEX IF NOT EXISTS "ix_email_verification_tokens_user_id" ON "email_verification_tokens" ("user_id")'))
    op.execute(sa.text('CREATE UNIQUE INDEX IF NOT EXISTS "ix_email_verification_tokens_token_hash" ON "email_verification_tokens" ("token_hash")'))

    op.execute(
        sa.text(
            """
            CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
                "id" uuid PRIMARY KEY,
                "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "token_hash" varchar(64) NOT NULL,
                "expires_at" timestamp NOT NULL,
                "used_at" timestamp NULL,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "request_ip" varchar(255) NULL,
                "user_agent" varchar(1000) NULL
            )
            """
        )
    )
    op.execute(sa.text('CREATE INDEX IF NOT EXISTS "ix_password_reset_tokens_user_id" ON "password_reset_tokens" ("user_id")'))
    op.execute(sa.text('CREATE UNIQUE INDEX IF NOT EXISTS "ix_password_reset_tokens_token_hash" ON "password_reset_tokens" ("token_hash")'))


def downgrade() -> None:
    """Downgrade schema."""

    # Drop token tables first
    op.execute(sa.text('DROP TABLE IF EXISTS "password_reset_tokens"'))
    op.execute(sa.text('DROP TABLE IF EXISTS "email_verification_tokens"'))

    # Drop indexes
    op.execute(sa.text('DROP INDEX IF EXISTS "uq_users_oauth_provider_id"'))
    op.execute(sa.text('DROP INDEX IF EXISTS "ix_users_phone_number"'))
    op.execute(sa.text('DROP INDEX IF EXISTS "ix_users_is_phone_verified"'))
    op.execute(sa.text('DROP INDEX IF EXISTS "ix_users_is_2fa_enabled"'))
    op.execute(sa.text('DROP INDEX IF EXISTS "ix_users_is_email_verified"'))

    # Drop columns
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
