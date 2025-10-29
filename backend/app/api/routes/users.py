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
from datetime import date
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

@router.post("/")
def create_user(user: UserCreate, session: SessionDep):
    hashed_pw = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        pronouns=user.pronouns,
        hashed_password=hashed_pw,
        date_of_birth=user.date_of_birth,
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


@router.get("/")
def get_all_users(session: SessionDep):
    return session.query(User).all()


@router.get("/{user_id}")
def get_user(user_id: int, session: SessionDep):
    user = session.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}")
def delete_user(user_id: int, session: SessionDep):
    user = session.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()
    return {"message": "User deleted successfully"}


@router.get("/analytics/pronoun_count")
def get_pronoun_count(session: SessionDep):
    results = (
        session.query(User.pronouns, func.count(User.id))
        .group_by(User.pronouns)
        .all()
    )
    return {p: c for p, c in results}


@router.get("/analytics/average_age")
def get_average_age(session: SessionDep):
    today = date.today()
    users = session.query(User).filter(User.date_of_birth.isnot(None)).all()
    if not users:
        return {"average_age": None}
    avg_age = sum(
        (today - u.date_of_birth).days / 365.25 for u in users
    ) / len(users)
    return {"average_age": round(avg_age, 2)}


@router.get("/analytics/average_age/{event_id}")
def get_event_average_age(event_id: int, session: SessionDep):
    today = date.today()
    attendees = (
        session.query(User)
        .join(Attendee, Attendee.user_id == User.id)
        .filter(Attendee.event_id == event_id)
        .filter(User.date_of_birth.isnot(None))
        .all()
    )
    if not attendees:
        return {"average_age": None}
    avg_age = sum(
        (today - u.date_of_birth).days / 365 for u in attendees
    ) / len(attendees)
    return {"average_age": round(avg_age, 2)}
