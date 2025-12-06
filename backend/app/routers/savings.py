from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.savings import SavingsBase, SavingsCreateRequest, SavingsUpdateRequest
from app.models.savings import Savings
from app.utils.jwt import get_current_user
from app.db.session import get_db

router = APIRouter()

@router.get("/", response_model=list[SavingsBase])
def list_savings(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(Savings).filter(Savings.user_id == user.id).order_by(Savings.date.desc()).all()

@router.post("/", response_model=SavingsBase)
def create_savings(data: SavingsCreateRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = Savings(user_id=user.id, **data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{savings_id}", response_model=SavingsBase)
def update_savings(
    savings_id: int,
    data: SavingsUpdateRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    item = db.query(Savings).filter(Savings.id == savings_id, Savings.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Savings not found")

    for k, v in data.dict().items():
        setattr(item, k, v)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{savings_id}")
def delete_savings(savings_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = db.query(Savings).filter(Savings.id == savings_id, Savings.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Savings not found")

    db.delete(item)
    db.commit()

    return {"success": True}
