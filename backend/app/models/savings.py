from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base

class Savings(Base):
    __tablename__ = "savings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date)
    type = Column(String)  # IN / OUT
    category = Column(String)
    amount = Column(Float)
    note = Column(String)

    user = relationship("User")

