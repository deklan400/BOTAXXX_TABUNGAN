from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from app.core.config import settings
from app.models.user import User
from app.db.session import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme),
                     db=Depends(get_db)) -> User:

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = db.query(User).filter(User.id == int(user_id)).first()

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return user

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

