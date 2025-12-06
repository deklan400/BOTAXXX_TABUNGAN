from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.models.savings import Savings
from app.models.loan import Loan, LoanPayment
from app.models.target import Target
from app.utils.jwt import get_current_user
from app.db.session import get_db

router = APIRouter()


@router.get("/")
def get_overview(db: Session = Depends(get_db), user=Depends(get_current_user)):

    # Total balance
    total_in = db.query(func.sum(Savings.amount)).filter(
        Savings.user_id == user.id,
        Savings.type == "IN"
    ).scalar() or 0

    total_out = db.query(func.sum(Savings.amount)).filter(
        Savings.user_id == user.id,
        Savings.type == "OUT"
    ).scalar() or 0

    total_balance = total_in - total_out

    # ACTIVE LOANS
    active_loans = db.query(Loan).filter(
        Loan.user_id == user.id,
        Loan.status == "active"
    ).all()

    total_loans_active = 0
    for loan in active_loans:
        payments = sum([p.amount for p in loan.payments])
        total_loans_active += max(loan.principal - payments, 0)

    # TARGET TOTAL
    total_target_amount = db.query(func.sum(Target.current_amount)).filter(
        Target.user_id == user.id,
        Target.status == "active"
    ).scalar() or 0

    return {
        "total_balance": total_balance,
        "total_loans_active": total_loans_active,
        "total_targets_amount": total_target_amount,
        "total_income_month": 0,  # bisa diisi nanti
        "total_expense_month": 0  # bisa diisi nanti
    }

