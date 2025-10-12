"""
    User management related API endpoints
"""
import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException

import crud
from models import (
    User,
    UserUpdatePassword,
    UserUpdate,
    UserCreate,
    UserPublic
)
from api.deps import CurrentUser, SessionDep, get_current_active_superuser

from core.config import settings
from core.security import get_password_hash, verify_password

from time import time
from sqlmodel import col, delete, func, select

# being called by the router in the previous directory
router = APIRouter(prefix="/users", tags=["users"])

@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
)
def read_users(session: SessionDep, skip: int=0, limit: int = 100) -> Any:
    """
        Retrieves the list of registered users
    """
    count_statement = select(func.count()).select_from(User)