"""TOTP-based 2FA helpers (optional).

Stores the TOTP secret encrypted at rest.
"""

from __future__ import annotations

import base64
import hashlib
from typing import Optional

import pyotp
from cryptography.fernet import Fernet

from app.core.config import settings


def _fernet() -> Fernet:
    # Derive a stable Fernet key from SECRET_KEY.
    digest = hashlib.sha256(settings.secret_key.encode("utf-8")).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_secret(secret: str) -> str:
    return _fernet().encrypt(secret.encode("utf-8")).decode("utf-8")


def decrypt_secret(token: str) -> Optional[str]:
    try:
        return _fernet().decrypt(token.encode("utf-8")).decode("utf-8")
    except Exception:
        return None


def generate_secret() -> str:
    return pyotp.random_base32()


def build_otpauth_url(email: str, secret: str, issuer: str = "Synth Studio") -> str:
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name=issuer)


def verify_code(secret: str, code: str) -> bool:
    totp = pyotp.TOTP(secret)
    # allow +/- 1 step to reduce clock skew pain
    return bool(totp.verify(code, valid_window=1))
