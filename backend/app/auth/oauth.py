"""
OAuth providers integration (Google, GitHub).

Handles OAuth2 flow for third-party authentication.
"""

# ============================================================================
# IMPORTS
# ============================================================================

import hashlib
import hmac
import secrets
import time
import logging
from typing import Optional, Dict, Any
from urllib.parse import urlencode

import httpx

from app.core.config import settings
from app.core.redis_utils import set_with_expiry, get_value, delete_key


logger = logging.getLogger(__name__)


# ============================================================================
# OAUTH STATE MANAGEMENT (CSRF Protection)
# ============================================================================

# Key prefix for OAuth state in Redis
OAUTH_STATE_PREFIX = "oauth_state:"
STATE_EXPIRY_SECONDS = 600  # 10 minutes


def generate_oauth_state() -> str:
    """
    Generate a secure OAuth state token for CSRF protection.
    
    Uses Redis if available, falls back to in-memory.
    
    Returns:
        Cryptographically secure state token
    """
    state = secrets.token_urlsafe(32)
    
    # Store with TTL (auto-expires)
    set_with_expiry(
        f"{OAUTH_STATE_PREFIX}{state}",
        str(time.time()),
        STATE_EXPIRY_SECONDS
    )
    
    return state


def validate_oauth_state(state: str) -> bool:
    """
    Validate an OAuth state token.
    
    Uses Redis if available, falls back to in-memory.
    State is consumed (deleted) after validation (one-time use).
    
    Args:
        state: State token to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not state:
        return False
    
    key = f"{OAUTH_STATE_PREFIX}{state}"
    created_at_str = get_value(key)
    
    if not created_at_str:
        return False
    
    # Delete after use (one-time token)
    delete_key(key)
    
    # Check expiry (belt-and-suspenders with Redis TTL)
    try:
        created_at = float(created_at_str)
        if time.time() - created_at > STATE_EXPIRY_SECONDS:
            return False
    except (ValueError, TypeError):
        return False
    
    return True



# ============================================================================
# OAUTH CONFIGURATION
# ============================================================================

class OAuthConfig:
    """OAuth provider configuration."""
    
    # Google OAuth
    GOOGLE_CLIENT_ID = settings.google_client_id
    GOOGLE_CLIENT_SECRET = settings.google_client_secret
    GOOGLE_REDIRECT_URI = settings.google_redirect_uri
    GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
    GOOGLE_SCOPES = ["openid", "email", "profile"]
    
    # GitHub OAuth
    GITHUB_CLIENT_ID = settings.github_client_id
    GITHUB_CLIENT_SECRET = settings.github_client_secret
    GITHUB_REDIRECT_URI = settings.github_redirect_uri
    GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
    GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
    GITHUB_USERINFO_URL = "https://api.github.com/user"
    GITHUB_EMAILS_URL = "https://api.github.com/user/emails"
    GITHUB_SCOPES = ["read:user", "user:email"]


# ============================================================================
# OAUTH PROVIDER BASE
# ============================================================================

class OAuthProvider:
    """Base class for OAuth providers."""
    
    def __init__(self, name: str):
        self.name = name
    
    def get_authorization_url(self, state: str) -> str:
        """Generate OAuth authorization URL."""
        raise NotImplementedError
    
    async def get_access_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        raise NotImplementedError
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Fetch user info from provider."""
        raise NotImplementedError


# ============================================================================
# GOOGLE OAUTH
# ============================================================================

