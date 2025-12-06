from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import Base

class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    borrower_name = Column(String)
    principal = Column(Float)
    start_date = Column(Date)
    due_date = Column(Date, nullable=True)
    status = Column(String, default="active")  # active / paid / overdue
    note = Column(String)

    payments = relationship("LoanPayment", back_populates="loan")

class LoanPayment(Base):
    __tablename__ = "loan_payments"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"))
    date = Column(Date)
    amount = Column(Float)
    note = Column(String)

    loan = relationship("Loan", back_populates="payments")

