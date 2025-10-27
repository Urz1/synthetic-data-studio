"""Auth API routes (registration, login, etc.)."""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session
from app.core.dependencies import get_db
from .models import UserCreate, UserResponse
from .crud import create_user, get_user_by_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/ping", summary="Health check for auth module")
def ping():
    """Simple health check endpoint for authentication module."""
    return {"msg": "auth ok"}


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account with email and password"
)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    
    - **email**: valid email address (must be unique)
    - **password**: user password (will be hashed before storage)
    
    Returns the created user information (without password).
    """
    # Check if user already exists
    db_user = get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = create_user(db, user)
    return new_user
