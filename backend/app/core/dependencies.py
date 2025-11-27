"""Dependency injection helpers (DB session, auth, etc.)."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session
from app.database.database import engine
from app.auth.services import verify_token
from app.auth.repositories import get_user_by_email

security = HTTPBearer()


def get_db():
    """Yield a DB session for dependency injection."""
    with Session(engine) as session:
        yield session


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Get current user from JWT token."""
    token = credentials.credentials
    email = verify_token(token)
    if email is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = get_user_by_email(db, email)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

