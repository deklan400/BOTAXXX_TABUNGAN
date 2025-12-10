from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List
from app.models.target import Target
from app.schemas.target import TargetCreateRequest, TargetUpdateRequest
from app.utils.calculations import update_target_status


def create_target(db: Session, user_id: int, request: TargetCreateRequest) -> Target:
    """Create a new target"""
    target = Target(
        user_id=user_id,
        name=request.name,
        target_amount=request.target_amount,
        current_amount=request.current_amount,
        deadline=request.deadline,
        note=request.note,
        status="active"
    )

    # Check if target is already achieved
    if target.current_amount >= target.target_amount:
        target.status = "done"

    db.add(target)
    db.commit()
    db.refresh(target)
    return target


def get_targets(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Target]:
    """Get all targets for a user"""
    return db.query(Target).filter(
        Target.user_id == user_id
    ).order_by(Target.deadline.asc()).offset(skip).limit(limit).all()


def get_target_by_id(db: Session, target_id: int, user_id: int) -> Target:
    """Get a specific target"""
    target = db.query(Target).filter(
        Target.id == target_id,
        Target.user_id == user_id
    ).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target not found"
        )
    return target


def update_target(
    db: Session,
    target_id: int,
    user_id: int,
    request: TargetUpdateRequest
) -> Target:
    """Update a target"""
    target = get_target_by_id(db, target_id, user_id)

    if request.name is not None:
        target.name = request.name
    if request.target_amount is not None:
        target.target_amount = request.target_amount
    
    # Handle amount updates: add_amount takes priority for incremental updates
    if request.add_amount is not None:
        # Add to current amount (incremental update)
        target.current_amount += request.add_amount
    elif request.current_amount is not None:
        # Set absolute value (direct update from dashboard)
        target.current_amount = request.current_amount
    
    if request.deadline is not None:
        target.deadline = request.deadline
    if request.status is not None:
        if request.status not in ["active", "done"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be 'active' or 'done'"
            )
        target.status = request.status
    if request.note is not None:
        target.note = request.note

    # Update status based on current_amount vs target_amount
    update_target_status(db, target_id)

    db.commit()
    db.refresh(target)
    return target


def delete_target(db: Session, target_id: int, user_id: int) -> None:
    """Delete a target"""
    target = get_target_by_id(db, target_id, user_id)
    db.delete(target)
    db.commit()


def get_total_target_current_amount(db: Session, user_id: int) -> float:
    """Get total current amount across all targets"""
    targets = db.query(Target).filter(Target.user_id == user_id).all()
    return sum(t.current_amount for t in targets)
