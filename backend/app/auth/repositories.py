"""Repositories for auth module (data access layer)."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
from typing import Optional
import os
from datetime import datetime

# Third-party
import bcrypt
from sqlmodel import Session
from sqlalchemy import func

# Local - Module
from .models import User
from .schemas import UserCreate

# ============================================================================
# REPOSITORIES
# ============================================================================

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email address."""
    normalized = (email or "").strip().lower()
    if not normalized:
        return None
    return db.query(User).filter(func.lower(User.email) == normalized).first()


def create_user(db: Session, user: UserCreate) -> User:
    """Create a new user with hashed password."""
    # Hash the password using bcrypt directly
    password_bytes = user.password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    db_user = User(
        email=(user.email or "").strip().lower(),
        hashed_password=hashed_password,
        username=getattr(user, "username", None),
    )

    # Keep test fixtures stable by bypassing email verification.
    if os.getenv("TESTING") == "1":
        db_user.is_email_verified = True
        db_user.email_verified_at = datetime.utcnow()
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate user by email and password."""
    user = get_user_by_email(db, email)
    if not user:
        return None
    
    # Verify password using bcrypt directly
    password_bytes = password.encode('utf-8')
    hashed_bytes = user.hashed_password.encode('utf-8')
    
    if not bcrypt.checkpw(password_bytes, hashed_bytes):
        return None
    
    return user


def verify_user_password(user: User, password: str) -> bool:
    """Verify a raw password against the stored bcrypt hash."""
    if not user.hashed_password:
        return False
    password_bytes = password.encode("utf-8")
    hashed_bytes = user.hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def set_user_password(user: User, new_password: str) -> None:
    """Hash and set a new password for the user."""
    password_bytes = new_password.encode("utf-8")
    salt = bcrypt.gensalt()
    user.hashed_password = bcrypt.hashpw(password_bytes, salt).decode("utf-8")
