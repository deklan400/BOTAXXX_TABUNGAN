from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import date
from typing import Optional


class TargetBase(BaseModel):
    id: int
    user_id: int
    name: str
    target_amount: float
    current_amount: float
    deadline: Optional[date] = None
    status: str
    note: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TargetCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    target_amount: float = Field(gt=0, description="Target amount must be greater than 0")
    current_amount: float = Field(default=0.0, ge=0, description="Current amount must be non-negative")
    deadline: Optional[date] = None
    note: Optional[str] = None


class TargetUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    target_amount: Optional[float] = Field(default=None, gt=0, description="Target amount must be greater than 0")
    current_amount: Optional[float] = Field(default=None, ge=0, description="Current amount must be non-negative")
    deadline: Optional[date] = None
    status: Optional[str] = None
    note: Optional[str] = None

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        if v is not None and v not in ['active', 'done']:
            raise ValueError("Status must be 'active' or 'done'")
        return v
