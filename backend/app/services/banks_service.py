from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List
from app.models.bank import Bank, BankAccount
from app.schemas.bank import (
    BankAccountCreateRequest,
    BankAccountUpdateRequest
)


# Bank Master Data Functions
def get_all_banks(db: Session, country: str = None) -> List[Bank]:
    """Get all active banks, optionally filtered by country"""
    query = db.query(Bank).filter(Bank.is_active == True)
    if country:
        query = query.filter(Bank.country == country)
    return query.order_by(Bank.name).all()


def get_bank_by_id(db: Session, bank_id: int) -> Bank:
    """Get a specific bank by ID"""
    bank = db.query(Bank).filter(Bank.id == bank_id, Bank.is_active == True).first()
    if not bank:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank not found"
        )
    return bank


# Bank Account Functions
def create_bank_account(
    db: Session,
    user_id: int,
    request: BankAccountCreateRequest
) -> BankAccount:
    """Create a new bank account for user"""
    # Verify bank exists
    bank = get_bank_by_id(db, request.bank_id)
    
    # If setting as primary, unset other primary accounts
    if request.is_primary:
        db.query(BankAccount).filter(
            BankAccount.user_id == user_id,
            BankAccount.is_primary == True
        ).update({"is_primary": False})
    
    bank_account = BankAccount(
        user_id=user_id,
        bank_id=request.bank_id,
        account_holder_name=request.account_holder_name,
        account_number=request.account_number,
        is_primary=request.is_primary or False
    )
    
    db.add(bank_account)
    db.commit()
    db.refresh(bank_account)
    return bank_account


def get_bank_accounts(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[BankAccount]:
    """Get all bank accounts for a user"""
    return db.query(BankAccount).filter(
        BankAccount.user_id == user_id,
        BankAccount.is_active == True
    ).order_by(
        BankAccount.is_primary.desc(),
        BankAccount.created_at.desc()
    ).offset(skip).limit(limit).all()


def get_bank_account_by_id(
    db: Session,
    bank_account_id: int,
    user_id: int
) -> BankAccount:
    """Get a specific bank account"""
    bank_account = db.query(BankAccount).filter(
        BankAccount.id == bank_account_id,
        BankAccount.user_id == user_id
    ).first()
    
    if not bank_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank account not found"
        )
    return bank_account


def update_bank_account(
    db: Session,
    bank_account_id: int,
    user_id: int,
    request: BankAccountUpdateRequest
) -> BankAccount:
    """Update a bank account"""
    bank_account = get_bank_account_by_id(db, bank_account_id, user_id)
    
    # If updating bank_id, verify bank exists
    if request.bank_id is not None:
        get_bank_by_id(db, request.bank_id)
        bank_account.bank_id = request.bank_id
    
    if request.account_holder_name is not None:
        bank_account.account_holder_name = request.account_holder_name
    
    if request.account_number is not None:
        bank_account.account_number = request.account_number
    
    if request.is_active is not None:
        bank_account.is_active = request.is_active
    
    # Handle primary account logic
    if request.is_primary is not None:
        if request.is_primary:
            # Unset other primary accounts
            db.query(BankAccount).filter(
                BankAccount.user_id == user_id,
                BankAccount.id != bank_account_id,
                BankAccount.is_primary == True
            ).update({"is_primary": False})
        bank_account.is_primary = request.is_primary
    
    db.commit()
    db.refresh(bank_account)
    return bank_account


def delete_bank_account(
    db: Session,
    bank_account_id: int,
    user_id: int
) -> None:
    """Delete (soft delete) a bank account"""
    bank_account = get_bank_account_by_id(db, bank_account_id, user_id)
    bank_account.is_active = False
    db.commit()

