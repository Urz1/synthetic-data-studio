"""Dependency injection helpers (DB session, auth, etc.).

Authentication flow:
1. User authenticates via better-auth on the frontend
2. Next.js proxy sends user info via trusted headers
3. get_current_user validates headers and syncs user to local DB
"""

# Standard library
import os
import uuid
from typing import Optional

# Third-party
from fastapi import Depends, HTTPException, Request, status
from sqlmodel import Session, select

# Internal
from app.database.database import engine

# Secret for validating proxy requests from Next.js frontend
PROXY_SECRET = os.getenv("PROXY_SECRET", "internal-proxy")


def get_db():
    """Yield a DB session for dependency injection."""
    with Session(engine) as session:
        yield session


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get current user from trusted proxy headers.
    
    better-auth handles all authentication on the frontend.
    The Next.js proxy forwards user info via trusted headers.
    
    Headers expected:
    - X-Proxy-Secret: Shared secret to verify request is from our proxy
    - X-User-Id: User UUID from better-auth session
    - X-User-Email: User email from better-auth session
    - X-User-Name: User name (optional)
    
    If the user doesn't exist in our local DB, they are auto-created
    (synced from better-auth).
    """
    from app.auth.models import User
    
    # Validate proxy secret
    proxy_secret = request.headers.get("X-Proxy-Secret")
    user_id = request.headers.get("X-User-Id")
    user_email = request.headers.get("X-User-Email")
    
    if proxy_secret != PROXY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    if not user_id or not user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    try:
        user_uuid = uuid.UUID(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID"
        )
    
    # Try to find user by ID
    user = db.exec(select(User).where(User.id == user_uuid)).first()
    
    if user:
        return user
    
    # Try to find user by email (ID might differ)
    user = db.exec(select(User).where(User.email == user_email)).first()
    
    if user:
        return user
    
    # User doesn't exist - auto-create from better-auth session
    user_name = request.headers.get("X-User-Name", "")
    new_user = User(
        id=user_uuid,
        email=user_email,
        name=user_name or user_email.split("@")[0],
        hashed_password=None,  # OAuth/Better Auth user - no local password
        is_email_verified=True,  # Already verified via Better Auth
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def get_admin_user(current_user = Depends(get_current_user)):
    """Get current user and verify they have admin role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# Alias for backward compatibility
BetterAuthUser = "User"  # Placeholder type hint