class GoogleOAuth(OAuthProvider):
    """Google OAuth2 implementation."""
    
    def __init__(self):
        super().__init__("google")
        self.client_id = OAuthConfig.GOOGLE_CLIENT_ID
        self.client_secret = OAuthConfig.GOOGLE_CLIENT_SECRET
        self.redirect_uri = OAuthConfig.GOOGLE_REDIRECT_URI
    
    def is_configured(self) -> bool:
        """Check if Google OAuth is properly configured."""
        configured = bool(self.client_id and self.client_secret)
        if not configured:
            logger.warning("Google OAuth not configured - missing client ID or secret")
        return configured
    
    def get_authorization_url(self, state: str) -> str:
        """Generate Google OAuth authorization URL."""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": " ".join(OAuthConfig.GOOGLE_SCOPES),
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }
        return f"{OAuthConfig.GOOGLE_AUTH_URL}?{urlencode(params)}"
    
    async def get_access_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for Google access token."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OAuthConfig.GOOGLE_TOKEN_URL,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": self.redirect_uri,
                },
                headers={"Accept": "application/json"},
            )
            response.raise_for_status()
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Fetch user info from Google."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                OAuthConfig.GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            response.raise_for_status()
            data = response.json()
            
            return {
                "provider": "google",
                "provider_id": data["id"],
                "email": data["email"],
                "name": data.get("name"),
                "avatar_url": data.get("picture"),
                "email_verified": data.get("verified_email", False),
            }


# ============================================================================
# GITHUB OAUTH
# ============================================================================

class GitHubOAuth(OAuthProvider):
    """GitHub OAuth2 implementation."""
    
    def __init__(self):
        super().__init__("github")
        self.client_id = OAuthConfig.GITHUB_CLIENT_ID
        self.client_secret = OAuthConfig.GITHUB_CLIENT_SECRET
        self.redirect_uri = OAuthConfig.GITHUB_REDIRECT_URI
    
    def is_configured(self) -> bool:
        """Check if GitHub OAuth is properly configured."""
        return bool(self.client_id and self.client_secret)
    
    def get_authorization_url(self, state: str) -> str:
        """Generate GitHub OAuth authorization URL."""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(OAuthConfig.GITHUB_SCOPES),
            "state": state,
        }
        return f"{OAuthConfig.GITHUB_AUTH_URL}?{urlencode(params)}"
    
    async def get_access_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for GitHub access token."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OAuthConfig.GITHUB_TOKEN_URL,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                },
                headers={"Accept": "application/json"},
            )
            response.raise_for_status()
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Fetch user info from GitHub."""
        async with httpx.AsyncClient() as client:
            # Get user profile
            response = await client.get(
                OAuthConfig.GITHUB_USERINFO_URL,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )
            response.raise_for_status()
            data = response.json()
            
            # Get primary email (may not be in profile if private)
            email = data.get("email")
            if not email:
                email = await self._get_primary_email(access_token)
            
            return {
                "provider": "github",
                "provider_id": str(data["id"]),
                "email": email,
                "name": data.get("name") or data.get("login"),
                "avatar_url": data.get("avatar_url"),
                "email_verified": True,  # GitHub emails are verified
            }
    
    async def _get_primary_email(self, access_token: str) -> Optional[str]:
        """Get primary email from GitHub emails API."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                OAuthConfig.GITHUB_EMAILS_URL,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )
            if response.status_code != 200:
                return None
            
            emails = response.json()
            # Find primary verified email
            for email_data in emails:
                if email_data.get("primary") and email_data.get("verified"):
                    return email_data["email"]
            
            # Fallback to any verified email
            for email_data in emails:
                if email_data.get("verified"):
                    return email_data["email"]
            
            return None


# ============================================================================
# PROVIDER FACTORY
# ============================================================================

def get_oauth_provider(provider: str) -> OAuthProvider:
    """Get OAuth provider instance by name."""
    providers = {
        "google": GoogleOAuth,
        "github": GitHubOAuth,
    }
    
    if provider not in providers:
        raise ValueError(f"Unknown OAuth provider: {provider}")
    
    return providers[provider]()


def get_available_providers() -> Dict[str, bool]:
    """Get list of configured OAuth providers."""
    return {
        "google": GoogleOAuth().is_configured(),
        "github": GitHubOAuth().is_configured(),
    }
