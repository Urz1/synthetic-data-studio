"""Token helpers for email verification and password reset.

We store only hashed tokens server-side (never the raw token).
"""

from __future__ import annotations

# Standard library
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from typing import Tuple

# Internal
from app.core.config import settings


def generate_raw_token(nbytes: int = 32) -> str:
    return secrets.token_urlsafe(nbytes)


def hash_token(raw_token: str) -> str:
    # Pepper with SECRET_KEY so DB leaks don't become usable links.
    material = (raw_token + settings.secret_key).encode("utf-8")
    return hashlib.sha256(material).hexdigest()


def token_matches(raw_token: str, token_hash: str) -> bool:
    return hmac.compare_digest(hash_token(raw_token), token_hash)


def expires_at_from_now(minutes: int) -> datetime:
    return datetime.utcnow() + timedelta(minutes=minutes)


def build_email_verification_link(raw_token: str, request_base_url: str) -> str:
    # Keep verification handled by backend (and then redirect to frontend),
    # so we don't need a dedicated frontend verification page.
    return f"{request_base_url.rstrip('/')}/auth/verify?token={raw_token}"


def build_password_reset_link(raw_token: str) -> str:
    # Frontend will host the reset UI.
    return f"{settings.frontend_url.rstrip('/')}/reset-password?token={raw_token}"
