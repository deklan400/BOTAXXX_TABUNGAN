import pytest
from fastapi import status
from app.models.user import User
from app.core.security import verify_password


def test_register(client, db):
    """Test user registration"""
    response = client.post(
        "/auth/register",
        json={
            "name": "New User",
            "email": "newuser@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    assert "message" in response.json()

    # Verify user was created
    user = db.query(User).filter(User.email == "newuser@example.com").first()
    assert user is not None
    assert user.name == "New User"
    assert verify_password("password123", user.password_hash)


def test_register_duplicate_email(client, test_user):
    """Test registration with duplicate email"""
    response = client.post(
        "/auth/register",
        json={
            "name": "Another User",
            "email": test_user.email,
            "password": "password123"
        }
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_login_success(client, test_user):
    """Test successful login"""
    response = client.post(
        "/auth/login",
        json={
            "email": test_user.email,
            "password": "testpassword123"
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client):
    """Test login with invalid credentials"""
    response = client.post(
        "/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_telegram_login(client, db, test_user):
    """Test Telegram login"""
    # Set telegram_id for test user
    test_user.telegram_id = "123456789"
    db.commit()

    response = client.post(
        "/auth/telegram-login",
        json={
            "telegram_id": "123456789",
            "telegram_username": "testuser"
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data


def test_telegram_login_not_found(client):
    """Test Telegram login with non-existent telegram_id"""
    response = client.post(
        "/auth/telegram-login",
        json={
            "telegram_id": "999999999"
        }
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

