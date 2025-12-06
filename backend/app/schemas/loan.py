from pydantic import BaseModel
from datetime import date
from typing import Optional, List

class LoanPaymentBase(BaseModel):
    id: int
    date: date
    amount: float
    note: Optional[str]

    class Config:
        orm_mode = True

class LoanBase(BaseModel):
    id: int
    borrower_name: str
    principal: float
    start_date: date
    due_date: Optional[date]
    status: str
    note: Optional[str]
    remaining_amount: float
    payments: List[LoanPaymentBase] = []

    class Config:
        orm_mode = True

class LoanCreateRequest(BaseModel):
    borrower_name: str
    principal: float
    start_date: date
    due_date: Optional[date]
    note: Optional[str]

class LoanUpdateRequest(BaseModel):
    borrower_name: Optional[str]
    principal: Optional[float]
    start_date: Optional[date]
    due_date: Optional[date]
    status: Optional[str]
    note: Optional[str]

class LoanPaymentCreateRequest(BaseModel):
    date: date
    amount: float
    note: Optional[str]

