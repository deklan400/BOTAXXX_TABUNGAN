import pytest
from fastapi import status
from datetime import date
from app.models.savings import Savings


def test_create_savings_income(client, auth_headers):
    """Test creating an income transaction"""
    response = client.post(
        "/savings",
        json={
            "date": str(date.today()),
            "type": "IN",
            "category": "Salary",
            "amount": 5000.0,
            "note": "Monthly salary"
        },
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["type"] == "IN"
    assert data["amount"] == 5000.0


def test_create_savings_expense(client, auth_headers):
    """Test creating an expense transaction"""
    response = client.post(
        "/savings",
        json={
            "date": str(date.today()),
            "type": "OUT",
            "category": "Food",
            "amount": 50.0,
            "note": "Lunch"
        },
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["type"] == "OUT"
    assert data["amount"] == 50.0


def test_list_savings(client, auth_headers, db, test_user):
    """Test listing savings transactions"""
    # Create some test savings
    savings1 = Savings(
        user_id=test_user.id,
        date=date.today(),
        type="IN",
        category="Salary",
        amount=1000.0
    )
    savings2 = Savings(
        user_id=test_user.id,
        date=date.today(),
        type="OUT",
        category="Food",
        amount=50.0
    )
    db.add(savings1)
    db.add(savings2)
    db.commit()

    response = client.get("/savings", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 2


def test_get_balance(client, auth_headers, db, test_user):
    """Test getting balance"""
    # Create income and expense
    income = Savings(
        user_id=test_user.id,
        date=date.today(),
        type="IN",
        category="Salary",
        amount=1000.0
    )
    expense = Savings(
        user_id=test_user.id,
        date=date.today(),
        type="OUT",
        category="Food",
        amount=200.0
    )
    db.add(income)
    db.add(expense)
    db.commit()

    response = client.get("/savings/balance", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total_balance"] == 800.0
    assert data["total_income"] == 1000.0
    assert data["total_expense"] == 200.0


def test_update_savings(client, auth_headers, db, test_user):
    """Test updating a savings transaction"""
    savings = Savings(
        user_id=test_user.id,
        date=date.today(),
        type="IN",
        category="Salary",
        amount=1000.0
    )
    db.add(savings)
    db.commit()

    response = client.put(
        f"/savings/{savings.id}",
        json={
            "amount": 1500.0,
            "note": "Updated salary"
        },
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["amount"] == 1500.0


def test_delete_savings(client, auth_headers, db, test_user):
    """Test deleting a savings transaction"""
    savings = Savings(
        user_id=test_user.id,
        date=date.today(),
        type="IN",
        category="Salary",
        amount=1000.0
    )
    db.add(savings)
    db.commit()

    response = client.delete(f"/savings/{savings.id}", headers=auth_headers)
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify it's deleted
    deleted = db.query(Savings).filter(Savings.id == savings.id).first()
    assert deleted is None

