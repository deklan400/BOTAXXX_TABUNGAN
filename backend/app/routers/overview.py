from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, date, timedelta
from typing import List, Dict

from app.models.savings import Savings
from app.models.loan import Loan
from app.models.target import Target
from app.utils.jwt import get_current_user
from app.db.session import get_db
from app.services.savings_service import get_balance
from app.services.loans_service import get_total_active_loans_amount
from app.services.targets_service import get_total_target_current_amount
from app.utils.calculations import get_monthly_summary
from app.core.logging_config import app_logger

router = APIRouter()


@router.get("/")
def get_overview(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Get financial overview for the current user"""
    try:
        # Total balance from savings
        balance_info = get_balance(db, user.id)
        total_balance = balance_info["total_balance"]

        # Total active loans amount
        total_active_loans_amount = get_total_active_loans_amount(db, user.id)

        # Total target current amount
        total_target_current_amount = get_total_target_current_amount(db, user.id)

        # Monthly income and expense (current month)
        now = datetime.now()
        monthly_info = get_monthly_summary(db, user.id, now.year, now.month)
        total_income_month = monthly_info["income"]
        total_expense_month = monthly_info["expense"]

        # Get last 6 months summary for chart
        monthly_summaries = []
        for i in range(6):
            month = now.month - i
            year = now.year
            if month <= 0:
                month += 12
                year -= 1
            monthly_info = get_monthly_summary(db, user.id, year, month)
            monthly_summaries.append({
                "month": month,
                "year": year,
                "income": monthly_info["income"],
                "expense": monthly_info["expense"],
                "net": monthly_info["net"]
            })
        monthly_summaries.reverse()

        # Daily trend (last 7 days)
        daily_trend = []
        for i in range(7):
            day = date.today() - timedelta(days=6-i)
            day_savings = db.query(Savings).filter(
                Savings.user_id == user.id,
                Savings.date == day
            ).all()
            day_income = sum(s.amount for s in day_savings if s.type == "IN")
            day_expense = sum(s.amount for s in day_savings if s.type == "OUT")
            daily_trend.append({
                "date": day.isoformat(),
                "income": day_income,
                "expense": day_expense,
                "net": day_income - day_expense
            })

        return {
            "total_balance": total_balance,
            "total_active_loans_amount": total_active_loans_amount,
            "total_target_current_amount": total_target_current_amount,
            "total_income_month": total_income_month,
            "total_expense_month": total_expense_month,
            "monthly_summaries": monthly_summaries,
            "daily_trend": daily_trend
        }
    except Exception as e:
        app_logger.error(f"Overview error for user {user.id}: {str(e)}", exc_info=True)
        raise
