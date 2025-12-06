from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import date
from typing import Optional


class SavingsBase(BaseModel):
    id: int
    user_id: int
    date: date
    type: str
    category: Optional[str] = None
    amount: float
    note: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SavingsCreateRequest(BaseModel):
    date: date
    type: str  # IN or OUT
    category: Optional[str] = None
    amount: float = Field(gt=0, description="Amount must be greater than 0")
    note: Optional[str] = None

    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        if v not in ['IN', 'OUT']:
            raise ValueError("Type must be 'IN' or 'OUT'")
        return v


class SavingsUpdateRequest(BaseModel):
    date: Optional[date] = None
    type: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = Field(default=None, gt=0, description="Amount must be greater than 0")
    note: Optional[str] = None

    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        if v is not None and v not in ['IN', 'OUT']:
            raise ValueError("Type must be 'IN' or 'OUT'")
        return v


class BalanceResponse(BaseModel):
    total_balance: float
    total_income: float
    total_expense: float
