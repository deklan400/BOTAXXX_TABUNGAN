from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String, nullable=True)
    google_id = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    telegram_id = Column(String, unique=True, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

