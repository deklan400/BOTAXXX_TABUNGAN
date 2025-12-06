from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.utils.jwt import get_current_user
from app.models.target import Target
from app.schemas.target import (
    TargetBase,
    TargetCreateRequest,
    TargetUpdateRequest,
)
from app.services.targets_service import (
    create_target,
    get_targets,
    get_target_by_id,
    update_target,
    delete_target,
)
from app.core.logging_config import app_logger

router = APIRouter()


@router.get("/", response_model=List[TargetBase])
def list_targets(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """List all targets for the current user"""
    try:
        targets = get_targets(db, user.id, skip, limit)
        if status_filter:
            targets = [t for t in targets if t.status == status_filter]
        return targets
    except Exception as e:
        app_logger.error(f"List targets error for user {user.id}: {str(e)}", exc_info=True)
        raise


@router.post("/", response_model=TargetBase, status_code=status.HTTP_201_CREATED)
def create_target_endpoint(
    data: TargetCreateRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Create a new target"""
    try:
        target = create_target(db, user.id, data)
        app_logger.info(f"Target created: {target.id} by user {user.id}")
        return target
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Create target error for user {user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create target"
        )


@router.get("/{target_id}", response_model=TargetBase)
def get_target_endpoint(
    target_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Get a specific target"""
    return get_target_by_id(db, target_id, user.id)


@router.put("/{target_id}", response_model=TargetBase)
def update_target_endpoint(
    target_id: int,
    data: TargetUpdateRequest,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Update a target"""
    try:
        return update_target(db, target_id, user.id, data)
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Update target error for user {user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update target"
        )


@router.delete("/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_target_endpoint(
    target_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Delete a target"""
    try:
        delete_target(db, target_id, user.id)
        app_logger.info(f"Target deleted: {target_id} by user {user.id}")
    except HTTPException:
        raise
    except Exception as e:
        app_logger.error(f"Delete target error for user {user.id}: {str(e)}", exc_info=True)
        raise
