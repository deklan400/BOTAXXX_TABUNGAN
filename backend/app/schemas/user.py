from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    id: int
    name: str
    email: EmailStr
    telegram_id: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str = "user"
    is_active: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None


class UpdateTelegramIDRequest(BaseModel):
    telegram_id: str


class TelegramIDBase(BaseModel):
    id: int
    telegram_id: str
    telegram_username: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AddTelegramIDRequest(BaseModel):
    telegram_id: str
    telegram_username: Optional[str] = None
