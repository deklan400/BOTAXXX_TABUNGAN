from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base

class Target(Base):
    __tablename__ = "targets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    name = Column(String)
    target_amount = Column(Float)
    current_amount = Column(Float)
    deadline = Column(Date, nullable=True)
    status = Column(String, default="active")
    note = Column(String)

    user = relationship("User")
