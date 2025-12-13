"""
Admin Router - Dashboard Admin Features
All endpoints require admin role
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.models.user import User
from app.models.bank import Bank
from app.utils.jwt import get_current_admin
from app.schemas.admin import (
    UserListResponse,
    UserDetailResponse,
    UserSuspendRequest,
    MaintenanceModeRequest,
    MaintenanceModeResponse,
    BroadcastAlertRequest,
    SendAlertToUserRequest,
    BankLogoUpdateRequest,
    BankCreateRequest,
    AdminStatsResponse
)
from app.core.config import settings
import os
import shutil

router = APIRouter()


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Get admin dashboard statistics"""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    suspended_users = db.query(User).filter(User.is_active == False).count()
    admin_users = db.query(User).filter(User.role == "admin").count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "suspended_users": suspended_users,
        "admin_users": admin_users
    }


@router.get("/users", response_model=UserListResponse)
async def list_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """List all users (admin only)"""
    query = db.query(User)
    
    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )
    
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "users": users,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/users/{user_id}", response_model=UserDetailResponse)
async def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Get user detail by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.put("/users/{user_id}/suspend")
async def suspend_user(
    user_id: int,
    request: UserSuspendRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Suspend or unsuspend a user"""
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot suspend yourself"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = not request.suspend  # If suspend=True, set is_active=False
    db.commit()
    db.refresh(user)
    
    return {
        "message": f"User {'suspended' if request.suspend else 'unsuspended'} successfully",
        "user": user
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Delete a user (permanent deletion - cascade to all related data)"""
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Delete user (cascade will handle related data)
    db.delete(user)
    db.commit()
    
    return {
        "message": "User deleted successfully",
        "deleted_user_id": user_id
    }


@router.get("/maintenance", response_model=MaintenanceModeResponse)
async def get_maintenance_mode(
    admin: User = Depends(get_current_admin)
):
    """Get current maintenance mode status"""
    # Use absolute path for maintenance file
    import pathlib
    project_root = pathlib.Path(__file__).parent.parent.parent.parent
    maintenance_file = project_root / "maintenance_mode.txt"
    
    is_maintenance = False
    message = ""
    
    if maintenance_file.exists():
        with open(maintenance_file, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if content:
                is_maintenance = True
                message = content
    
    return {
        "is_maintenance": is_maintenance,
        "message": message
    }


@router.put("/maintenance", response_model=MaintenanceModeResponse)
async def set_maintenance_mode(
    request: MaintenanceModeRequest,
    admin: User = Depends(get_current_admin)
):
    """Enable or disable maintenance mode"""
    # Use absolute path for maintenance file
    import pathlib
    project_root = pathlib.Path(__file__).parent.parent.parent.parent
    maintenance_file = project_root / "maintenance_mode.txt"
    
    if request.enabled:
        message = request.message or "System is under maintenance. Please try again later."
        with open(maintenance_file, "w", encoding="utf-8") as f:
            f.write(message)
        return {
            "is_maintenance": True,
            "message": message
        }
    else:
        if maintenance_file.exists():
            maintenance_file.unlink()
        return {
            "is_maintenance": False,
            "message": ""
        }


@router.post("/broadcast")
async def broadcast_alert(
    request: BroadcastAlertRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Broadcast alert/notification to all active users via Telegram"""
    from app.services.telegram_service import send_telegram_broadcast
    from app.models.user_telegram import UserTelegramID
    from app.models.alert import Alert
    
    # Get all active users
    users = db.query(User).filter(User.is_active == True).all()
    
    # Collect all Telegram IDs (from both new multi-ID system and old single ID)
    telegram_ids = []
    for user in users:
        # Get from new multi-ID system
        user_telegram_ids = db.query(UserTelegramID).filter(
            UserTelegramID.user_id == user.id
        ).all()
        for ut_id in user_telegram_ids:
            if ut_id.telegram_id not in telegram_ids:
                telegram_ids.append(ut_id.telegram_id)
        
        # Fallback to old single telegram_id field
        if user.telegram_id and user.telegram_id not in telegram_ids:
            telegram_ids.append(user.telegram_id)
    
    # Send broadcast via Telegram
    result = await send_telegram_broadcast(
        telegram_ids=telegram_ids,
        message=request.message,
        title=request.title
    )
    
    # Save alert to database for each user
    alerts_created = 0
    for user in users:
        alert = Alert(
            user_id=user.id,
            title=request.title,
            message=request.message,
            is_read=False
        )
        db.add(alert)
        alerts_created += 1
    
    db.commit()
    
    return {
        "message": "Broadcast sent successfully",
        "users_count": len(users),
        "alerts_created": alerts_created,
        "telegram_sent": result["success_count"],
        "telegram_failed": result["failed_count"],
        "telegram_total": result["total"],
        "content": request.message
    }


@router.post("/send-alert")
async def send_alert_to_user(
    request: SendAlertToUserRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Send alert/notification to a specific user via Telegram"""
    from app.services.telegram_service import send_telegram_message
    from app.models.user_telegram import UserTelegramID
    from app.models.alert import Alert
    
    # Get user
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get user's Telegram IDs
    telegram_ids = []
    
    # Get from new multi-ID system
    user_telegram_ids = db.query(UserTelegramID).filter(
        UserTelegramID.user_id == user.id
    ).all()
    for ut_id in user_telegram_ids:
        telegram_ids.append(ut_id.telegram_id)
    
    # Fallback to old single telegram_id field
    if user.telegram_id:
        telegram_ids.append(user.telegram_id)
    
    # Send message to all Telegram IDs of the user (if available)
    success_count = 0
    failed_count = 0
    
    if telegram_ids:
        for telegram_id in telegram_ids:
            success = await send_telegram_message(
                telegram_id=telegram_id,
                message=request.message,
                title=request.title
            )
            if success:
                success_count += 1
            else:
                failed_count += 1
    else:
        # Still save alert even if no Telegram ID
        pass
    
    # Save alert to database
    alert = Alert(
        user_id=user.id,
        title=request.title,
        message=request.message,
        is_read=False
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    return {
        "message": "Alert sent successfully" if success_count > 0 or not telegram_ids else "Alert saved (no Telegram ID)",
        "user_id": user.id,
        "user_name": user.name,
        "user_email": user.email,
        "alert_id": alert.id,
        "telegram_sent": success_count,
        "telegram_failed": failed_count,
        "telegram_total": len(telegram_ids)
    }


@router.get("/banks")
async def list_banks_for_admin(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """List all banks for admin management"""
    banks = db.query(Bank).order_by(Bank.name).all()
    return {"banks": banks}


@router.put("/banks/{bank_id}/logo")
async def update_bank_logo(
    bank_id: int,
    logo_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Update bank logo (upload new logo file)"""
    bank = db.query(Bank).filter(Bank.id == bank_id).first()
    if not bank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank not found"
        )
    
    # Validate file type
    if not logo_file.filename.endswith(('.png', '.jpg', '.jpeg', '.svg')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PNG, JPG, JPEG, SVG allowed."
        )
    
    # Save logo file - use absolute path from project root
    import pathlib
    project_root = pathlib.Path(__file__).parent.parent.parent.parent
    logo_dir = project_root / "dashboard" / "public" / "banks"
    logo_dir.mkdir(parents=True, exist_ok=True)
    
    # Use bank code as filename
    file_extension = os.path.splitext(logo_file.filename)[1]
    logo_filename = f"{bank.code}{file_extension}"
    file_path = logo_dir / logo_filename
    
    with open(str(file_path), "wb") as buffer:
        shutil.copyfileobj(logo_file.file, buffer)
    
    # Update bank record
    bank.logo_filename = logo_filename
    db.commit()
    db.refresh(bank)
    
    return {
        "message": "Logo updated successfully",
        "bank": bank,
        "logo_path": f"/banks/{logo_filename}"
    }


@router.post("/banks", status_code=status.HTTP_201_CREATED)
async def create_bank(
    request: BankCreateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Create a new bank"""
    # Check if bank with same name or code already exists
    existing_bank = db.query(Bank).filter(
        (Bank.name == request.name) | (Bank.code == request.code)
    ).first()
    if existing_bank:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bank with this name or code already exists"
        )
    
    bank = Bank(
        name=request.name,
        code=request.code,
        country=request.country,
        brand_color=request.brand_color,
        logo_background=request.logo_background,
        logo_size_width=request.logo_size_width,
        logo_size_height=request.logo_size_height,
        is_active=True
    )
    
    db.add(bank)
    db.commit()
    db.refresh(bank)
    
    return {
        "message": "Bank created successfully",
        "bank": bank
    }


@router.put("/banks/{bank_id}")
async def update_bank_settings(
    bank_id: int,
    request: BankLogoUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Update bank settings (logo size, brand color, background, etc)"""
    bank = db.query(Bank).filter(Bank.id == bank_id).first()
    if not bank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank not found"
        )
    
    if request.brand_color is not None:
        bank.brand_color = request.brand_color
    if request.logo_background is not None:
        bank.logo_background = request.logo_background
    if request.logo_size_width is not None:
        bank.logo_size_width = request.logo_size_width
    if request.logo_size_height is not None:
        bank.logo_size_height = request.logo_size_height
    if request.is_active is not None:
        bank.is_active = request.is_active
    
    db.commit()
    db.refresh(bank)
    
    return {
        "message": "Bank settings updated successfully",
        "bank": bank
    }


@router.delete("/banks/{bank_id}")
async def delete_bank(
    bank_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Delete a bank (will cascade delete all bank accounts)"""
    bank = db.query(Bank).filter(Bank.id == bank_id).first()
    if not bank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank not found"
        )
    
    # Check if bank has accounts
    account_count = len(bank.bank_accounts)
    if account_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete bank. There are {account_count} bank account(s) associated with this bank. Please delete or reassign them first."
        )
    
    # Delete logo file if exists
    if bank.logo_filename:
        import pathlib
        project_root = pathlib.Path(__file__).parent.parent.parent.parent
        logo_dir = project_root / "dashboard" / "public" / "banks"
        logo_path = logo_dir / bank.logo_filename
        if logo_path.exists():
            os.remove(logo_path)
    
    db.delete(bank)
    db.commit()
    
    return {
        "message": "Bank deleted successfully",
        "deleted_bank_id": bank_id
    }

