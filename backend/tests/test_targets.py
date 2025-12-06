import pytest
from fastapi import status
from datetime import date
from app.models.target import Target


def test_create_target(client, auth_headers):
    """Test creating a target"""
    response = client.post(
        "/targets",
        json={
            "name": "Vacation Fund",
            "target_amount": 5000.0,
            "current_amount": 0.0,
            "deadline": str(date(2024, 12, 31)),
            "note": "Save for vacation"
        },
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "Vacation Fund"
    assert data["target_amount"] == 5000.0
    assert data["status"] == "active"


def test_target_status_auto_done(client, auth_headers, db, test_user):
    """Test target status automatically changes to done when current >= target"""
    target = Target(
        user_id=test_user.id,
        name="Test Target",
        target_amount=1000.0,
        current_amount=0.0,
        status="active"
    )
    db.add(target)
    db.commit()

    # Update current_amount to exceed target
    response = client.put(
        f"/targets/{target.id}",
        json={
            "current_amount": 1000.0
        },
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "done"


def test_list_targets(client, auth_headers, db, test_user):
    """Test listing targets"""
    target1 = Target(
        user_id=test_user.id,
        name="Target 1",
        target_amount=1000.0,
        current_amount=500.0,
        status="active"
    )
    target2 = Target(
        user_id=test_user.id,
        name="Target 2",
        target_amount=2000.0,
        current_amount=2000.0,
        status="done"
    )
    db.add(target1)
    db.add(target2)
    db.commit()

    response = client.get("/targets", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 2


def test_update_target(client, auth_headers, db, test_user):
    """Test updating a target"""
    target = Target(
        user_id=test_user.id,
        name="Original Name",
        target_amount=1000.0,
        current_amount=0.0,
        status="active"
    )
    db.add(target)
    db.commit()

    response = client.put(
        f"/targets/{target.id}",
        json={
            "name": "Updated Name",
            "current_amount": 300.0
        },
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["current_amount"] == 300.0


def test_delete_target(client, auth_headers, db, test_user):
    """Test deleting a target"""
    target = Target(
        user_id=test_user.id,
        name="To Delete",
        target_amount=1000.0,
        current_amount=0.0,
        status="active"
    )
    db.add(target)
    db.commit()

    response = client.delete(f"/targets/{target.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify it's deleted
    deleted = db.query(Target).filter(Target.id == target.id).first()
    assert deleted is None

