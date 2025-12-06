from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.utils.jwt import get_current_user
from app.schemas.loan import (
    LoanBase,
    LoanCreateRequest,
    LoanUpdateRequest,
    LoanPaymentCreateRequest,
    LoanPaymentBase,
)
from app.services.loans_service import (
    create_loan,
    get_loans,
    get_loan_by_id,
    update_loan,
    delete_loan,
    add_payment,
    get_payments,
)
from app.core.logging_config import app_logger

router = APIRouter()


@router.get("/", response_model=List[LoanBase])
def list_loans(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """List all loans for the current user"""
    try:
        loans = get_loans(db, user.id, skip, limit)
        if status_filter:
            loans = [loan for loan in loans if loan.status == status_filter]
        return loans
    except Exception as e:
        app_logger.error(f"List loans error for user {user.id}: {str(e)}", exc_info=True)
        raise


@router.post("/", response_model=LoanBase, status_code=status.HTTP_201_CREATED)
def create_loan_endpoint(
    data: LoanCreateRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Create a new loan"""
    try:
        loan = create_loan(db, user.id, data)
        app_logger.info(f"Loan created: {loan.id} by user {user.id}")
        return loan
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Create loan error for user {user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create loan"
        )


@router.get("/{loan_id}", response_model=LoanBase)
def get_loan_endpoint(
    loan_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Get a specific loan"""
    return get_loan_by_id(db, loan_id, user.id)


@router.put("/{loan_id}", response_model=LoanBase)
def update_loan_endpoint(
    loan_id: int,
    data: LoanUpdateRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Update a loan"""
    try:
        return update_loan(db, loan_id, user.id, data)
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Update loan error for user {user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update loan"
        )


@router.delete("/{loan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_loan_endpoint(
    loan_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Delete a loan"""
    try:
        delete_loan(db, loan_id, user.id)
        app_logger.info(f"Loan deleted: {loan_id} by user {user.id}")
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Delete loan error for user {user.id}: {str(e)}", exc_info=True)
        raise


@router.post("/{loan_id}/payments", response_model=LoanPaymentBase, status_code=status.HTTP_201_CREATED)
def add_payment_endpoint(
    loan_id: int,
    data: LoanPaymentCreateRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Add a payment to a loan"""
    try:
        payment = add_payment(db, loan_id, user.id, data)
        app_logger.info(f"Payment added to loan {loan_id} by user {user.id}")
        return payment
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Add payment error for user {user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add payment"
        )


@router.get("/{loan_id}/payments", response_model=List[LoanPaymentBase])
def get_payments_endpoint(
    loan_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Get all payments for a loan"""
    try:
        payments = get_payments(db, loan_id, user.id)
        return payments
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Get payments error for user {user.id}: {str(e)}", exc_info=True)
        raise
