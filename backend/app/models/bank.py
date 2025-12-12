from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Bank(Base):
    """Master data untuk bank"""
    __tablename__ = "banks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)  # "BCA", "Mandiri", etc
    code = Column(String, nullable=False, unique=True, index=True)  # "bca", "mandiri" - untuk logo filename
    logo_filename = Column(String, nullable=True)  # "bca.png"
    brand_color = Column(String, nullable=True)  # "#0066CC" - untuk kartu
    logo_background = Column(String, nullable=True)  # "#FFFFFF" - warna latar belakang logo
    logo_size_width = Column(Integer, nullable=True)  # Lebar logo dalam px
    logo_size_height = Column(Integer, nullable=True)  # Tinggi logo dalam px
    country = Column(String, default="ID", nullable=False)  # "ID", "KH", "SG", etc
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    bank_accounts = relationship("BankAccount", back_populates="bank", cascade="all, delete-orphan")


class BankAccount(Base):
    """Rekening bank milik user"""
    __tablename__ = "bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    bank_id = Column(Integer, ForeignKey("banks.id"), nullable=False, index=True)
    account_holder_name = Column(String, nullable=False)  # Nama pemilik rekening
    account_number = Column(String, nullable=False)  # Nomor rekening
    is_active = Column(Boolean, default=True, nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)  # Rekening utama
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="bank_accounts")
    bank = relationship("Bank", back_populates="bank_accounts")

