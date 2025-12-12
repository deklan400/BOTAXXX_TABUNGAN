#!/usr/bin/env python3
"""
Script to set user as admin
Usage: python set_admin.py <email>
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.session import SessionLocal
from app.models.user import User


def set_admin(email: str):
    """Set user with given email as admin"""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"❌ User with email '{email}' not found!")
            return False
        
        if user.role == "admin":
            print(f"✅ User '{email}' is already an admin!")
            return True
        
        user.role = "admin"
        db.commit()
        print(f"✅ User '{email}' is now an admin!")
        print(f"   Name: {user.name}")
        print(f"   Email: {user.email}")
        print(f"   Role: {user.role}")
        return True
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {str(e)}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python set_admin.py <email>")
        print("Example: python set_admin.py admin@example.com")
        sys.exit(1)
    
    email = sys.argv[1]
    set_admin(email)

