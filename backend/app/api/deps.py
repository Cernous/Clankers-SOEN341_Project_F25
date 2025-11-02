"""
    Once again do not worry, if you see these account thing
"""

from collections.abc import Generator
from typing import Annotated

import jwt
from jwt.exceptions import InvalidTokenError

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from pydantic import ValidationError

from sqlmodel import Session, select, func

from models import User, TokenPayload, UserRole
from core import security
from core import config
from core.sqlite_manager import engine

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{config.settings.API_STR}/login/access-token"
)

def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]

def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(
            token, config.settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_Data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials"
        )

    user = session.exec(
        select(User).where(User.id == token_Data.sub)
    ).first()
    if not user and token_Data.sub:
        user = session.exec(
            select(User).where(func.lower(User.username) == func.lower(token_Data.sub))
        ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User not found for subject {token_Data.sub}",
        )
    return user

CurrentUser = Annotated[User, Depends(get_current_user)]

def get_current_active_superuser(current_user: CurrentUser) -> User:
    role_value = current_user.role.value if isinstance(current_user.role, UserRole) else current_user.role
    if role_value != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Does not have enough privileges")
    return current_user
