"""General utilities used across the application."""

from datetime import datetime


def now_iso():
    return datetime.utcnow().isoformat() + "Z"

