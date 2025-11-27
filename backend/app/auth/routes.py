"""Auth API routes (registration, login, etc.)."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
# (No standard library imports needed directly here)

# Third-party
from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session

# Local - Core
from app.core.dependencies import get_db, get_current_user

# Local - Module
from .schemas import UserCreate, UserResponse, UserLogin, Token
from .repositories import create_user, get_user_by_email, authenticate_user
from .services import create_access_token

# ============================================================================
# SETUP
# ============================================================================

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ============================================================================
# ENDPOINTS
# ============================================================================

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


@router.post(
    "/login",
    response_model=Token,
    summary="Login user",
    description="Authenticate user and return access token"
)
def login(user: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email and password.

    Returns a JWT access token for authenticated requests.
    """
    db_user = authenticate_user(db, user.email, user.password)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get the currently authenticated user's information"
)
def get_current_user_info(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Get current authenticated user.
    
    Requires valid JWT token in Authorization header.
    
    Returns the user information (without password).
    """
    return current_user
