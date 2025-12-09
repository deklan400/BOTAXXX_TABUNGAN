from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import all models to ensure they are registered with Base
# This must be done after Base is created
from app.models import User, Savings, Loan, LoanPayment, Target, UserTelegramID  # noqa: F401, E402