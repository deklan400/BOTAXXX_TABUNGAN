import pytest
from fastapi import status
from datetime import date
from app.models.loan import Loan, LoanPayment


def test_create_loan(client, auth_headers):
    """Test creating a loan"""
    response = client.post(
        "/loans",
        json={
            "borrower_name": "John Doe",
            "principal": 1000.0,
            "start_date": str(date.today()),
            "due_date": str(date(2024, 12, 31)),
            "note": "Test loan"
        },
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["borrower_name"] == "John Doe"
    assert data["principal"] == 1000.0
    assert data["status"] == "active"
    assert data["remaining_amount"] == 1000.0


def test_list_loans(client, auth_headers, db, test_user):
    """Test listing loans"""
    loan = Loan(
        user_id=test_user.id,
        borrower_name="Jane Doe",
        principal=500.0,
        start_date=date.today(),
        status="active"
    )
    db.add(loan)
    db.commit()

    response = client.get("/loans", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 1


def test_add_payment(client, auth_headers, db, test_user):
    """Test adding a payment to a loan"""
    loan = Loan(
        user_id=test_user.id,
        borrower_name="John Doe",
        principal=1000.0,
        start_date=date.today(),
        status="active"
    )
    db.add(loan)
    db.commit()

    response = client.post(
        f"/loans/{loan.id}/payments",
        json={
            "date": str(date.today()),
            "amount": 300.0,
            "note": "First payment"
        },
        headers=auth_headers
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["amount"] == 300.0

    # Check remaining amount
    loan_response = client.get(f"/loans/{loan.id}", headers=auth_headers)
    loan_data = loan_response.json()
    assert loan_data["remaining_amount"] == 700.0


def test_loan_status_auto_paid(client, auth_headers, db, test_user):
    """Test loan status automatically changes to paid when remaining is 0"""
    loan = Loan(
        user_id=test_user.id,
        borrower_name="John Doe",
        principal=1000.0,
        start_date=date.today(),
        status="active"
    )
    db.add(loan)
    db.commit()

    # Pay full amount
    client.post(
        f"/loans/{loan.id}/payments",
        json={
            "date": str(date.today()),
            "amount": 1000.0
        },
        headers=auth_headers
    )

    # Check loan status
    loan_response = client.get(f"/loans/{loan.id}", headers=auth_headers)
    loan_data = loan_response.json()
    assert loan_data["status"] == "paid"
    assert loan_data["remaining_amount"] == 0.0


def test_get_loan_payments(client, auth_headers, db, test_user):
    """Test getting payments for a loan"""
    loan = Loan(
        user_id=test_user.id,
        borrower_name="John Doe",
        principal=1000.0,
        start_date=date.today(),
        status="active"
    )
    db.add(loan)
    db.commit()

    payment = LoanPayment(
        loan_id=loan.id,
        date=date.today(),
        amount=200.0
    )
    db.add(payment)
    db.commit()

    response = client.get(f"/loans/{loan.id}/payments", headers=auth_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 1
    assert data[0]["amount"] == 200.0

