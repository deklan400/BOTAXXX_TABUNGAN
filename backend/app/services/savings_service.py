from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List
from app.models.savings import Savings
from app.schemas.savings import SavingsCreateRequest, SavingsUpdateRequest
from app.utils.calculations import calculate_savings_balance


def create_savings(db: Session, user_id: int, request: SavingsCreateRequest) -> Savings:
    """Create a new savings transaction"""
    # Validation is handled by Pydantic schema
    savings = Savings(
        user_id=user_id,
        date=request.date,
        type=request.type,
        category=request.category,
        amount=request.amount,
        note=request.note
    )
    db.add(savings)
    db.commit()
    db.refresh(savings)
    return savings


def get_savings(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Savings]:
    """Get all savings transactions for a user"""
    return db.query(Savings).filter(
        Savings.user_id == user_id
    ).order_by(Savings.date.desc()).offset(skip).limit(limit).all()


def get_savings_by_id(db: Session, savings_id: int, user_id: int) -> Savings:
    """Get a specific savings transaction"""
    savings = db.query(Savings).filter(
        Savings.id == savings_id,
        Savings.user_id == user_id
    ).first()
    if not savings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Savings transaction not found"
        )
    return savings


def update_savings(
    db: Session,
    savings_id: int,
    user_id: int,
    request: SavingsUpdateRequest
) -> Savings:
    """Update a savings transaction"""
    savings = get_savings_by_id(db, savings_id, user_id)

    if request.date is not None:
        savings.date = request.date
    if request.type is not None:
        # Validation is handled by Pydantic schema
        savings.type = request.type
    if request.category is not None:
        savings.category = request.category
    if request.amount is not None:
        savings.amount = request.amount
    if request.note is not None:
        savings.note = request.note

    db.commit()
    db.refresh(savings)
    return savings


def delete_savings(db: Session, savings_id: int, user_id: int) -> None:
    """Delete a savings transaction"""
    savings = get_savings_by_id(db, savings_id, user_id)
    db.delete(savings)
    db.commit()


def get_balance(db: Session, user_id: int) -> dict:
    """Get balance information for a user"""
    return calculate_savings_balance(db, user_id)
