#!/usr/bin/env python3
"""Test script to verify all imports work correctly"""
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Testing imports...")
    
    # Test base
    from app.db.base import Base
    print("✓ Base imported")
    
    # Test models
    from app.models.user import User
    print("✓ User model imported")
    
    from app.models.user_telegram import UserTelegramID
    print("✓ UserTelegramID model imported")
    
    from app.models.savings import Savings
    print("✓ Savings model imported")
    
    from app.models.loan import Loan, LoanPayment
    print("✓ Loan models imported")
    
    from app.models.target import Target
    print("✓ Target model imported")
    
    # Test main app
    from app.main import app
    print("✓ FastAPI app imported")
    
    # Test routers
    from app.routers import auth, users, overview, savings, loans, targets
    print("✓ All routers imported")
    
    print("\n✅ All imports successful!")
    sys.exit(0)
    
except Exception as e:
    print(f"\n❌ Import error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

