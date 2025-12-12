from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


# Bank Master Data Schemas
class BankBase(BaseModel):
    id: int
    name: str
    code: str
    logo_filename: Optional[str] = None
    brand_color: Optional[str] = None
    country: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


# Bank Account Schemas
class BankAccountBase(BaseModel):
    id: int
    user_id: int
    bank_id: int
    account_holder_name: str
    account_number: str
    is_active: bool
    is_primary: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BankAccountResponse(BankAccountBase):
    bank: BankBase


class BankAccountCreateRequest(BaseModel):
    bank_id: int
    account_holder_name: str
    account_number: str
    is_primary: Optional[bool] = False


class BankAccountUpdateRequest(BaseModel):
    bank_id: Optional[int] = None
    account_holder_name: Optional[str] = None
    account_number: Optional[str] = None
    is_active: Optional[bool] = None
    is_primary: Optional[bool] = None


class BankListResponse(BaseModel):
    banks: List[BankBase]


class BankAccountListResponse(BaseModel):
    bank_accounts: List[BankAccountResponse]

