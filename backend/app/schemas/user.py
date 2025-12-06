from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    id: int
    name: str
    email: EmailStr
    telegram_id: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True

class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None

class UpdateTelegramIDRequest(BaseModel):
    telegram_id: str

