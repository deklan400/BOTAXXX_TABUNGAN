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
    BankLogoUpdateRequest,
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


@router.get("/maintenance", response_model=MaintenanceModeResponse)
async def get_maintenance_mode(
    admin: User = Depends(get_current_admin)
):
    """Get current maintenance mode status"""
    # Store maintenance mode in a simple file or use settings
    # For now, using a simple approach with settings
    maintenance_file = "maintenance_mode.txt"
    is_maintenance = False
    message = ""
    
    if os.path.exists(maintenance_file):
        with open(maintenance_file, "r") as f:
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
    maintenance_file = "maintenance_mode.txt"
    
    if request.enabled:
        with open(maintenance_file, "w") as f:
            f.write(request.message or "System is under maintenance. Please try again later.")
    else:
        if os.path.exists(maintenance_file):
            os.remove(maintenance_file)
    
    return {
        "is_maintenance": request.enabled,
        "message": request.message if request.enabled else ""
    }


@router.post("/broadcast")
async def broadcast_alert(
    request: BroadcastAlertRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Broadcast alert/notification to all users"""
    # Get all active users
    users = db.query(User).filter(User.is_active == True).all()
    
    # Store broadcast message (can be sent via Telegram bot or stored for display)
    broadcast_file = "broadcast_message.txt"
    with open(broadcast_file, "w") as f:
        f.write(f"{request.message}|{datetime.utcnow().isoformat()}")
    
    return {
        "message": "Broadcast sent successfully",
        "users_count": len(users),
        "content": request.message
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


@router.put("/banks/{bank_id}")
async def update_bank_settings(
    bank_id: int,
    request: BankLogoUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    """Update bank settings (logo size, brand color, etc)"""
    bank = db.query(Bank).filter(Bank.id == bank_id).first()
    if not bank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank not found"
        )
    
    if request.brand_color:
        bank.brand_color = request.brand_color
    if request.is_active is not None:
        bank.is_active = request.is_active
    
    db.commit()
    db.refresh(bank)
    
    return {
        "message": "Bank settings updated successfully",
        "bank": bank
    }

