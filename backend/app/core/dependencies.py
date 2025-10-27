"""Dependency injection helpers (DB session, auth, etc.)."""

from sqlmodel import Session
from app.database.database import engine


def get_db():
    """Yield a DB session for dependency injection."""
    with Session(engine) as session:
        yield session

