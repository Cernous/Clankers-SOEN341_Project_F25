"""
    Tool related API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List

from models import (
    EventDB,
    User,
    UserRole,
    Attendees,
    ModQueue,
    AddToQueue
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
import crud

router = APIRouter(prefix="/tools", tags=["Tools"])

@router.get("/users/get-all-users", tags=["Users"])
def get_all_users(session: SessionDep, user: User = Depends(get_current_user)):
    """
        Get all users from the database and returns them (including personal detail)
        Scope: "admin"
    """
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Invalid role used")
    usersTable = select(User)
    return session.exec(usersTable).all()

@router.get("/users/get-all-organizers", tags=["Users"])
def get_all_organizers(session: SessionDep, user: User = Depends(get_current_user)):
    """
        Get all organizers from the database and returns them (including personal detail)
        Scope: "admin"
    """
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Invalid role used")
    usersTable = select(User)
    return session.exec(usersTable.where(UserRole.ORGANIZER == User.role)).all()

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

@router.get("/analytics/user_count", tags=["Analytics"])
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

@router.get("/analytics/organizer_count", tags=["Analytics"])
def get_num_organizers(session: SessionDep, current_user: CurrentUser):
    """
        Retrieves the number of organizers on the platform without sending the whole database table
        Scope: "admin"
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Invalid role")
    userTable = select(User)
    result = len(session.exec(userTable.where(UserRole.ORGANIZER == User.role)).all())
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
    return crud.get_all_pronoun(session=session)

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

@router.get("/analytics/attendees-list-export/{event_id}", tags=["Analytics", "events"])
def get_attendees_list(event_id: int, session: SessionDep, user: CurrentUser):
    """
        Export an event list as a csv str to be written unto a file
        Scope: "organizer"
    """
    event = crud.get_event_by_id(session=session, event_id=event_id)
    if user.role != UserRole.ORGANIZER and event.organizer_id != user.id:
        raise HTTPException(status_code=403, detail="Not your event! Stop being nosy")
    csv_data = crud.get_event_attendees(session=session, event_id=event_id)
    if csv_data:
        return csv_data
    else:
        raise HTTPException(status_code=403, detail="No attendees to export")

@router.get("/analytics/get-all-events/detail", tags=["Analytics", "events"])
def get_all_events(session: SessionDep, current_user: CurrentUser):
    """
        Get all events' detail
        Scope: "admin"
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            403,
            "Invalid Role"
        )
    return session.exec(select(EventDB)).all()

@router.get("/moderation/queue", response_model=List[ModQueue])
def get_queue(session: SessionDep):
    return session.exec(select(ModQueue)).all()

@router.post("/moderation/queue", response_model=ModQueue)
def add_report(item: AddToQueue, session: SessionDep):
    entry = ModQueue(user_id=item.user_id, desc=item.desc)
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry

@router.delete("/moderation/queue/{req}", response_model=ModQueue)
def delete_report(req: int, session: SessionDep, current_user: CurrentUser):
    
    #Scope Admin
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            403,
            "Invalid Role"
        )

    entry = session.get(ModQueue, req)
    if not entry:
        raise HTTPException(404)
    session.delete(entry)
    session.commit()
    return entry