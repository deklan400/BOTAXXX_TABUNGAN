from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)
    google_id = Column(String, unique=True, nullable=True, index=True)
    avatar_url = Column(String, nullable=True)
    telegram_id = Column(String, unique=True, nullable=True, index=True)  # Keep for backward compatibility
    role = Column(String, default="user", nullable=False)  # "user" or "admin"
    is_active = Column(Boolean, default=True, nullable=False)  # For suspend/unsuspend
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    savings = relationship("Savings", back_populates="user", cascade="all, delete-orphan")
    loans = relationship("Loan", back_populates="user", cascade="all, delete-orphan")
    targets = relationship("Target", back_populates="user", cascade="all, delete-orphan")
    telegram_ids = relationship("UserTelegramID", back_populates="user", cascade="all, delete-orphan")
    bank_accounts = relationship("BankAccount", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")
