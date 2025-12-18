"""Auth services: token generation and validation."""

# Standard library
import os
import uuid
import secrets
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple

# Third-party
from jose import JWTError, jwt
from sqlmodel import Session, select

# Local - Core
from app.core.config import settings
from app.core.redis_utils import set_with_expiry, exists as redis_exists


logger = logging.getLogger(__name__)

SECRET_KEY = settings.secret_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Key prefix for blacklisted tokens in Redis
BLACKLIST_PREFIX = "token_blacklist:"


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token with standard claims.
    
    Args:
        data: Payload data (must include 'sub' for subject)
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    now = datetime.utcnow()
    
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Add standard JWT claims
    to_encode.update({
        "exp": expire,           # Expiration time
        "iat": now,              # Issued at
        "jti": str(uuid.uuid4()), # JWT ID (for revocation)
        "iss": "synth-studio",   # Issuer
        "type": "access",        # Token type
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def is_token_blacklisted(jti: str) -> bool:
    """
    Check if a token JTI is blacklisted.
    
    Uses Redis if available, falls back to in-memory.
    """
    return redis_exists(f"{BLACKLIST_PREFIX}{jti}")


def verify_token(token: str) -> Optional[str]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Subject (email) if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Check if token is blacklisted
        jti = payload.get("jti")
        if jti and is_token_blacklisted(jti):
            return None
        
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except JWTError:
        return None


def revoke_token(token: str) -> bool:
    """
    Revoke a JWT token by adding its JTI to the blacklist.
    
    Uses Redis if available (persists across restarts), 
    falls back to in-memory for development.
    
    Args:
        token: JWT token to revoke
        
    Returns:
        True if revoked successfully, False otherwise
    """
    try:
        # Decode without verification to get JTI and expiry (token may be expired)
        payload = jwt.decode(
            token, SECRET_KEY, algorithms=[ALGORITHM],
            options={"verify_exp": False}
        )
        jti = payload.get("jti")
        exp = payload.get("exp")
        
        if jti:
            # Calculate remaining TTL (don't store longer than token would've been valid)
            if exp:
                remaining_seconds = max(int(exp - datetime.utcnow().timestamp()), 60)
            else:
                remaining_seconds = ACCESS_TOKEN_EXPIRE_MINUTES * 60
            
            # Store in Redis/memory with TTL (auto-cleanup after token expires anyway)
            set_with_expiry(f"{BLACKLIST_PREFIX}{jti}", "1", remaining_seconds)
            logger.info(f"Token revoked: jti={jti[:8]}... ttl={remaining_seconds}s")
            return True
        return False
    except JWTError as e:
        logger.warning(f"Failed to revoke token: {e}")
        return False


def get_token_claims(token: str) -> Optional[dict]:
    """
    Get all claims from a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Token claims dict if valid, None otherwise
    """
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


# ============================================================================
# REFRESH TOKEN FUNCTIONS
# ============================================================================

def _hash_token(token: str) -> str:
    """Hash a token for secure storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def create_refresh_token(
    db: Session,
    user_id: uuid.UUID,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> str:
    """
    Create a new refresh token and store it in the database.
    
    Unlike access tokens (stateless JWTs), refresh tokens are stored
    in the database so they can be revoked and rotated.
    
    Args:
        db: Database session
        user_id: User's UUID
        ip_address: Client IP for security context
        user_agent: Client user agent for security context
        
    Returns:
        The raw refresh token (only returned once, not stored)
    """
    from app.auth.models import RefreshToken
    
    # Generate a secure random token
    raw_token = secrets.token_urlsafe(64)
    token_hash = _hash_token(raw_token)
    
    # Create database record
    refresh_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        ip_address=ip_address,
        user_agent=user_agent[:500] if user_agent else None,  # Truncate long user agents
    )
    
    db.add(refresh_token)
    db.commit()
    
    logger.info(f"Refresh token created for user {user_id}")
    return raw_token


def validate_refresh_token(
    db: Session,
    raw_token: str
) -> Optional[Tuple[uuid.UUID, uuid.UUID]]:
    """
    Validate a refresh token.
    
    Args:
        db: Database session
        raw_token: The raw refresh token
        
    Returns:
        Tuple of (user_id, token_id) if valid, None otherwise
    """
    from app.auth.models import RefreshToken
    
    token_hash = _hash_token(raw_token)
    
    statement = select(RefreshToken).where(
        RefreshToken.token_hash == token_hash,
        RefreshToken.revoked_at.is_(None),
        RefreshToken.expires_at > datetime.utcnow()
    )
    
    result = db.exec(statement)
    token = result.first()
    
    if not token:
        return None
    
    return (token.user_id, token.id)


def rotate_refresh_token(
    db: Session,
    old_token: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> Optional[Tuple[str, uuid.UUID]]:
    """
    Rotate a refresh token - invalidate old one and create new one.
    
    This is a security best practice: each refresh token can only be used once.
    If an attacker steals a token, the legitimate user's next refresh will fail,
    alerting them to the compromise.
    
    Args:
        db: Database session
        old_token: The current refresh token
        ip_address: Client IP for new token
        user_agent: Client user agent for new token
        
    Returns:
        Tuple of (new_raw_token, user_id) if successful, None otherwise
    """
    from app.auth.models import RefreshToken
    
    # Validate old token
    validation = validate_refresh_token(db, old_token)
    if not validation:
        logger.warning("Attempted to rotate invalid/expired refresh token")
        return None
    
    user_id, old_token_id = validation
    
    # Create new token first
    new_raw_token = create_refresh_token(db, user_id, ip_address, user_agent)
    
    # Get the new token's ID
    new_token_hash = _hash_token(new_raw_token)
    new_token = db.exec(
        select(RefreshToken).where(RefreshToken.token_hash == new_token_hash)
    ).first()
    
    # Mark old token as replaced
    old_token_record = db.get(RefreshToken, old_token_id)
    if old_token_record:
        old_token_record.revoked_at = datetime.utcnow()
        old_token_record.replaced_by = new_token.id if new_token else None
        db.add(old_token_record)
        db.commit()
    
    logger.info(f"Refresh token rotated for user {user_id}")
    return (new_raw_token, user_id)


def revoke_refresh_token(db: Session, raw_token: str) -> bool:
    """
    Revoke a refresh token.
    
    Args:
        db: Database session
        raw_token: The refresh token to revoke
        
    Returns:
        True if revoked, False if not found
    """
    from app.auth.models import RefreshToken
    
    token_hash = _hash_token(raw_token)
    
    token = db.exec(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    ).first()
    
    if not token:
        return False
    
    token.revoked_at = datetime.utcnow()
    db.add(token)
    db.commit()
    
    logger.info(f"Refresh token revoked for user {token.user_id}")
    return True


def revoke_all_user_refresh_tokens(db: Session, user_id: uuid.UUID) -> int:
    """
    Revoke all refresh tokens for a user (e.g., for logout from all devices).
    
    Args:
        db: Database session
        user_id: User's UUID
        
    Returns:
        Number of tokens revoked
    """
    from app.auth.models import RefreshToken
    
    tokens = db.exec(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None)
        )
    ).all()
    
    count = 0
    now = datetime.utcnow()
    for token in tokens:
        token.revoked_at = now
        db.add(token)
        count += 1
    
    if count > 0:
        db.commit()
        logger.info(f"Revoked {count} refresh tokens for user {user_id}")
    
    return count