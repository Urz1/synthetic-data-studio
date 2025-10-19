"""Dependency injection helpers (DB session, auth, etc.)."""

def get_db():
    """Yield a DB session. Replace with real DB session in production."""
    yield None

