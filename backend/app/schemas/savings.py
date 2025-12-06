from pydantic import BaseModel
from datetime import date
from typing import Optional

class SavingsBase(BaseModel):
    id: int
    date: date
    type: str
    category: str
    amount: float
    note: Optional[str]

    class Config:
        orm_mode = True

class SavingsCreateRequest(BaseModel):
    date: date
    type: str
    category: str
    amount: float
    note: Optional[str] = None

class SavingsUpdateRequest(BaseModel):
    date: date
    type: str
    category: str
    amount: float
    note: Optional[str] = None

