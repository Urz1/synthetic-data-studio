"""Minimal SMTP email sender.

If SMTP isn't configured, we log the message and return False.
This keeps dev/test environments functional while allowing production to enable real email.
"""

from __future__ import annotations

import logging
import os
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)
uvicorn_logger = logging.getLogger("uvicorn.error")


def _get_env(name: str, default: str = "") -> str:
    """Read env vars defensively.

    Some env parsers treat `KEY =value` as an environment variable whose *name* is
    `KEY ` (note the trailing space). In that case `os.getenv("KEY")` returns an
    empty string even though the value exists.
    """

    value = os.getenv(name)
    if value is None:
        # Fallback: tolerate whitespace in env var names
        for env_key, env_value in os.environ.items():
            if env_key.strip() == name:
                value = env_value
                break

    if value is None:
        return default

    return value


def send_email(to_email: str, subject: str, text: str) -> bool:
    host = _get_env("SMTP_HOST")
    port_raw = _get_env("SMTP_PORT", "587")
    user = _get_env("SMTP_USER")
    password = _get_env("SMTP_PASSWORD")
    from_email = _get_env("SMTP_FROM") or user
    use_tls = _get_env("SMTP_TLS", "true").lower() == "true"

    # ADD THESE DEBUG LINES:
    print(f"DEBUG: SMTP_USER = '{user}'")
    print(f"DEBUG: SMTP_PASSWORD length = {len(password) if password else 0}")
    print(f"DEBUG: SMTP_PASSWORD first 3 chars = '{password[:3] if password else 'None'}'")
    print(f"DEBUG: All env vars: {dict(os.environ)}")  # Be careful with this in production
    try:
        port = int((port_raw or "587").strip())
    except ValueError:
        logger.warning("Invalid SMTP_PORT=%r; falling back to 587", port_raw)
        port = 587

    if not host or not from_email:
        missing = []
        if not host:
            missing.append("SMTP_HOST")
        if not from_email:
            missing.append("SMTP_FROM (or SMTP_USER)")
        logger.warning(
            "SMTP not configured (missing: %s); would have sent email to=%s subject=%s\n%s",
            ", ".join(missing) if missing else "unknown",
            to_email,
            subject,
            text,
        )
        uvicorn_logger.warning(
            "SMTP not configured (missing: %s); would have sent email to=%s subject=%s",
            ", ".join(missing) if missing else "unknown",
            to_email,
            subject,
        )
        return False

    msg = EmailMessage()
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(text)

    try:
        uvicorn_logger.warning(
            "SMTP send attempt host=%s port=%s tls=%s to=%s",
            host,
            port,
            use_tls,
            to_email,
        )
        with smtplib.SMTP(host, port, timeout=10) as server:
            server.ehlo()
            if use_tls:
                server.starttls()
                server.ehlo()
            if user and password:
                server.login(user, password)
            elif user and not password:
                logger.warning(
                    "SMTP_USER is set but SMTP_PASSWORD is missing; email delivery will likely fail. "
                    "Check env formatting (no spaces around '=') and deployment secrets."
                )
                uvicorn_logger.warning(
                    "SMTP_USER is set but SMTP_PASSWORD is missing; email delivery will likely fail"
                )
            server.send_message(msg)
        logger.info("Email sent to=%s subject=%s", to_email, subject)
        uvicorn_logger.warning("Email sent to=%s subject=%s", to_email, subject)
        return True
    except Exception:
        logger.exception("Failed to send email")
        uvicorn_logger.exception("Failed to send email")
        return False
