from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.user import UserBase, UpdateUserRequest, UpdateTelegramIDRequest
from app.db.session import get_db
from app.models.user import User
from app.utils.jwt import get_current_user

router = APIRouter()

@router.get("/me", response_model=UserBase)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserBase)
def update_me(data: UpdateUserRequest,
              db: Session = Depends(get_db),
              current_user: User = Depends(get_current_user)):

    if data.name:
        current_user.name = data.name

    if data.avatar_url:
        current_user.avatar_url = data.avatar_url

    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/telegram-id")
def update_telegram(data: UpdateTelegramIDRequest,
                    db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    
    # Cek kalau Telegram ID sudah dipakai user lain
    existing = db.query(User).filter(User.telegram_id == data.telegram_id).first()
    if existing and existing.id != current_user.id:
        raise HTTPException(status_code=400, detail="Telegram ID already used")

    current_user.telegram_id = data.telegram_id
    db.commit()
    return {"success": True, "telegram_id": data.telegram_id}

