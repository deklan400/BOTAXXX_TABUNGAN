from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.auth import RegisterRequest, LoginRequest, TelegramLoginRequest, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.db.session import get_db

router = APIRouter()

# REGISTER
@router.post("/register", response_model=dict)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "Registered successfully"}

# LOGIN EMAIL/PASSWORD
@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash or ""):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)

# TELEGRAM LOGIN
@router.post("/telegram-login", response_model=TokenResponse)
def telegram_login(data: TelegramLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.telegram_id == data.telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Telegram ID not registered")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)

