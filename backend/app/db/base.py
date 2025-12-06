from app.models.user import User
from app.models.savings import Savings
from app.models.loan import Loan
from app.models.target import Target
from app.models.loan import LoanPayment

from app.db.session import engine
from app.db.session import SessionLocal
from app.core.config import settings
from sqlalchemy.orm import declarative_base

Base = declarative_base()

