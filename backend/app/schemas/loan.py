from pydantic import BaseModel, ConfigDict, Field, model_validator
from datetime import date
from typing import Optional, List


class LoanPaymentBase(BaseModel):
    id: int
    loan_id: int
    date: date
    amount: float
    note: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class LoanBase(BaseModel):
    id: int
    user_id: int
    borrower_name: str
    principal: float
    start_date: date
    due_date: Optional[date] = None
    status: str
    note: Optional[str] = None
    remaining_amount: float
    payments: List[LoanPaymentBase] = []

    model_config = ConfigDict(from_attributes=True)


class LoanCreateRequest(BaseModel):
    borrower_name: str = Field(min_length=1, max_length=200)
    principal: float = Field(gt=0, description="Principal amount must be greater than 0")
    start_date: date
    due_date: Optional[date] = None
    note: Optional[str] = None

    @model_validator(mode='after')
    def validate_due_date(self):
        if self.due_date and self.start_date and self.due_date < self.start_date:
            raise ValueError("Due date must be after start date")
        return self


class LoanUpdateRequest(BaseModel):
    borrower_name: Optional[str] = None
    principal: Optional[float] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    note: Optional[str] = None


class LoanPaymentCreateRequest(BaseModel):
    date: date
    amount: float = Field(gt=0, description="Payment amount must be greater than 0")
    note: Optional[str] = None
