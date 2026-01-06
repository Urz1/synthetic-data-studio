"""Dependency injection helpers (DB session, auth, etc.)."""

# Standard library
import os
import uuid
from typing import Optional

# Third-party
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session

# Internal
from app.auth.repositories import get_user_by_email, get_user_by_id
from app.auth.services import verify_token
from app.database.database import engine

security = HTTPBearer(auto_error=False)

# Secret for validating proxy requests from Next.js frontend
PROXY_SECRET = os.getenv("PROXY_SECRET", "internal-proxy")


def get_db():
    """Yield a DB session for dependency injection."""
    with Session(engine) as session:
        yield session


def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Get current user from JWT token OR from trusted proxy headers.
    
    This supports two authentication methods:
    1. Standard JWT Bearer token in Authorization header
    2. Trusted proxy headers (X-User-Id, X-User-Email) from Next.js frontend
    
    The proxy method is used when Better Auth handles authentication on the
    frontend and passes user info via headers.
    """
    # Method 1: Check for proxy headers (from Next.js frontend)
    proxy_secret = request.headers.get("X-Proxy-Secret")
    user_id = request.headers.get("X-User-Id")
    user_email = request.headers.get("X-User-Email")
    
    if proxy_secret == PROXY_SECRET and user_id:
        # Trusted proxy request - look up user by ID
        try:
            user_uuid = uuid.UUID(user_id)
            user = get_user_by_id(db, user_uuid)
            if user:
                return user
        except (ValueError, TypeError):
            pass
        
        # Fallback: try by email if ID lookup failed
        if user_email:
            user = get_user_by_email(db, user_email)
            if user:
                return user
            
            # User exists in Better Auth but not in FastAPI users table
            # Auto-create the user record for seamless sync
            from app.auth.models import User
            user_name = request.headers.get("X-User-Name", "")
            new_user = User(
                id=uuid.UUID(user_id) if user_id else uuid.uuid4(),
                email=user_email,
                name=user_name or user_email.split("@")[0],
                hashed_password=None,  # OAuth/Better Auth user - no local password
                is_email_verified=True,  # Already verified via Better Auth
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            return new_user
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Method 2: Standard JWT Bearer token
    if credentials:
        token = credentials.credentials
        email = verify_token(token)
        if email:
            user = get_user_by_email(db, email)
            if user:
                return user
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
    
    # No valid authentication provided
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required"
    )


def get_admin_user(current_user = Depends(get_current_user)):
    """Get current user and verify they have admin role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
