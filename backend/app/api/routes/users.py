"""
    User management related API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException

import crud
from models import (
    EventDB,
    Token,
    User,
    UserRegister,
    UserRole,
    UserUpdatePassword,
    UserUpdate,
    UserCreate,
    UserPublic,
    Attendees
)
from api.deps import (
    CurrentUser, 
    SessionDep, 
    get_current_active_superuser,
    get_current_user
)

from core.config import settings
from core import security
from datetime import date, timedelta
from sqlmodel import  func, select

# being called by the router in the previous directory
router = APIRouter(prefix="/users", tags=["users"])

# @router.get(
#     "/read-all",
#     dependencies=[Depends(get_current_active_superuser)],
#     response_model=UserPublic,
# )
# def read_users(session: SessionDep, skip: int=0, limit: int = 100) -> Any:
#     """
#         Retrieves the list of registered users
#     """
#     count_statement = select(func.count()).select_from(User)

@router.post("/register-student")
def create_student(user: UserRegister, session: SessionDep) -> Token:
    '''
        Registers a user into the database as student
    '''
    user_sesh = session.exec(select(User).where(user.email == User.email or user.username == User.username)).all()
    if user_sesh:
        raise HTTPException(status_code=403, 
                            detail="Username or Email has been previously used. Please try again")
    user_in = UserCreate(
        email=user.email,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        pronouns=user.pronouns,
        password=user.password,
        date_of_birth=user.date_of_birth,
    )
    user_out = crud.create_user(session=session, user_create=user_in)
    # generate access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            user_out.id, expires_delta=access_token_expires
        )
    )

@router.post("/register-organizer")
def create_organizer(user: UserRegister, session: SessionDep) -> Token:
    '''
        Registers an user into the database as student
    '''
    user_sesh = session.exec(select(User).where(user.email == User.email or user.username == User.username)).all()
    if user_sesh:
        raise HTTPException(status_code=403, 
                            detail="Username or Email has been previously used. Please try again")
    user_in = UserCreate(
        email=user.email,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        pronouns=user.pronouns,
        password=user.password,
        date_of_birth=user.date_of_birth,
        role=UserRole.ORGANIZER
    )
    user_out = crud.create_user(session=session, user_create=user_in)
    # generate an access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            user_out.id, expires_delta=access_token_expires
        )
    )

@router.get("/{user_id}")
def get_user(user_id: int, session: SessionDep):
    usersTable = select(User)
    user = session.exec(usersTable).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

