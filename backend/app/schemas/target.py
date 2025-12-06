from pydantic import BaseModel
from datetime import date
from typing import Optional

class TargetBase(BaseModel):
    id: int
    name: str
    target_amount: float
    current_amount: float
    deadline: Optional[date]
    status: str
    note: Optional[str]

    class Config:
        orm_mode = True

class TargetCreateRequest(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0
    deadline: Optional[date]
    note: Optional[str] = None

class TargetUpdateRequest(BaseModel):
    name: Optional[str]
    target_amount: Optional[float]
    current_amount: Optional[float]
    deadline: Optional[date]
    status: Optional[str]
    note: Optional[str]

