"""
    User management related API endpoints
"""
from fastapi import APIRouter, HTTPException

import crud
from models import (
    EventDB,
    Message,
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

@router.post("/signup/{userRole}")
def create_user(userRole: str, user: UserRegister, session: SessionDep) -> Token:
    '''
        Registers an user into the database as student
    '''
    user_sesh = crud.verify_unique_email_username(session=session, 
                                                  username=user.username, 
                                                  email=user.email)
    if user_sesh:
        raise HTTPException(status_code=403, 
                            detail="Username or Email has been previously used. Please try again")
    if userRole.lower() not in ["student", "organizer"]:
        raise HTTPException(status_code=400, 
                            details="Role not specified or does not exist")
    user_in = UserCreate(
        email=user.email,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        pronouns=user.pronouns,
        password=user.password,
        date_of_birth=user.date_of_birth,
        role=userRole
    )
    user_out = crud.create_user(session=session, user_create=user_in)
    # generate an access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            user_out.id, expires_delta=access_token_expires
        )
    )

@router.get("/me", response_model=UserPublic)
def get_me_user(current_user: CurrentUser):
    """
        Get me info
    """
    return current_user


@router.get("/{user_id}", response_model=UserPublic)
def get_user(user_id: str, session: SessionDep, current_user: CurrentUser):
    """
        Get User depending on the given user ID
    """
    user = crud.get_user_by_uid(session=session, uid=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == UserRole.ADMIN or user == current_user:
        return user
    else:
        raise HTTPException(status_code=403, details = "You don't have permission to view this profile")

@router.patch("/me/update-password", response_model=Message)
def update_password(passwordform: UserUpdatePassword, session: SessionDep, user:CurrentUser):
    """
        Allows the user to update their password
    """
    if passwordform.new_password == passwordform.current_password:
        raise HTTPException(400, "Your new password should not be the same as your current password")
    if not crud.verify_password(passwordform.current_password, user.hashed_password):
        raise HTTPException(400, "Incorrect password")

    new_hashed_password = crud.get_password_hash(passwordform.new_password)
    user.hashed_password = new_hashed_password
    session.add(user)
    session.commit()
    return Message(message="Password Updated Successfully")

@router.delete("/me", response_model=Message)
def delete_me(session: SessionDep, current_user:CurrentUser):
    """
        Delete me user and say goodbye
    """
    if current_user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="As an admin, you cannot delete yourself. Try doing it by deleting the database"
        )
    
    session.delete(current_user)
    session.commit()
    return Message(message="Goodbye User. User has been deleted")

@router.patch("/me/update", response_model=UserPublic)
def update_me(*, session:SessionDep, user_in: UserUpdate, current_user:CurrentUser):
    """
        Update me user
    """
    if user_in.email:
        existing_user = crud.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )
    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user
        
