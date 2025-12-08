"""Auth API routes (registration, login, OAuth)."""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library
from typing import Optional

# Third-party
from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.responses import RedirectResponse
from sqlmodel import Session

# Local - Core
from app.core.dependencies import get_db, get_current_user
from app.core.config import settings

# Local - Module
from .schemas import (
    UserCreate, UserResponse, UserLogin, Token,
    OAuthProviderInfo, OAuthProvidersResponse, OAuthCallbackResponse
)
from .repositories import create_user, get_user_by_email, authenticate_user
from .services import create_access_token
from .oauth import (
    get_oauth_provider, get_available_providers, GoogleOAuth, GitHubOAuth,
    generate_oauth_state, validate_oauth_state
)
from .models import User

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
    if error:
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
    print(f"OAuth Google callback: user_info = {user_info}")
    print(f"OAuth Google callback: user created = {is_new}, user.id = {user.id}, user.email = {user.email}")

    # Generate JWT token with user ID and role
    jwt_token = create_access_token(data={
        "sub": user.email,
        "uid": str(user.id),
        "role": user.role
    })
    print(f"OAuth Google callback: jwt_token generated, length = {len(jwt_token)}")

    # Redirect to frontend with token and user data in URL params
    from urllib.parse import urlencode
    params = urlencode({
        "token": jwt_token,
        "user_id": str(user.id),
        "email": user.email or "",
        "name": user.name or "",
        "avatar_url": user.avatar_url or "",
        "role": user.role,
        "is_new": str(is_new).lower()
    })
    print(f"OAuth Google callback: params built, token present = {'token=' in params}")
    frontend_callback = f"{settings.frontend_url}/auth/google/callback?{params}"
    print(f"OAuth Google callback: redirecting to = {frontend_callback[:150]}...")
    return RedirectResponse(url=frontend_callback)


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
    
    # Generate JWT token with user ID and role
    jwt_token = create_access_token(data={
        "sub": user.email,
        "uid": str(user.id),
        "role": user.role
    })
    
    # Redirect to frontend with token and user data in URL params
    from urllib.parse import urlencode
    params = urlencode({
        "token": jwt_token,
        "user_id": str(user.id),
        "email": user.email,
        "name": user.name or "",
        "avatar_url": user.avatar_url or "",
        "role": user.role,
        "is_new": str(is_new).lower()
    })
    frontend_callback = f"{settings.frontend_url}/auth/github/callback?{params}"
    return RedirectResponse(url=frontend_callback)


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
        db.add(user)
        db.commit()
        db.refresh(user)
        return user, False
    
    # Create new user
    import datetime
    new_user = User(
        email=email,
        oauth_provider=provider,
        oauth_id=provider_id,
        name=user_info.get("name"),
        avatar_url=user_info.get("avatar_url"),
        hashed_password=None,  # OAuth users don't have passwords
        is_active=True,
        role="user",
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user, True
