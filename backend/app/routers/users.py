from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.user import UserBase, UpdateUserRequest, UpdateTelegramIDRequest
from app.utils.jwt import get_current_user
from app.models.user import User
from app.db.session import get_db
from app.core.logging_config import app_logger

router = APIRouter()


@router.get("/me", response_model=UserBase)
def get_profile(user: User = Depends(get_current_user)):
    """Get current user profile"""
    return user


@router.put("/me", response_model=UserBase)
def update_profile(
    data: UpdateUserRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Update current user profile"""
    try:
        if data.name is not None:
            user.name = data.name
        if data.avatar_url is not None:
            user.avatar_url = data.avatar_url

        db.commit()
        db.refresh(user)
        app_logger.info(f"Profile updated for user {user.id}")
        return user
    except Exception as e:
        app_logger.error(f"Update profile error for user {user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )


@router.put("/me/telegram-id")
def update_telegram_id(
    data: UpdateTelegramIDRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Update Telegram ID for current user"""
    try:
        # Check if Telegram ID is already used by another user
        existing = db.query(User).filter(
            User.telegram_id == data.telegram_id,
            User.id != user.id
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Telegram ID already used by another user"
            )

        user.telegram_id = data.telegram_id
        db.commit()
        db.refresh(user)
        app_logger.info(f"Telegram ID updated for user {user.id}")
        return {"success": True, "telegram_id": data.telegram_id}
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Update Telegram ID error for user {user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update Telegram ID"
        )
