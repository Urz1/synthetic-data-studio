"""Configuration helpers (environment variables and defaults)."""

from dataclasses import dataclass
import os
import sys
from typing import List
from dotenv import load_dotenv

load_dotenv()


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
    google_redirect_uri: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")
    
    # OAuth - GitHub
    github_client_id: str = os.getenv("GITHUB_CLIENT_ID", "")
    github_client_secret: str = os.getenv("GITHUB_CLIENT_SECRET", "")
    github_redirect_uri: str = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8000/auth/github/callback")
    
    # Frontend URL (for OAuth redirects)
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    def __post_init__(self):
        """Validate critical settings after initialization."""
        # Secret key validation
        if not self.secret_key or self.secret_key == "change-me":
            print("\n" + "="*60)
            print("❌ CRITICAL SECURITY ERROR")
            print("="*60)
            print("SECRET_KEY environment variable is not set or using default value.")
            print("This is a critical security vulnerability.")
            print("")
            print("To fix this:")
            print("1. Generate a secure key: python -c 'import secrets; print(secrets.token_urlsafe(32))'")
            print("2. Set it in your .env file: SECRET_KEY=your_generated_key")
            print("3. Restart the server")
            print("="*60 + "\n")
            sys.exit(1)
        
        # CORS configuration
        if self.allowed_origins is None:
            if self.debug:
                # Development: Allow all origins
                self.allowed_origins = ["*"]
            else:
                # Production: Require explicit configuration
                origins_env = os.getenv("ALLOWED_ORIGINS", "")
                if not origins_env:
                    print("\n" + "="*60)
                    print("⚠️  WARNING: ALLOWED_ORIGINS not set")
                    print("="*60)
                    print("Running in production mode without ALLOWED_ORIGINS.")
                    print("Defaulting to localhost only.")
                    print("")
                    print("To fix: Set ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com")
                    print("="*60 + "\n")
                    self.allowed_origins = ["http://localhost:3000", "http://localhost:8000","https://synthdata.studio"]
                else:
                    self.allowed_origins = [origin.strip() for origin in origins_env.split(",")]


settings = Settings()
