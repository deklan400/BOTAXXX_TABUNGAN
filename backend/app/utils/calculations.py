from typing import List
from datetime import date
from sqlalchemy.orm import Session
from app.models.savings import Savings
from app.models.loan import Loan, LoanPayment
from app.models.target import Target


def calculate_savings_balance(db: Session, user_id: int) -> dict:
    """Calculate total balance, income, and expense for a user"""
    savings = db.query(Savings).filter(Savings.user_id == user_id).all()

    total_income = sum(s.amount for s in savings if s.type == "IN")
    total_expense = sum(s.amount for s in savings if s.type == "OUT")
    total_balance = total_income - total_expense

    return {
        "total_balance": total_balance,
        "total_income": total_income,
        "total_expense": total_expense,
    }


def calculate_loan_remaining(db: Session, loan_id: int) -> float:
    """Calculate remaining amount for a loan"""
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        return 0.0

    total_payments = sum(p.amount for p in loan.payments)
    remaining = loan.principal - total_payments
    return max(0.0, remaining)


def update_loan_status(db: Session, loan_id: int) -> None:
    """Update loan status based on remaining amount"""
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        return

    remaining = calculate_loan_remaining(db, loan_id)
    if remaining <= 0 and loan.status != "paid":
        loan.status = "paid"
    elif remaining > 0 and loan.status == "paid":
        loan.status = "active"

    db.commit()


def update_target_status(db: Session, target_id: int) -> None:
    """Update target status based on current_amount vs target_amount"""
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        return

    if target.current_amount >= target.target_amount and target.status != "done":
        target.status = "done"
    elif target.current_amount < target.target_amount and target.status == "done":
        target.status = "active"

    db.commit()


def get_monthly_summary(db: Session, user_id: int, year: int, month: int) -> dict:
    """Get monthly income and expense summary"""
    from sqlalchemy import extract

    savings = db.query(Savings).filter(
        Savings.user_id == user_id,
        extract("year", Savings.date) == year,
        extract("month", Savings.date) == month
    ).all()

    income = sum(s.amount for s in savings if s.type == "IN")
    expense = sum(s.amount for s in savings if s.type == "OUT")

    return {
        "month": month,
        "year": year,
        "income": income,
        "expense": expense,
        "net": income - expense,
    }
