from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.schemas.user import (
    UserBase, UpdateUserRequest, UpdateTelegramIDRequest,
    TelegramIDBase, AddTelegramIDRequest
)
from app.utils.jwt import get_current_user
from app.models.user import User
from app.models.user_telegram import UserTelegramID
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
    """Update Telegram ID for current user (backward compatibility)"""
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


@router.get("/me/telegram-ids", response_model=List[TelegramIDBase])
def get_telegram_ids(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Get all Telegram IDs for current user"""
    telegram_ids = db.query(UserTelegramID).filter(
        UserTelegramID.user_id == user.id
    ).all()
    return telegram_ids


@router.post("/me/telegram-ids", response_model=TelegramIDBase)
def add_telegram_id(
    data: AddTelegramIDRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Add a new Telegram ID for current user"""
    try:
        # Check if this telegram_id already exists for this user
        existing = db.query(UserTelegramID).filter(
            UserTelegramID.user_id == user.id,
            UserTelegramID.telegram_id == data.telegram_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This Telegram ID is already added to your account"
            )

        # Create new UserTelegramID
        user_telegram_id = UserTelegramID(
            user_id=user.id,
            telegram_id=data.telegram_id,
            telegram_username=data.telegram_username
        )
        db.add(user_telegram_id)
        db.commit()
        db.refresh(user_telegram_id)
        app_logger.info(f"Telegram ID {data.telegram_id} added for user {user.id}")
        return user_telegram_id
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        app_logger.error(f"Add Telegram ID error for user {user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add Telegram ID"
        )


@router.delete("/me/telegram-ids/{telegram_id_id}")
def delete_telegram_id(
    telegram_id_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Delete a Telegram ID for current user"""
    try:
        user_telegram_id = db.query(UserTelegramID).filter(
            UserTelegramID.id == telegram_id_id,
            UserTelegramID.user_id == user.id
        ).first()

        if not user_telegram_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Telegram ID not found"
            )

        db.delete(user_telegram_id)
        db.commit()
        app_logger.info(f"Telegram ID {telegram_id_id} deleted for user {user.id}")
        return {"success": True, "message": "Telegram ID deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        app_logger.error(f"Delete Telegram ID error for user {user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete Telegram ID"
        )
