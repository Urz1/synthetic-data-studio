"""Auth API routes (registration, login, OAuth)."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
from typing import Optional
from datetime import datetime, timedelta
import logging
import os

# Third-party
from fastapi import APIRouter, HTTPException, Depends, status, Query, Request, Response
from fastapi.responses import RedirectResponse
from sqlmodel import Session
from sqlmodel import select

# Local - Core
from app.core.dependencies import get_db, get_current_user
from app.core.config import settings

# Local - Services
from app.services.email import send_email

# Audit
from app.audit.repositories import create_audit_log
from app.audit.models import AuditLog
from app.audit.enums import AuditAction

# Local - Module
from .schemas import (
    UserCreate, UserResponse, UserLogin, Token, TokenPair, RefreshTokenRequest,
    OAuthProviderInfo, OAuthProvidersResponse, OAuthCallbackResponse,
    VerificationRequest, PasswordResetRequest, PasswordResetConfirm,
    TwoFactorSetupResponse, TwoFactorVerifyRequest,
    ProfileUpdate, PasswordChange, SessionCreate
)
from .repositories import create_user, get_user_by_email, verify_user_password, set_user_password
from .services import (
    create_access_token, revoke_token, create_refresh_token,
    rotate_refresh_token, revoke_all_user_refresh_tokens,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from .oauth import (
    get_oauth_provider, get_available_providers, GoogleOAuth, GitHubOAuth,
    generate_oauth_state, validate_oauth_state
)
from .models import User, EmailVerificationToken, PasswordResetToken
from .token_store import generate_raw_token, hash_token, expires_at_from_now, build_email_verification_link, build_password_reset_link
from .two_factor import generate_secret, encrypt_secret, decrypt_secret, build_otpauth_url, verify_code

# ============================================================================
# SETUP
# ============================================================================

router = APIRouter(prefix="/auth", tags=["Authentication"])

logger = logging.getLogger(__name__)
uvicorn_logger = logging.getLogger("uvicorn.error")

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
def register(user: UserCreate, request: Request, db: Session = Depends(get_db)):
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

    # In test mode, auto-verify to keep fixtures stable.
    if os.getenv("TESTING") == "1":
        new_user.is_email_verified = True
        new_user.email_verified_at = datetime.utcnow()
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    # Create verification token and email link.
    raw = generate_raw_token()
    token_hash = hash_token(raw)
    token_row = EmailVerificationToken(
        user_id=new_user.id,
        token_hash=token_hash,
        expires_at=expires_at_from_now(60 * 24),
    )
    db.add(token_row)
    db.commit()

    # Prefer explicit public base (prod), otherwise use current request host (local/dev).
    api_base = os.getenv("PUBLIC_API_BASE") or str(request.base_url).rstrip("/")
    link = build_email_verification_link(raw, api_base)
    email_sent = send_email(
        to_email=new_user.email,
        subject="Verify your Synth Studio email",
        text=f"Welcome to Synth Studio!\n\nVerify your email by visiting:\n{link}\n\nThis link expires in 24 hours.",
    )

    # If email cannot be sent, registration must fail to prevent orphaned accounts
    if not email_sent:
        # Rollback: delete the token and user so email can be used again
        db.delete(token_row)
        db.delete(new_user)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send verification email. Please try again later or contact support.",
        )

    # Explicit audit entry for registration
    try:
        create_audit_log(
            db,
            AuditLog(
                user_id=new_user.id,
                user_email=new_user.email,
                action=AuditAction.REGISTER.value,
                resource_type="auth",
                request_method="POST",
                request_path="/auth/register",
                status_code=201,
                timestamp=datetime.utcnow(),
            ),
        )
    except Exception:
        pass

    return new_user


@router.post(
    "/login",
    response_model=Token,
    summary="Login user",
    description="Authenticate user and return access token"
)
def login(user: UserLogin, request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Login with email and password.

    Returns a JWT access token for authenticated requests.
    """
    db_user = get_user_by_email(db, user.email)

    # Always keep the error generic.
    generic_error = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Incorrect email or password",
    )

    if not db_user or not db_user.hashed_password:
        raise generic_error

    # Check if account is deactivated
    if not db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Please contact support.",
        )

    now = datetime.utcnow()
    if db_user.locked_until and db_user.locked_until > now:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Account temporarily locked due to failed attempts. Please try again later.",
        )

    if not verify_user_password(db_user, user.password):
        db_user.failed_login_attempts = int(db_user.failed_login_attempts or 0) + 1
        if db_user.failed_login_attempts >= 5:
            db_user.locked_until = now + timedelta(minutes=15)
        db.add(db_user)
        db.commit()
        
        # Audit log for failed login (security monitoring)
        try:
            create_audit_log(
                db,
                AuditLog(
                    user_id=db_user.id,
                    user_email=db_user.email,
                    action=AuditAction.LOGIN_FAILED.value,
                    resource_type="auth",
                    request_method="POST",
                    request_path="/auth/login",
                    status_code=400,
                    ip_address=request.client.host if request.client else None,
                    user_agent=request.headers.get("user-agent"),
                    timestamp=now,
                    details={"attempt": db_user.failed_login_attempts, "locked": db_user.locked_until is not None},
                ),
            )
        except Exception:
            pass  # Don't fail login on audit error
        
        raise generic_error

    # Require email verification for password-based users.
    if not db_user.oauth_provider and not db_user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email before signing in.",
        )

    # If 2FA is enabled, require and verify OTP.
    if db_user.is_2fa_enabled:
        if not user.otp:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="OTP required",
            )
        secret = decrypt_secret(db_user.totp_secret_encrypted or "")
        if not secret or not verify_code(secret, user.otp):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid OTP",
            )
        db_user.last_2fa_verified_at = now

    # Success: reset lockout counters.
    db_user.failed_login_attempts = 0
    db_user.locked_until = None
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    access_token = create_access_token(data={"sub": db_user.email, "uid": str(db_user.id), "role": db_user.role})
    refresh_token = create_refresh_token(db=db, user_id=db_user.id, ip_address=request.client.host if request.client else None, user_agent=request.headers.get("user-agent"))

    # Explicit audit entry for successful login
    try:
        create_audit_log(
            db,
            AuditLog(
                user_id=db_user.id,
                user_email=db_user.email,
                action=AuditAction.LOGIN.value,
                resource_type="auth",
                request_method="POST",
                request_path="/auth/login",
                status_code=200,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
                timestamp=now,
            ),
        )
    except Exception:
        pass

    # Set cookies directly for a session
    is_production = not settings.debug
    response.set_cookie(
        key="ss_jwt",
        value=access_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    response.set_cookie(
        key="ss_refresh",
        value=refresh_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,  # 7 days
        path="/"
    )

    return {
        "ok": True, 
        "access_token": access_token, 
        "token": access_token, 
        "token_type": "bearer",
        # Include user data to avoid extra fetch after login
        "user": {
            "id": str(db_user.id),
            "email": db_user.email,
            "full_name": db_user.name or "",  # 'name' field in User model
            "role": db_user.role,
            "is_2fa_enabled": db_user.is_2fa_enabled,
        }
    }


@router.post(
    "/logout",
    summary="Logout user",
    description="Invalidate the current access token"
)
def logout(request: Request, current_user: User = Depends(get_current_user)):
    """
    Logout the current user by revoking their access token.
    
    The token is added to a blacklist and will be rejected on future requests.
    """
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    
    if token:
        revoke_token(token)
        logger.info(f"User {current_user.email} logged out")
    
    return {"ok": True, "message": "Successfully logged out"}


@router.post(
    "/refresh",
    response_model=TokenPair,
    summary="Refresh access token",
    description="Exchange a refresh token for a new access/refresh token pair"
)
def refresh_token(payload: RefreshTokenRequest, request: Request, db: Session = Depends(get_db)):
    """
    Exchange a valid refresh token for a new token pair.
    
    The old refresh token is invalidated (token rotation) and a new
    access/refresh pair is returned. This limits the window of opportunity
    for stolen refresh tokens.
    """
    result = rotate_refresh_token(
        db,
        payload.refresh_token,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    new_refresh_token, user_id = result
    
    # Get user to create access token
    from sqlmodel import select
    user = db.exec(select(User).where(User.id == user_id)).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    access_token = create_access_token(data={
        "sub": user.email,
        "uid": str(user.id),
        "role": user.role
    })
    
    # Set cookies if this is called via cookie flow
    # This supports both the legacy header flow and the new cookie flow
    return TokenPair(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post(
    "/refresh-session",
    summary="Refresh session cookies",
    description="Exchange refresh cookie for new access/refresh cookies"
)
def refresh_session(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Silent refresh endpoint using cookies.
    Reads 'ss_refresh' cookie and sets new 'ss_jwt' and 'ss_refresh' cookies.
    """
    old_refresh_token = request.cookies.get("ss_refresh")
    if not old_refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    result = rotate_refresh_token(
        db,
        old_refresh_token,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    if not result:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    new_refresh_token, user_id = result
    user = db.exec(select(User).where(User.id == user_id)).first()
    
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User inactive")
    
    access_token = create_access_token(data={"sub": user.email, "uid": str(user.id), "role": user.role})
    
    is_production = not settings.debug
    response.set_cookie(
        key="ss_jwt",
        value=access_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    response.set_cookie(
        key="ss_refresh",
        value=new_refresh_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return {"ok": True}


@router.post(
    "/logout-all",
    summary="Logout from all devices",
    description="Revoke all refresh tokens for the current user"
)
def logout_all(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Logout from all devices by revoking all refresh tokens.
    
    Also revokes the current access token.
    """
    # Revoke current access token
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    if token:
        revoke_token(token)
    
    # Revoke all refresh tokens
    count = revoke_all_user_refresh_tokens(db, current_user.id)
    
    logger.info(f"User {current_user.email} logged out from all devices ({count} refresh tokens revoked)")
    
    return {"ok": True, "message": f"Logged out from all devices. {count} sessions terminated."}


# ============================================================================
# GDPR ENDPOINTS
# ============================================================================

@router.delete(
    "/account",
    summary="Delete account (GDPR Right to Erasure)",
    description="Permanently delete the current user's account and associated data"
)
def delete_account(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete the current user's account (GDPR Article 17 - Right to Erasure).
    
    This will:
    - Revoke all refresh tokens
    - Anonymize the user record (soft delete)
    - Log the deletion for audit compliance
    
    Note: Some data may be retained for legal/compliance reasons.
    """
    now = datetime.utcnow()
    
    # Revoke all refresh tokens
    revoke_all_user_refresh_tokens(db, current_user.id)
    
    # Revoke current access token
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    if token:
        revoke_token(token)
    
    # Anonymize user data (soft delete)
    import hashlib
    anonymized_email = f"deleted_{hashlib.sha256(str(current_user.id).encode()).hexdigest()[:16]}@deleted.local"
    
    current_user.email = anonymized_email
    current_user.hashed_password = None
    current_user.name = None
    current_user.avatar_url = None
    current_user.phone_number = None
    current_user.oauth_provider = None
    current_user.oauth_id = None
    current_user.totp_secret_encrypted = None
    current_user.is_active = False
    current_user.updated_at = now
    
    db.add(current_user)
    db.commit()
    
    # Audit log for compliance
    try:
        create_audit_log(
            db,
            AuditLog(
                user_id=current_user.id,
                user_email=anonymized_email,
                action=AuditAction.ACCOUNT_DELETED.value,
                resource_type="user",
                request_method="DELETE",
                request_path="/auth/account",
                status_code=200,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
                timestamp=now,
            ),
        )
    except Exception:
        pass
    
    logger.info(f"Account deleted: user_id={current_user.id}")
    
    return {"ok": True, "message": "Account deleted successfully"}


@router.get(
    "/account/export",
    summary="Export account data (GDPR Right of Access)",
    description="Export all personal data associated with the current user"
)
def export_account_data(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export all personal data for the current user (GDPR Article 15 - Right of Access).
    
    Returns a JSON document containing all PII stored for this user.
    """
    now = datetime.utcnow()
    
    # Collect user data
    user_data = {
        "export_date": now.isoformat(),
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "name": current_user.name,
            "role": current_user.role,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
            "is_email_verified": current_user.is_email_verified,
            "email_verified_at": current_user.email_verified_at.isoformat() if current_user.email_verified_at else None,
            "phone_number": current_user.phone_number,
            "is_phone_verified": current_user.is_phone_verified,
            "oauth_provider": current_user.oauth_provider,
            "is_2fa_enabled": current_user.is_2fa_enabled,
            "avatar_url": current_user.avatar_url,
            "tos_accepted_at": current_user.tos_accepted_at.isoformat() if current_user.tos_accepted_at else None,
            "privacy_accepted_at": current_user.privacy_accepted_at.isoformat() if current_user.privacy_accepted_at else None,
        }
    }
    
    # Get refresh tokens (sessions) - basic info only
    from app.auth.models import RefreshToken
    tokens = db.exec(
        select(RefreshToken).where(RefreshToken.user_id == current_user.id)
    ).all()
    
    user_data["sessions"] = [
        {
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "expires_at": t.expires_at.isoformat() if t.expires_at else None,
            "revoked_at": t.revoked_at.isoformat() if t.revoked_at else None,
            "ip_address": t.ip_address,
        }
        for t in tokens
    ]
    
    # Audit log for compliance
    try:
        create_audit_log(
            db,
            AuditLog(
                user_id=current_user.id,
                user_email=current_user.email,
                action=AuditAction.DATA_EXPORTED.value,
                resource_type="user",
                request_method="GET",
                request_path="/auth/account/export",
                status_code=200,
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
                timestamp=now,
            ),
        )
    except Exception:
        pass
    
    logger.info(f"Data exported for user: {current_user.email}")
    
    return user_data


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update current user profile",
    description="Update the authenticated user's profile information"
)
def update_profile(
    payload: ProfileUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the current user's profile.
    
    Only the provided fields will be updated.
    """
    now = datetime.utcnow()
    
    if payload.full_name is not None:
        current_user.name = payload.full_name
    
    # Note: 'bio' is not currently in User model, but we accept it for future extension
    
    current_user.updated_at = now
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    logger.info(f"Profile updated for user: {current_user.email}")
    
    return current_user


@router.post(
    "/change-password",
    summary="Change password",
    description="Change the current user's password"
)
def change_password(
    payload: PasswordChange,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change the current user's password.
    
    Requires the current password for verification.
    """
    # Verify current password
    if not current_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change password for OAuth accounts"
        )
    
    if not verify_user_password(current_user, payload.current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Ensure new password is different
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Update password
    set_user_password(current_user, payload.new_password)
    current_user.updated_at = datetime.utcnow()
    db.add(current_user)
    db.commit()
    
    logger.info(f"Password changed for user: {current_user.email}")
    
    return {"ok": True, "message": "Password changed successfully"}


@router.post(
    "/verify/request",
    summary="Request email verification",
    description="Send (or re-send) an email verification link.",
)
def request_email_verification(payload: VerificationRequest, request: Request, db: Session = Depends(get_db)):
    # Always respond ok to avoid email enumeration.
    user = get_user_by_email(db, payload.email)
    if not user or user.is_email_verified:
        return {"ok": True}

    raw = generate_raw_token()
    token_row = EmailVerificationToken(
        user_id=user.id,
        token_hash=hash_token(raw),
        expires_at=expires_at_from_now(60 * 24),
    )
    db.add(token_row)
    db.commit()

    base = os.getenv("PUBLIC_API_BASE") or str(request.base_url).rstrip("/")
    link = build_email_verification_link(raw, base)
    send_email(
        to_email=user.email,
        subject="Verify your Synth Studio email",
        text=f"Verify your email by visiting:\n{link}\n\nThis link expires in 24 hours.",
    )
    return {"ok": True}


@router.get(
    "/verify",
    summary="Verify email",
    description="Verify an email using a token from the verification email.",
)
def verify_email(token: str = Query(..., min_length=10), db: Session = Depends(get_db)):
    token_hash = hash_token(token)
    row = db.exec(select(EmailVerificationToken).where(EmailVerificationToken.token_hash == token_hash)).first()
    if not row:
        return RedirectResponse(url=f"{settings.frontend_url}/login?error=invalid_verification", status_code=303)

    now = datetime.utcnow()
    if row.consumed_at or row.expires_at <= now:
        return RedirectResponse(url=f"{settings.frontend_url}/login?error=expired_verification", status_code=303)

    user = db.get(User, row.user_id)
    if not user:
        return RedirectResponse(url=f"{settings.frontend_url}/login?error=invalid_verification", status_code=303)

    user.is_email_verified = True
    user.email_verified_at = now
    user.updated_at = now
    row.consumed_at = now
    db.add(user)
    db.add(row)
    db.commit()

    return RedirectResponse(url=f"{settings.frontend_url}/login?verified=1", status_code=303)


@router.post(
    "/password-reset/request",
    summary="Request password reset",
    description="Send a password reset link if the email exists.",
)
def request_password_reset(payload: PasswordResetRequest, request: Request, db: Session = Depends(get_db)):
    # Always respond ok to avoid email enumeration.
    user = get_user_by_email(db, payload.email)
    if not user:
        return {"ok": True}
    
    # Allow OAuth users without password to set one via this flow

    raw = generate_raw_token()
    row = PasswordResetToken(
        user_id=user.id,
        token_hash=hash_token(raw),
        expires_at=expires_at_from_now(60),  # 60 minutes
        request_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(row)
    db.commit()

    link = build_password_reset_link(raw)
    sent = send_email(
        to_email=user.email,
        subject="Reset your Synth Studio password",
        text=f"Reset your password using this link:\n{link}\n\nThis link expires in 60 minutes.",
    )
    
    # If email failed, delete the token so user can retry
    if not sent:
        db.delete(row)
        db.commit()
    
    logger.info(
        "Password reset email attempted email=%s sent=%s ip=%s",
        user.email,
        sent,
        request.client.host if request.client else None,
    )
    uvicorn_logger.warning(
        "Password reset email attempted email=%s sent=%s ip=%s",
        user.email,
        sent,
        request.client.host if request.client else None,
    )
    # Always return ok to prevent email enumeration
    return {"ok": True}


@router.post(
    "/password-reset/confirm",
    summary="Confirm password reset",
    description="Reset password using a valid, unexpired token.",
)
def confirm_password_reset(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    token_hash = hash_token(payload.token)
    row = db.exec(select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)).first()
    if not row:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    now = datetime.utcnow()
    if row.used_at or row.expires_at <= now:
        raise HTTPException(status_code=400, detail="Expired reset token")

    user = db.get(User, row.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    set_user_password(user, payload.new_password)
    user.updated_at = now
    user.failed_login_attempts = 0
    user.locked_until = None
    row.used_at = now
    db.add(user)
    db.add(row)
    db.commit()

    return {"ok": True}


@router.post(
    "/2fa/setup",
    response_model=TwoFactorSetupResponse,
    summary="Start 2FA setup",
    description="Generate a TOTP secret and return an otpauth:// URL.",
)
def two_factor_setup(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    # Generate and store secret (not enabled until verified)
    secret = generate_secret()
    current_user.totp_secret_encrypted = encrypt_secret(secret)
    current_user.is_2fa_enabled = False
    current_user.updated_at = datetime.utcnow()
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return TwoFactorSetupResponse(secret=secret, otpauth_url=build_otpauth_url(current_user.email, secret))


@router.post(
    "/2fa/enable",
    summary="Enable 2FA",
    description="Verify a TOTP code and enable 2FA for the current user.",
)
def two_factor_enable(payload: TwoFactorVerifyRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    secret = decrypt_secret(current_user.totp_secret_encrypted or "")
    if not secret:
        raise HTTPException(status_code=400, detail="2FA not initialized")
    if not verify_code(secret, payload.code):
        raise HTTPException(status_code=400, detail="Invalid code")

    now = datetime.utcnow()
    current_user.is_2fa_enabled = True
    current_user.last_2fa_verified_at = now
    current_user.updated_at = now
    db.add(current_user)
    db.commit()
    return {"ok": True}


@router.post(
    "/2fa/disable",
    summary="Disable 2FA",
    description="Verify a TOTP code and disable 2FA for the current user.",
)
def two_factor_disable(payload: TwoFactorVerifyRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    secret = decrypt_secret(current_user.totp_secret_encrypted or "")
    if not secret or not verify_code(secret, payload.code):
        raise HTTPException(status_code=400, detail="Invalid code")

    now = datetime.utcnow()
    current_user.is_2fa_enabled = False
    current_user.totp_secret_encrypted = None
    current_user.last_2fa_verified_at = None
    current_user.updated_at = now
    db.add(current_user)
    db.commit()
    return {"ok": True}


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


@router.post(
    "/logout",
    summary="Logout user",
    description="Clear all session cookies and redirect to login"
)
def logout(response: Response):
    """
    Logout user by clearing all cookies.
    
    Security measures:
    - Delete all auth cookies (ss_access, ss_refresh, ss_jwt)
    - Set Cache-Control to prevent back-button showing dashboard
    - Redirect to /login
    """
    is_production = settings.debug is False
    
    # Delete all auth cookies with explicit path and same domain settings as when they were set
    # Compute domain for cross-subdomain cookie clearing
    is_production = not settings.debug
    cookie_domain = settings.cookie_domain if is_production else None
    
    response.delete_cookie("ss_access", path="/", domain=cookie_domain)
    response.delete_cookie("ss_refresh", path="/", domain=cookie_domain)
    response.delete_cookie("ss_jwt", path="/", domain=cookie_domain)
    
    # Force immediate expiration of cookies as an extra measure
    response.set_cookie("ss_access", "", max_age=0, path="/", domain=cookie_domain)
    response.set_cookie("ss_refresh", "", max_age=0, path="/", domain=cookie_domain)
    response.set_cookie("ss_jwt", "", max_age=0, path="/", domain=cookie_domain)
    
    # Cache headers to prevent back-button showing cached dashboard
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    
    logger.info("User logged out, cookies cleared")
    return {"ok": True, "redirect": "/login"}


# ============================================================================
# OAUTH ENDPOINTS
# ============================================================================

@router.get(
    "/providers",
    response_model=OAuthProvidersResponse,
    summary="List OAuth providers",
    description="Get list of available OAuth authentication providers"
)
def list_oauth_providers():
    """
    List available OAuth providers.
    
    Returns which providers are configured and enabled.
    """
    available = get_available_providers()
    providers = []
    
    for name, enabled in available.items():
        providers.append(OAuthProviderInfo(
            name=name,
            enabled=enabled,
            auth_url=f"/auth/{name}" if enabled else None
        ))
    
    return OAuthProvidersResponse(providers=providers)


# --- Google OAuth ---

@router.get(
    "/google",
    summary="Initiate Google OAuth",
    description="Redirect to Google for authentication"
)
def google_login():
    """
    Initiate Google OAuth flow.
    
    Redirects user to Google's consent screen.
    After authentication, Google redirects to /auth/google/callback.
    """
    provider = GoogleOAuth()
    if not provider.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
        )
    
    # Generate state token for CSRF protection
    state = generate_oauth_state()
    
    auth_url = provider.get_authorization_url(state)
    return RedirectResponse(url=auth_url)


@router.get(
    "/google/callback",
    summary="Google OAuth callback",
    description="Handle Google OAuth callback and create/login user"
)
async def google_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: Optional[str] = Query(None, description="State token for CSRF validation"),
    error: Optional[str] = Query(None, description="Error from Google"),
    db: Session = Depends(get_db)
):
    """
    Handle Google OAuth callback.
    
    Exchanges authorization code for access token,
    fetches user info, and creates/updates user account.
    
    Returns JWT token for API authentication.
    """
    logger.info(f"OAuth Google callback received: state={state[:20] if state else 'None'}..., code_len={len(code) if code else 0}")
    
    if error:
        logger.error(f"OAuth Google error from Google: {error}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google OAuth error: {error}"
        )
    
    # Validate state token (CSRF protection)
    if not state or not validate_oauth_state(state):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OAuth state. Please try again."
        )
    
    provider = GoogleOAuth()
    
    try:
        # Exchange code for token
        token_data = await provider.get_access_token(code)
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get access token from Google"
            )
        
        # Get user info from Google
        user_info = await provider.get_user_info(access_token)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to authenticate with Google: {str(e)}"
        )

    if not user_info.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not provided by Google. Please grant email permission."
        )

    # Find or create user
    user, is_new = await _find_or_create_oauth_user(db, user_info)
    logger.debug(f"OAuth Google: user_id={user.id}, is_new={is_new}")

    # Generate access token (JWT) - 15 min expiry
    jwt_token = create_access_token(data={
        "sub": user.email,
        "uid": str(user.id),
        "role": user.role
    })
    
    # Generate refresh token and store in database
    refresh_token = create_refresh_token(
        db=db,
        user_id=user.id,
        ip_address=None,
        user_agent=None
    )

    # SET COOKIES AND REDIRECT DIRECTLY TO DASHBOARD
    # This eliminates the need for /auth/success and hash fragments
    is_production = not settings.debug
    
    response = RedirectResponse(url=f"{settings.frontend_url}/dashboard", status_code=302)
    
    response.set_cookie(
        key="ss_jwt",
        value=jwt_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        domain=settings.cookie_domain if is_production else None
    )
    response.set_cookie(
        key="ss_refresh",
        value=refresh_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/",
        domain=settings.cookie_domain if is_production else None
    )
    
    # User data prefetch cookie - not httpOnly so frontend can read it
    # This allows instant dashboard load without /me API call
    import json
    import urllib.parse
    user_prefetch = json.dumps({
        "id": str(user.id),
        "email": user.email,
        "full_name": user.name or "",  # 'name' field in User model
        "role": user.role,
        "is_2fa_enabled": user.is_2fa_enabled,
    })
    response.set_cookie(
        key="ss_user_prefetch",
        value=urllib.parse.quote(user_prefetch),
        httponly=False,  # Frontend can read this
        secure=is_production,
        samesite="lax",
        max_age=60,  # Short-lived: 1 minute
        path="/",
        domain=settings.cookie_domain if is_production else None
    )
    
    logger.info(f"OAuth Google login successful: {user.email}, redirecting to /dashboard")
    return response


# --- GitHub OAuth ---

@router.get(
    "/github",
    summary="Initiate GitHub OAuth",
    description="Redirect to GitHub for authentication"
)
def github_login():
    """
    Initiate GitHub OAuth flow.
    
    Redirects user to GitHub's authorization page.
    After authentication, GitHub redirects to /auth/github/callback.
    """
    provider = GitHubOAuth()
    if not provider.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET."
        )
    
    # Generate state token for CSRF protection
    state = generate_oauth_state()
    
    auth_url = provider.get_authorization_url(state)
    return RedirectResponse(url=auth_url)


@router.get(
    "/github/callback",
    summary="GitHub OAuth callback",
    description="Handle GitHub OAuth callback and create/login user"
)
async def github_callback(
    code: str = Query(..., description="Authorization code from GitHub"),
    state: Optional[str] = Query(None, description="State token for CSRF validation"),
    error: Optional[str] = Query(None, description="Error from GitHub"),
    error_description: Optional[str] = Query(None, description="Error description"),
    db: Session = Depends(get_db)
):
    """
    Handle GitHub OAuth callback.
    
    Exchanges authorization code for access token,
    fetches user info, and creates/updates user account.
    
    Returns JWT token for API authentication.
    """
    if error:
        detail = f"GitHub OAuth error: {error}"
        if error_description:
            detail += f" - {error_description}"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )
    
    # Validate state token (CSRF protection)
    if not state or not validate_oauth_state(state):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OAuth state. Please try again."
        )
    
    provider = GitHubOAuth()
    
    try:
        # Exchange code for token
        token_data = await provider.get_access_token(code)
        access_token = token_data.get("access_token")
        
        if not access_token:
            error_msg = token_data.get("error_description", "Unknown error")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to get access token from GitHub: {error_msg}"
            )
        
        # Get user info from GitHub
        user_info = await provider.get_user_info(access_token)
        
        if not user_info.get("email"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not retrieve email from GitHub. Please make sure your email is public or grant email permission."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to authenticate with GitHub: {str(e)}"
        )
    
    # Find or create user
    user, is_new = await _find_or_create_oauth_user(db, user_info)
    
    # Generate access token (JWT) - 15 min expiry
    jwt_token = create_access_token(data={
        "sub": user.email,
        "uid": str(user.id),
        "role": user.role
    })
    
    # Generate refresh token and store in database
    refresh_token = create_refresh_token(
        db=db,
        user_id=user.id,
        ip_address=None,
        user_agent=None
    )
    
    # SET COOKIES AND REDIRECT DIRECTLY TO DASHBOARD
    is_production = not settings.debug
    response = RedirectResponse(url=f"{settings.frontend_url}/dashboard", status_code=302)
    
    response.set_cookie(
        key="ss_jwt",
        value=jwt_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
        domain=settings.cookie_domain if is_production else None
    )
    response.set_cookie(
        key="ss_refresh",
        value=refresh_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/",
        domain=settings.cookie_domain if is_production else None
    )
    
    # User data prefetch cookie - not httpOnly so frontend can read it
    # This allows instant dashboard load without /me API call
    import json
    import urllib.parse
    user_prefetch = json.dumps({
        "id": str(user.id),
        "email": user.email,
        "full_name": user.name or "",  # 'name' field in User model
        "role": user.role,
        "is_2fa_enabled": user.is_2fa_enabled,
    })
    response.set_cookie(
        key="ss_user_prefetch",
        value=urllib.parse.quote(user_prefetch),
        httponly=False,  # Frontend can read this
        secure=is_production,
        samesite="lax",
        max_age=60,  # Short-lived: 1 minute
        path="/",
        domain=settings.cookie_domain if is_production else None
    )
    
    logger.info(f"OAuth GitHub login successful: {user.email}, redirecting to /dashboard")
    return response


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def _find_or_create_oauth_user(db: Session, user_info: dict) -> tuple[User, bool]:
    """
    Find existing user or create new one from OAuth info.
    
    Args:
        db: Database session
        user_info: User info from OAuth provider
        
    Returns:
        Tuple of (User, is_new_user)
    """
    email = user_info["email"]
    provider = user_info["provider"]
    provider_id = user_info["provider_id"]
    
    # First, try to find by OAuth provider + ID
    from sqlmodel import select
    statement = select(User).where(
        User.oauth_provider == provider,
        User.oauth_id == provider_id
    )
    user = db.exec(statement).first()
    
    if user:
        # Update user info from OAuth (name, avatar might change)
        user.name = user_info.get("name") or user.name
        user.avatar_url = user_info.get("avatar_url") or user.avatar_url
        if user_info.get("email_verified"):
            user.is_email_verified = True
            user.email_verified_at = user.email_verified_at or datetime.utcnow()
        db.add(user)
        db.commit()
        db.refresh(user)
        return user, False
    
    # Try to find by email (user might have registered with password first)
    user = get_user_by_email(db, email)
    
    if user:
        # Link OAuth to existing account
        user.oauth_provider = provider
        user.oauth_id = provider_id
        user.name = user_info.get("name") or user.name
        user.avatar_url = user_info.get("avatar_url") or user.avatar_url
        if user_info.get("email_verified"):
            user.is_email_verified = True
            user.email_verified_at = user.email_verified_at or datetime.utcnow()
        db.add(user)
        db.commit()
        db.refresh(user)
        return user, False
    
    # Create new user
    new_user = User(
        email=email,
        oauth_provider=provider,
        oauth_id=provider_id,
        name=user_info.get("name"),
        avatar_url=user_info.get("avatar_url"),
        hashed_password=None,  # OAuth users don't have passwords
        is_active=True,
        role="user",
        is_email_verified=bool(user_info.get("email_verified")),
        email_verified_at=datetime.utcnow() if user_info.get("email_verified") else None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user, True
