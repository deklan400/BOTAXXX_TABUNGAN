from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.user import UserBase, UpdateUserRequest, UpdateTelegramIDRequest
from app.utils.jwt import get_current_user
from app.models.user import User
from app.db.session import get_db

router = APIRouter()

# GET PROFILE
@router.get("/me", response_model=UserBase)
def get_profile(user: User = Depends(get_current_user)):
    return user

# UPDATE PROFILE
@router.put("/me", response_model=UserBase)
def update_profile(
    data: UpdateUserRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if data.name:
        user.name = data.name

    if data.avatar_url:
        user.avatar_url = data.avatar_url

    db.commit()
    db.refresh(user)
    return user

# UPDATE TELEGRAM ID
@router.put("/me/telegram-id")
def update_telegram(
    data: UpdateTelegramIDRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    existing = db.query(User).filter(User.telegram_id == data.telegram_id).first()

    if existing and existing.id != user.id:
        raise HTTPException(status_code=400, detail="Telegram ID already used")

    user.telegram_id = data.telegram_id
    db.commit()
    return {"success": True, "telegram_id": data.telegram_id}
