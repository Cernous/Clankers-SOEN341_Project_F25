"""
    Tool related API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException

from models import (
    EventDB,
    User,
    UserRole,
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

router = APIRouter(prefix="/tools", tags=["Tools"])

@router.get("/users/get-all", tags=["Users"])
def get_all_users(session: SessionDep, user: User = Depends(get_current_user)):
    """
        Get all users from the database and returns them (including personal detail)
        Scope: "admin"
    """
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Invalid role used")
    usersTable = select(User)
    return session.exec(usersTable).all()

@router.delete("/users/delete/{user_id}", tags=["Users"])
def delete_user(user_id: str, session: SessionDep, user: User = Depends(get_current_user)):
    """
        Directly delete a user from its user_id from the database
        Scope: "admin"
    """
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Invalid role used")
    usersTable = select(User)
    user = session.exec(usersTable.filter(User.id == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()
    return {"message": "User deleted successfully"}

### Analytics

@router.get("/users/user_count", tags=["Analytics"])
def get_num_users(session:SessionDep, current_user:CurrentUser):
    """
        Retrieves the number of users on the platform without sending the whole database table
        Scope: "admin"
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Invalid role")
    userTable = select(User)
    result = len(session.exec(userTable).all())
    return {
        "number": result
    }


@router.get("/analytics/pronoun_count", tags=["Analytics"])
def get_pronoun_count(session: SessionDep, user: User = Depends(get_current_user)):
    """
        Get the pronouns count from the whole user base
        Scope: "admin"
    """
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Invalid role used")
    usersTable = select(func.count(User.id)).select_from(User.pronouns)
    results = (
        session.query(User.pronouns, func.count(User.id))
        .group_by(User.pronouns)
        .all()
    )
    return {p: c for p, c in results}

@router.get("/analytics/average_age", tags=["Analytics"])
def get_average_age(session: SessionDep, user: User = Depends(get_current_user)):
    """
        Get the average age of the user base
        Scope: "admin"
    """
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Invalid role used")
    today = date.today()
    users = session.query(User).filter(User.date_of_birth.isnot(None)).all()
    if not users:
        return {"average_age": None}
    avg_age = sum(
        (today - u.date_of_birth).days / 365.25 for u in users
    ) / len(users)
    return {"average_age": round(avg_age, 2)}

@router.get("/analytics/average_age/{event_id}", tags=["Analytics", "events"])
def get_event_average_age(event_id: int, session: SessionDep, user: User = Depends(get_current_user)):
    """
        Get the average age of the attendees in a given event 
        Scope: "organizer"
    """
    event = session.get(EventDB, event_id)
    if user.role != UserRole.ORGANIZER and event.organizer_id != user.id:
        raise HTTPException(status_code=403, detail="Not your event! Stop being nosy")
    today = date.today()
    attendees = (
        session.query(User)
        .join(Attendees, Attendees.user_id == User.id)
        .filter(Attendees.event_id == event_id)
        .filter(User.date_of_birth.isnot(None))
        .all()
    )
    if not attendees:
        return {"average_age": None}
    avg_age = sum(
        (today - u.date_of_birth).days / 365 for u in attendees
    ) / len(attendees)
    return {"average_age": round(avg_age, 2)}