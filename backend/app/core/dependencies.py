"""Dependency injection helpers (DB session, auth, etc.)."""

import os
import uuid
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session
from app.database.database import engine
from app.auth.services import verify_token
from app.auth.repositories import get_user_by_email, get_user_by_id

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
