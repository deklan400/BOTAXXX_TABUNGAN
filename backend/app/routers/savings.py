from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.savings import Savings
from app.schemas.savings import SavingsBase, SavingsCreateRequest, SavingsUpdateRequest
from app.utils.jwt import get_current_user

router = APIRouter()

@router.get("/", response_model=list[SavingsBase])
def list_savings(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    items = db.query(Savings).filter(Savings.user_id == current_user.id).all()
    return items

@router.post("/", response_model=SavingsBase)
def create_savings(data: SavingsCreateRequest,
                   db: Session = Depends(get_db),
                   current_user=Depends(get_current_user)):

    item = Savings(user_id=current_user.id, **data.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{savings_id}", response_model=SavingsBase)
def update_savings(savings_id: int,
                   data: SavingsUpdateRequest,
                   db: Session = Depends(get_db),
                   current_user=Depends(get_current_user)):

    item = db.query(Savings).filter(
        Savings.id == savings_id,
        Savings.user_id == current_user.id
    ).first()

    for key, val in data.dict().items():
        setattr(item, key, val)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{savings_id}")
def delete_savings(savings_id: int,
                   db: Session = Depends(get_db),
                   current_user=Depends(get_current_user)):
    
    db.query(Savings).filter(
        Savings.id == savings_id,
        Savings.user_id == current_user.id
    ).delete()
    db.commit()

    return {"success": True}

