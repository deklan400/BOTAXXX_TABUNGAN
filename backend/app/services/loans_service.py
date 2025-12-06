from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List
from datetime import date
from app.models.loan import Loan, LoanPayment
from app.schemas.loan import LoanCreateRequest, LoanUpdateRequest, LoanPaymentCreateRequest
from app.utils.calculations import calculate_loan_remaining, update_loan_status


def create_loan(db: Session, user_id: int, request: LoanCreateRequest) -> Loan:
    """Create a new loan"""
    loan = Loan(
        user_id=user_id,
        borrower_name=request.borrower_name,
        principal=request.principal,
        start_date=request.start_date,
        due_date=request.due_date,
        note=request.note,
        status="active"
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan


def get_loans(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Loan]:
    """Get all loans for a user"""
    loans = db.query(Loan).filter(
        Loan.user_id == user_id
    ).order_by(Loan.start_date.desc()).offset(skip).limit(limit).all()

    # Calculate remaining amount for each loan
    for loan in loans:
        loan.remaining_amount = calculate_loan_remaining(db, loan.id)

    return loans


def get_loan_by_id(db: Session, loan_id: int, user_id: int) -> Loan:
    """Get a specific loan"""
    loan = db.query(Loan).filter(
        Loan.id == loan_id,
        Loan.user_id == user_id
    ).first()
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found"
        )

    loan.remaining_amount = calculate_loan_remaining(db, loan_id)
    return loan


def update_loan(
    db: Session,
    loan_id: int,
    user_id: int,
    request: LoanUpdateRequest
) -> Loan:
    """Update a loan"""
    loan = get_loan_by_id(db, loan_id, user_id)

    if request.borrower_name is not None:
        loan.borrower_name = request.borrower_name
    if request.principal is not None:
        loan.principal = request.principal
    if request.start_date is not None:
        loan.start_date = request.start_date
    if request.due_date is not None:
        loan.due_date = request.due_date
    if request.status is not None:
        if request.status not in ["active", "paid", "overdue"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be 'active', 'paid', or 'overdue'"
            )
        loan.status = request.status
    if request.note is not None:
        loan.note = request.note

    db.commit()
    db.refresh(loan)
    loan.remaining_amount = calculate_loan_remaining(db, loan_id)
    return loan


def delete_loan(db: Session, loan_id: int, user_id: int) -> None:
    """Delete a loan"""
    loan = get_loan_by_id(db, loan_id, user_id)
    db.delete(loan)
    db.commit()


def add_payment(
    db: Session,
    loan_id: int,
    user_id: int,
    request: LoanPaymentCreateRequest
) -> LoanPayment:
    """Add a payment to a loan"""
    loan = get_loan_by_id(db, loan_id, user_id)

    payment = LoanPayment(
        loan_id=loan_id,
        date=request.date,
        amount=request.amount,
        note=request.note
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    # Update loan status based on remaining amount
    update_loan_status(db, loan_id)

    return payment


def get_payments(db: Session, loan_id: int, user_id: int) -> List[LoanPayment]:
    """Get all payments for a loan"""
    loan = get_loan_by_id(db, loan_id, user_id)
    return loan.payments


def get_total_active_loans_amount(db: Session, user_id: int) -> float:
    """Get total amount of active loans"""
    loans = db.query(Loan).filter(
        Loan.user_id == user_id,
        Loan.status == "active"
    ).all()

    total = 0.0
    for loan in loans:
        remaining = calculate_loan_remaining(db, loan.id)
        total += remaining

    return total
