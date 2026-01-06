"""Configuration helpers (environment variables and defaults)."""

# Standard library
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import List

# Third-party
from dotenv import load_dotenv

# Ensure we load the backend-local .env regardless of CWD.
_BACKEND_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(dotenv_path=_BACKEND_ROOT / ".env")


@dataclass
class Settings:
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./test.db")
    secret_key: str = os.getenv("SECRET_KEY", "")
    allowed_origins: List[str] = None
    upload_dir: str = os.getenv("UPLOAD_DIR", "uploads")
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # OAuth - Google
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    google_redirect_uri: str = os.getenv("GOOGLE_REDIRECT_URI", "https://api.synthdata.studio/auth/google/callback")

    # OAuth - GitHub
    github_client_id: str = os.getenv("GITHUB_CLIENT_ID", "")
    github_client_secret: str = os.getenv("GITHUB_CLIENT_SECRET", "")
    github_redirect_uri: str = os.getenv("GITHUB_REDIRECT_URI", "https://api.synthdata.studio/auth/github/callback")

    # Frontend URL (for OAuth redirects)
    frontend_url: str = os.getenv("FRONTEND_URL", "https://www.synthdata.studio")
    
    # Cookie domain for cross-subdomain sharing (api.synthdata.studio → www.synthdata.studio)
    # Must start with a dot for subdomain sharing
    cookie_domain: str = os.getenv("COOKIE_DOMAIN", ".synthdata.studio")
    
    def __post_init__(self):
        """Validate critical settings after initialization."""
        import logging
        logger = logging.getLogger(__name__)

        allow_unsafe = (
            os.getenv("TESTING") == "1" or
            os.getenv("ALEMBIC_RUNNING") == "1"
        )
        
        # Secret key validation
        if not self.secret_key or self.secret_key == "change-me":
            logger.critical("=" * 60)
            logger.critical("❌ CRITICAL SECURITY ERROR")
            logger.critical("=" * 60)
            logger.critical("SECRET_KEY environment variable is not set or using default value.")
            logger.critical("This is a critical security vulnerability.")
            logger.critical("")
            logger.critical("To fix this:")
            logger.critical("1. Generate a secure key: python -c 'import secrets; print(secrets.token_urlsafe(32))'")
            logger.critical("2. Set it in your .env file: SECRET_KEY=your_generated_key")
            logger.critical("3. Restart the server")
            logger.critical("=" * 60)

            if allow_unsafe:
                # Migrations/tests shouldn't hard-exit the process.
                # Keep it deterministic but obviously not secure.
                self.secret_key = "insecure-dev-secret-key"
                logger.critical("Continuing because TESTING/ALEMBIC_RUNNING is set.")
            else:
                sys.exit(1)
        
        # CORS configuration
        if self.allowed_origins is None:
            if self.debug:
                # Development: Allow localhost origins explicitly (required for credentials)
                self.allowed_origins = [
                    "http://localhost:3000",
                    "http://localhost:8000",
                    "http://127.0.0.1:3000",
                    "http://127.0.0.1:8000"
                ]
            else:
                # Production: Require explicit configuration
                origins_env = os.getenv("ALLOWED_ORIGINS", "")
                if not origins_env:
                    logger.warning("=" * 60)
                    logger.warning("⚠️  WARNING: ALLOWED_ORIGINS not set")
                    logger.warning("=" * 60)
                    logger.warning("Running in production mode without ALLOWED_ORIGINS.")
                    logger.warning("Defaulting to localhost only.")
                    logger.warning("")
                    logger.warning("To fix: Set ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com")
                    logger.warning("=" * 60)
                    self.allowed_origins = ["http://localhost:3000", "http://localhost:8000", "https://www.synthdata.studio", "https://synthdata.studio", "https://api.synthdata.studio"]
                else:
                    self.allowed_origins = [origin.strip() for origin in origins_env.split(",")]


settings = Settings()
