"""Configuration helpers (environment variables and defaults)."""

from dataclasses import dataclass
import os


@dataclass
class Settings:
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./test.db")
    secret_key: str = os.getenv("SECRET_KEY", "change-me")


settings = Settings()
