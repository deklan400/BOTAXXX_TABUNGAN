from app.schemas.auth import RegisterRequest, LoginRequest, TelegramLoginRequest, TokenResponse
from app.schemas.user import UserBase, UpdateUserRequest, UpdateTelegramIDRequest
from app.schemas.savings import SavingsBase, SavingsCreateRequest, SavingsUpdateRequest, BalanceResponse
from app.schemas.loan import (
    LoanBase, LoanCreateRequest, LoanUpdateRequest,
    LoanPaymentBase, LoanPaymentCreateRequest
)
from app.schemas.target import TargetBase, TargetCreateRequest, TargetUpdateRequest

__all__ = [
    "RegisterRequest", "LoginRequest", "TelegramLoginRequest", "TokenResponse",
    "UserBase", "UpdateUserRequest", "UpdateTelegramIDRequest",
    "SavingsBase", "SavingsCreateRequest", "SavingsUpdateRequest", "BalanceResponse",
    "LoanBase", "LoanCreateRequest", "LoanUpdateRequest",
    "LoanPaymentBase", "LoanPaymentCreateRequest",
    "TargetBase", "TargetCreateRequest", "TargetUpdateRequest",
]
