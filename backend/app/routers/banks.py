from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.schemas.bank import (
    BankBase,
    BankAccountResponse,
    BankAccountCreateRequest,
    BankAccountUpdateRequest,
    BankListResponse,
    BankAccountListResponse
)
from app.services.banks_service import (
    get_all_banks,
    get_bank_by_id,
    create_bank_account,
    get_bank_accounts,
    get_bank_account_by_id,
    update_bank_account,
    delete_bank_account,
)
from app.utils.jwt import get_current_user
from app.db.session import get_db
from app.core.logging_config import app_logger

router = APIRouter()


# Bank Master Data Endpoints
@router.get("/banks", response_model=BankListResponse)
def list_banks(
    country: str = Query(None, description="Filter by country code (e.g., 'ID', 'KH')"),
    db: Session = Depends(get_db)
):
    """Get list of all available banks"""
    try:
        banks = get_all_banks(db, country)
        return BankListResponse(banks=banks)
    except Exception as e:
        app_logger.error(f"List banks error: {str(e)}", exc_info=True)
        raise


@router.get("/banks/{bank_id}", response_model=BankBase)
def get_bank(
    bank_id: int,
    db: Session = Depends(get_db)
):
    """Get bank details by ID"""
    try:
        return get_bank_by_id(db, bank_id)
    except Exception as e:
        app_logger.error(f"Get bank error: {str(e)}", exc_info=True)
        raise


# Bank Account Endpoints
@router.get("/accounts", response_model=BankAccountListResponse)
def list_bank_accounts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """List all bank accounts for the current user"""
    try:
        accounts = get_bank_accounts(db, user.id, skip, limit)
        return BankAccountListResponse(bank_accounts=accounts)
    except Exception as e:
        app_logger.error(f"List bank accounts error for user {user.id}: {str(e)}", exc_info=True)
        raise


@router.post("/accounts", response_model=BankAccountResponse, status_code=status.HTTP_201_CREATED)
def create_bank_account_endpoint(
    data: BankAccountCreateRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Create a new bank account"""
    try:
        account = create_bank_account(db, user.id, data)
        db.refresh(account)  # Refresh to load bank relationship
        app_logger.info(f"Bank account created: {account.id} by user {user.id}")
        return account
    except Exception as e:
        app_logger.error(f"Create bank account error for user {user.id}: {str(e)}", exc_info=True)
        raise


@router.get("/accounts/{account_id}", response_model=BankAccountResponse)
def get_bank_account(
    account_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Get a specific bank account"""
    try:
        account = get_bank_account_by_id(db, account_id, user.id)
        return account
    except Exception as e:
        app_logger.error(f"Get bank account error: {str(e)}", exc_info=True)
        raise


@router.put("/accounts/{account_id}", response_model=BankAccountResponse)
def update_bank_account_endpoint(
    account_id: int,
    data: BankAccountUpdateRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Update a bank account"""
    try:
        account = update_bank_account(db, account_id, user.id, data)
        app_logger.info(f"Bank account updated: {account_id} by user {user.id}")
        return account
    except Exception as e:
        app_logger.error(f"Update bank account error: {str(e)}", exc_info=True)
        raise


@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bank_account_endpoint(
    account_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Delete (soft delete) a bank account"""
    try:
        delete_bank_account(db, account_id, user.id)
        app_logger.info(f"Bank account deleted: {account_id} by user {user.id}")
        return None
    except Exception as e:
        app_logger.error(f"Delete bank account error: {str(e)}", exc_info=True)
        raise

