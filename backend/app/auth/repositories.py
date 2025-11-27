"""Repositories for auth module (data access layer)."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
from typing import Optional

# Third-party
import bcrypt
from sqlmodel import Session

# Local - Module
from .models import User
from .schemas import UserCreate

# ============================================================================
# REPOSITORIES
# ============================================================================

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email address."""
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user: UserCreate) -> User:
    """Create a new user with hashed password."""
    # Hash the password using bcrypt directly
    password_bytes = user.password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    db_user = User(
        email=user.email,
        hashed_password=hashed_password
    )
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
