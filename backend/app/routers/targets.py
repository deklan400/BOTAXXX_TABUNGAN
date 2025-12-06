from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.utils.jwt import get_current_user
from app.models.target import Target
from app.schemas.target import (
    TargetBase,
    TargetCreateRequest,
    TargetUpdateRequest,
)

router = APIRouter()


@router.get("/", response_model=list[TargetBase])
def list_targets(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    status: str | None = None,
):
    query = db.query(Target).filter(Target.user_id == user.id)
    if status:
        query = query.filter(Target.status == status)
    targets = query.order_by(Target.id.desc()).all()
    return [TargetBase.from_orm(t) for t in targets]


@router.post("/", response_model=TargetBase)
def create_target(
    data: TargetCreateRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    target = Target(
        user_id=user.id,
        name=data.name,
        target_amount=data.target_amount,
        current_amount=data.current_amount,
        deadline=data.deadline,
        status="active",
        note=data.note,
    )
    db.add(target)
    db.commit()
    db.refresh(target)
    return TargetBase.from_orm(target)


@router.get("/{target_id}", response_model=TargetBase)
def get_target(
    target_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    target = (
        db.query(Target)
        .filter(Target.id == target_id, Target.user_id == user.id)
        .first()
    )
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    return TargetBase.from_orm(target)


@router.put("/{target_id}", response_model=TargetBase)
def update_target(
    target_id: int,
    data: TargetUpdateRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    target = (
        db.query(Target)
        .filter(Target.id == target_id, Target.user_id == user.id)
        .first()
    )
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(target, key, value)

    # auto mark done kalau sudah tercapai
    if (
        target.current_amount is not None
        and target.target_amount is not None
        and target.current_amount >= target.target_amount
    ):
        target.status = "done"

    db.commit()
    db.refresh(target)
    return TargetBase.from_orm(target)


@router.delete("/{target_id}")
def delete_target(
    target_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    target = (
        db.query(Target)
        .filter(Target.id == target_id, Target.user_id == user.id)
        .first()
    )
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    db.delete(target)
    db.commit()
    return {"success": True}

