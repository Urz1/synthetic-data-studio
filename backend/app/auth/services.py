"""Auth services: token generation and validation."""

# Standard library
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

# Third-party
from jose import JWTError, jwt

# Local - Core
from app.core.config import settings


SECRET_KEY = settings.secret_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Token blacklist (in production, use Redis)
_token_blacklist: set = set()


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
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


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
        if jti and jti in _token_blacklist:
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
    
    Args:
        token: JWT token to revoke
        
    Returns:
        True if revoked successfully, False otherwise
    """
    try:
        # Decode without verification to get JTI (token may be expired)
        payload = jwt.decode(
            token, SECRET_KEY, algorithms=[ALGORITHM],
            options={"verify_exp": False}
        )
        jti = payload.get("jti")
        if jti:
            _token_blacklist.add(jti)
            return True
        return False
    except JWTError:
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