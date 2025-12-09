from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Annotated

from app.schemas.auth import RegisterRequest, LoginRequest, TelegramLoginRequest, TokenResponse
from app.services.auth_service import register_user, login_user, telegram_login, get_or_create_google_user
from app.db.session import get_db
from app.utils.rate_limit import rate_limit
from app.settings.oauth_google import get_google_oauth_url, get_google_user_info_sync
from app.core.logging_config import app_logger

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
@rate_limit(max_requests=3, window_seconds=60)
async def register(
    request: Request,
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    try:
        user = register_user(db, data)
        app_logger.info(f"User registered: {user.email}", extra={"user_id": user.id})
        return {"message": "User registered successfully", "user_id": user.id}
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Registration error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=TokenResponse)
@rate_limit(max_requests=5, window_seconds=60)
async def login(
    request: Request,
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login with email and password"""
    try:
        result = login_user(db, data)
        app_logger.info(f"User logged in: {data.email}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/telegram-login", response_model=TokenResponse)
@rate_limit(max_requests=10, window_seconds=60)
async def telegram_login_endpoint(
    request: Request,
    data: TelegramLoginRequest,
    db: Session = Depends(get_db)
):
    """Login via Telegram ID"""
    try:
        result = telegram_login(db, data)
        app_logger.info(f"Telegram login: {data.telegram_id}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Telegram login error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Telegram login failed"
        )


@router.get("/google")
async def google_login():
    """Initiate Google OAuth login"""
    try:
        auth_url = get_google_oauth_url()
        return RedirectResponse(url=auth_url)
    except ValueError as e:
        # Configuration error
        app_logger.error(f"Google OAuth configuration error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google OAuth not configured: {str(e)}. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file."
        )
    except Exception as e:
        app_logger.error(f"Google OAuth error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google OAuth failed: {str(e)}"
        )


@router.get("/google/callback")
async def google_callback(
    code: str = None,
    error: str = None,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback"""
    if error:
        app_logger.error(f"Google OAuth callback error: {error}")
        from app.core.config import settings
        frontend_url = f"{settings.FRONTEND_URL}/login?error=oauth_cancelled"
        return RedirectResponse(url=frontend_url, status_code=status.HTTP_302_FOUND)
    
    if not code:
        app_logger.error("Google OAuth callback: No authorization code received")
        from app.core.config import settings
        frontend_url = f"{settings.FRONTEND_URL}/login?error=no_code"
        return RedirectResponse(url=frontend_url, status_code=status.HTTP_302_FOUND)
    
    try:
        user_info = get_google_user_info_sync(code)
        user = get_or_create_google_user(
            db,
            google_id=user_info["id"],
            email=user_info["email"],
            name=user_info["name"],
            avatar_url=user_info.get("picture")
        )

        from app.core.security import create_access_token
        access_token = create_access_token(data={"sub": str(user.id)})

        app_logger.info(f"Google OAuth login: {user.email}", extra={"user_id": user.id})

        # Redirect to frontend with token
        from app.core.config import settings
        frontend_url = f"{settings.FRONTEND_URL}/auth/google/callback"
        return RedirectResponse(
            url=f"{frontend_url}?token={access_token}",
            status_code=status.HTTP_302_FOUND
        )
    except ValueError as e:
        app_logger.error(f"Google OAuth configuration error: {str(e)}", exc_info=True)
        from app.core.config import settings
        frontend_url = f"{settings.FRONTEND_URL}/login?error=oauth_not_configured"
        return RedirectResponse(url=frontend_url, status_code=status.HTTP_302_FOUND)
    except Exception as e:
        app_logger.error(f"Google callback error: {str(e)}", exc_info=True)
        from app.core.config import settings
        frontend_url = f"{settings.FRONTEND_URL}/login?error=oauth_failed"
        return RedirectResponse(url=frontend_url, status_code=status.HTTP_302_FOUND)
