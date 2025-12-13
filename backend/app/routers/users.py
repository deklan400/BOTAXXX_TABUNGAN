from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
import pathlib

from app.schemas.user import (
    UserBase, UpdateUserRequest, UpdateTelegramIDRequest,
    TelegramIDBase, AddTelegramIDRequest
)
from app.utils.jwt import get_current_user
from app.models.user import User
from app.models.user_telegram import UserTelegramID
from app.models.alert import Alert
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


@router.post("/me/avatar", response_model=UserBase)
async def upload_avatar(
    avatar_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Upload user avatar image"""
    try:
        app_logger.info(f"Avatar upload request received for user {user.id}, filename: {avatar_file.filename}")
        
        # Validate file type
        if not avatar_file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )
        
        file_ext = os.path.splitext(avatar_file.filename)[1].lower()
        if file_ext not in ['.png', '.jpg', '.jpeg', '.gif', '.webp']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Only PNG, JPG, JPEG, GIF, WEBP allowed. Got: {file_ext}"
            )
        
        # Validate file size (max 5MB)
        contents = await avatar_file.read()
        file_size = len(contents)
        app_logger.info(f"File size: {file_size} bytes")
        
        if file_size > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size too large. Maximum size is 5MB."
            )
        
        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is empty"
            )
        
        # Save avatar file - use absolute path from project root
        project_root = pathlib.Path(__file__).parent.parent.parent.parent
        avatar_dir = project_root / "dashboard" / "public" / "avatars"
        avatar_dir.mkdir(parents=True, exist_ok=True)
        app_logger.info(f"Avatar directory: {avatar_dir}")
        
        # Use user ID as filename
        avatar_filename = f"user_{user.id}{file_ext}"
        file_path = avatar_dir / avatar_filename
        
        # Delete old avatar if exists
        if file_path.exists():
            try:
                file_path.unlink()
                app_logger.info(f"Deleted old avatar: {file_path}")
            except Exception as e:
                app_logger.warning(f"Could not delete old avatar: {e}")
        
        # Write file
        with open(str(file_path), "wb") as buffer:
            buffer.write(contents)
        
        app_logger.info(f"Avatar file saved to: {file_path}")
        
        # Update user record with avatar URL
        avatar_url = f"/avatars/{avatar_filename}"
        user.avatar_url = avatar_url
        db.commit()
        db.refresh(user)
        
        app_logger.info(f"Avatar uploaded successfully for user {user.id}: {avatar_url}")
        return user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = f"Upload avatar error for user {user.id}: {str(e)}"
        app_logger.error(error_msg, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload avatar: {str(e)}"
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


@router.get("/me/alerts")
def get_alerts(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Get alerts for current user"""
    try:
        query = db.query(Alert).filter(Alert.user_id == user.id)
        
        if unread_only:
            query = query.filter(Alert.is_read == False)
        
        total = query.count()
        alerts = query.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()
        
        return {
            "alerts": alerts,
            "total": total,
            "unread_count": db.query(Alert).filter(
                Alert.user_id == user.id,
                Alert.is_read == False
            ).count()
        }
    except Exception as e:
        app_logger.error(f"Get alerts error for user {user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get alerts"
        )


@router.put("/me/alerts/{alert_id}/read")
def mark_alert_as_read(
    alert_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Mark an alert as read"""
    try:
        alert = db.query(Alert).filter(
            Alert.id == alert_id,
            Alert.user_id == user.id
        ).first()
        
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alert not found"
            )
        
        alert.is_read = True
        db.commit()
        db.refresh(alert)
        
        return {"success": True, "alert": alert}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        app_logger.error(f"Mark alert as read error for user {user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark alert as read"
        )


@router.put("/me/alerts/read-all")
def mark_all_alerts_as_read(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Mark all alerts as read for current user"""
    try:
        db.query(Alert).filter(
            Alert.user_id == user.id,
            Alert.is_read == False
        ).update({"is_read": True})
        db.commit()
        
        return {"success": True, "message": "All alerts marked as read"}
    except Exception as e:
        db.rollback()
        app_logger.error(f"Mark all alerts as read error for user {user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark all alerts as read"
        )
