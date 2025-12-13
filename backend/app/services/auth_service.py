from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TelegramLoginRequest
from app.core.security import hash_password, verify_password, create_access_token
import os
import pathlib


def check_maintenance_mode() -> tuple[bool, str]:
    """Check if maintenance mode is active. Returns (is_maintenance, message)"""
    project_root = pathlib.Path(__file__).parent.parent.parent.parent
    maintenance_file = project_root / "maintenance_mode.txt"
    
    if maintenance_file.exists():
        with open(maintenance_file, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if content:
                return (True, content)
    return (False, "")


def register_user(db: Session, request: RegisterRequest) -> User:
    """Register a new user"""
    # Check maintenance mode - block all new registrations during maintenance
    is_maintenance, maintenance_message = check_maintenance_mode()
    if is_maintenance:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=maintenance_message or "System is under maintenance. Registration is temporarily disabled. Please try again later."
        )
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    user = User(
        name=request.name,
        email=request.email,
        password_hash=hash_password(request.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login_user(db: Session, request: LoginRequest) -> dict:
    """Login user and return JWT token"""
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Check maintenance mode - block non-admin users
    is_maintenance, maintenance_message = check_maintenance_mode()
    if is_maintenance and user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=maintenance_message or "System is under maintenance. Please try again later."
        )

    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password not set. Please use Google OAuth or set password."
        )

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


def telegram_login(db: Session, request: TelegramLoginRequest) -> dict:
    """Login user via Telegram ID (supports multiple Telegram IDs)"""
    from app.models.user_telegram import UserTelegramID
    
    # First check in user_telegram_ids table (new multi-ID system)
    user_telegram = db.query(UserTelegramID).filter(
        UserTelegramID.telegram_id == request.telegram_id
    ).first()
    
    if user_telegram:
        user = user_telegram.user
    else:
        # Fallback to old single telegram_id field (backward compatibility)
        user = db.query(User).filter(User.telegram_id == request.telegram_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Telegram ID not found. Please register in the dashboard first and set your Telegram ID."
        )

    # Check maintenance mode - block non-admin users
    is_maintenance, maintenance_message = check_maintenance_mode()
    if is_maintenance and user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=maintenance_message or "System is under maintenance. Please try again later."
        )

    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


def get_or_create_google_user(db: Session, google_id: str, email: str, name: str, avatar_url: str = None) -> User:
    """Get or create user from Google OAuth"""
    # Check maintenance mode first
    is_maintenance, maintenance_message = check_maintenance_mode()
    
    # Check if user exists by Google ID
    user = db.query(User).filter(User.google_id == google_id).first()
    if user:
        # Block non-admin users during maintenance
        if is_maintenance and user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=maintenance_message or "System is under maintenance. Please try again later."
            )
        return user

    # Check if user exists by email
    user = db.query(User).filter(User.email == email).first()
    if user:
        # Block non-admin users during maintenance
        if is_maintenance and user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=maintenance_message or "System is under maintenance. Please try again later."
            )
        # Link Google ID to existing user
        user.google_id = google_id
        if not user.avatar_url and avatar_url:
            user.avatar_url = avatar_url
        db.commit()
        db.refresh(user)
        return user

    # Block new user registration during maintenance
    if is_maintenance:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=maintenance_message or "System is under maintenance. Please try again later."
        )

    # Create new user
    user = User(
        name=name,
        email=email,
        google_id=google_id,
        avatar_url=avatar_url
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
