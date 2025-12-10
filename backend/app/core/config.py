import os
from pydantic_settings import BaseSettings
from typing import Optional
from pydantic import field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "BOTAXXX"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-to-a-random-secret-key-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))  # 7 days

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://botaxxx:botaxxx_password@localhost:5432/botaxxx_db"
    )

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: str = os.getenv(
        "GOOGLE_REDIRECT_URI",
        "http://localhost:8000/auth/google/callback"
    )

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = False  # Disabled by default
    RATE_LIMIT_PER_MINUTE: int = 60

    # CORS
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
    
    # Frontend URL
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    @field_validator('SECRET_KEY')
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if v == "change-this-to-a-random-secret-key-in-production":
            import warnings
            warnings.warn("Using default SECRET_KEY! Change it in production!", UserWarning)
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return v

    @field_validator('DATABASE_URL')
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v:
            raise ValueError("DATABASE_URL is required")
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
