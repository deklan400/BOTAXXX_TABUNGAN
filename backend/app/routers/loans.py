from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.utils.jwt import get_current_user
from app.models.loan import Loan, LoanPayment
from app.schemas.loan import (
    LoanBase,
    LoanCreateRequest,
    LoanUpdateRequest,
    LoanPaymentCreateRequest,
    LoanPaymentBase,
)

router = APIRouter()


def _calc_remaining_amount(db: Session, loan: Loan) -> float:
    total_paid = db.query(func.sum(LoanPayment.amount)).filter(
        LoanPayment.loan_id == loan.id
    ).scalar() or 0
    remaining = max(loan.principal - total_paid, 0)
    return remaining


def _loan_to_schema(db: Session, loan: Loan) -> LoanBase:
    remaining = _calc_remaining_amount(db, loan)
    payments = [
        LoanPaymentBase.from_orm(p)
        for p in sorted(loan.payments, key=lambda x: x.date)
    ]
    return LoanBase(
        id=loan.id,
        borrower_name=loan.borrower_name,
        principal=loan.principal,
        start_date=loan.start_date,
        due_date=loan.due_date,
        status=loan.status,
        note=loan.note,
        remaining_amount=remaining,
        payments=payments,
    )


@router.get("/", response_model=list[LoanBase])
def list_loans(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    status: str | None = None,
):
    query = db.query(Loan).filter(Loan.user_id == user.id)
    if status:
        query = query.filter(Loan.status == status)

    loans = query.order_by(Loan.start_date.desc()).all()
    return [_loan_to_schema(db, loan) for loan in loans]


@router.post("/", response_model=LoanBase)
def create_loan(
    data: LoanCreateRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    loan = Loan(
        user_id=user.id,
        borrower_name=data.borrower_name,
        principal=data.principal,
        start_date=data.start_date,
        due_date=data.due_date,
        note=data.note,
        status="active",
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return _loan_to_schema(db, loan)


@router.get("/{loan_id}", response_model=LoanBase)
def get_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    loan = (
        db.query(Loan)
        .filter(Loan.id == loan_id, Loan.user_id == user.id)
        .first()
    )
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    return _loan_to_schema(db, loan)


@router.put("/{loan_id}", response_model=LoanBase)
def update_loan(
    loan_id: int,
    data: LoanUpdateRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    loan = (
        db.query(Loan)
        .filter(Loan.id == loan_id, Loan.user_id == user.id)
        .first()
    )
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    for key, value in data.dict(exclude_unset=True)_

