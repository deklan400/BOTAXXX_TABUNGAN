from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TelegramLoginRequest
from app.core.security import hash_password, verify_password, create_access_token


def register_user(db: Session, request: RegisterRequest) -> User:
    """Register a new user"""
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
    """Login user via Telegram ID"""
    user = db.query(User).filter(User.telegram_id == request.telegram_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Telegram ID not found. Please register in the dashboard first and set your Telegram ID."
        )

    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


def get_or_create_google_user(db: Session, google_id: str, email: str, name: str, avatar_url: str = None) -> User:
    """Get or create user from Google OAuth"""
    # Check if user exists by Google ID
    user = db.query(User).filter(User.google_id == google_id).first()
    if user:
        return user

    # Check if user exists by email
    user = db.query(User).filter(User.email == email).first()
    if user:
        # Link Google ID to existing user
        user.google_id = google_id
        if not user.avatar_url and avatar_url:
            user.avatar_url = avatar_url
        db.commit()
        db.refresh(user)
        return user

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
