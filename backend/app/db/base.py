from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import all models to ensure they are registered with Base
# This must be done after Base is created to avoid circular imports
def import_models():
    """Import all models to register them with SQLAlchemy Base"""
    try:
        from app.models.user import User  # noqa: F401
        from app.models.savings import Savings  # noqa: F401
        from app.models.loan import Loan, LoanPayment  # noqa: F401
        from app.models.target import Target  # noqa: F401
        from app.models.user_telegram import UserTelegramID  # noqa: F401
        from app.models.bank import Bank, BankAccount  # noqa: F401
    except ImportError as e:
        # Silently fail if models not yet available (during initial setup)
        pass

# Auto-import models when base is imported
import_models()