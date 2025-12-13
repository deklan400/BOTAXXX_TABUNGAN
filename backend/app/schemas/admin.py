"""
Admin Schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

from app.schemas.user import UserBase


class UserListResponse(BaseModel):
    users: List[UserBase]
    total: int
    skip: int
    limit: int


class UserDetailResponse(UserBase):
    pass


class UserSuspendRequest(BaseModel):
    suspend: bool = Field(..., description="True to suspend, False to unsuspend")


class MaintenanceModeRequest(BaseModel):
    enabled: bool = Field(..., description="Enable or disable maintenance mode")
    message: Optional[str] = Field(None, description="Maintenance message to display")


class MaintenanceModeResponse(BaseModel):
    is_maintenance: bool
    message: str


class BroadcastAlertRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000, description="Alert message to broadcast")
    title: Optional[str] = Field(None, max_length=200, description="Alert title")


class SendAlertToUserRequest(BaseModel):
    user_id: int = Field(..., description="User ID to send alert to")
    message: str = Field(..., min_length=1, max_length=1000, description="Alert message")
    title: Optional[str] = Field(None, max_length=200, description="Alert title")


class BankLogoUpdateRequest(BaseModel):
    brand_color: Optional[str] = Field(None, description="Bank brand color (hex)")
    logo_background: Optional[str] = Field(None, description="Logo background color (hex)")
    logo_size_width: Optional[int] = Field(None, description="Logo width in pixels")
    logo_size_height: Optional[int] = Field(None, description="Logo height in pixels")
    is_active: Optional[bool] = Field(None, description="Bank active status")


class BankCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Bank name")
    code: str = Field(..., min_length=1, max_length=50, description="Bank code (for logo filename)")
    country: str = Field(default="ID", description="Country code")
    brand_color: Optional[str] = Field(None, description="Bank brand color (hex)")
    logo_background: Optional[str] = Field(None, description="Logo background color (hex)")
    logo_size_width: Optional[int] = Field(None, description="Logo width in pixels")
    logo_size_height: Optional[int] = Field(None, description="Logo height in pixels")


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    suspended_users: int
    admin_users: int

