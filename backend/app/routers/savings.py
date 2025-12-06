from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.schemas.savings import (
    SavingsBase,
    SavingsCreateRequest,
    SavingsUpdateRequest,
    BalanceResponse
)
from app.services.savings_service import (
    create_savings,
    get_savings,
    get_savings_by_id,
    update_savings,
    delete_savings,
    get_balance,
)
from app.utils.jwt import get_current_user
from app.db.session import get_db
from app.core.logging_config import app_logger

router = APIRouter()


@router.get("/", response_model=List[SavingsBase])
def list_savings(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """List all savings transactions for the current user"""
    try:
        return get_savings(db, user.id, skip, limit)
    except Exception as e:
        app_logger.error(f"List savings error for user {user.id}: {str(e)}", exc_info=True)
        raise


@router.post("/", response_model=SavingsBase, status_code=status.HTTP_201_CREATED)
def create_savings_endpoint(
    data: SavingsCreateRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Create a new savings transaction"""
    try:
        savings = create_savings(db, user.id, data)
        app_logger.info(f"Savings created: {savings.id} by user {user.id}")
        return savings
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Create savings error for user {user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create savings transaction"
        )


@router.get("/{savings_id}", response_model=SavingsBase)
def get_savings_endpoint(
    savings_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Get a specific savings transaction"""
    return get_savings_by_id(db, savings_id, user.id)


@router.put("/{savings_id}", response_model=SavingsBase)
def update_savings_endpoint(
    savings_id: int,
    data: SavingsUpdateRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Update a savings transaction"""
    try:
        return update_savings(db, savings_id, user.id, data)
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Update savings error for user {user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update savings transaction"
        )


@router.delete("/{savings_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_savings_endpoint(
    savings_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Delete a savings transaction"""
    try:
        delete_savings(db, savings_id, user.id)
        app_logger.info(f"Savings deleted: {savings_id} by user {user.id}")
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Delete savings error for user {user.id}: {str(e)}", exc_info=True)
        raise


@router.get("/balance", response_model=BalanceResponse)
def get_balance_endpoint(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Get balance information for the current user"""
    try:
        balance_info = get_balance(db, user.id)
        return BalanceResponse(**balance_info)
    except Exception as e:
        app_logger.error(f"Get balance error for user {user.id}: {str(e)}", exc_info=True)
        raise
