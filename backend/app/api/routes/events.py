from sqlmodel import SQLModel, Field, create_engine, Session, select
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, APIRouter

from api.deps import CurrentUser, SessionDep, get_current_user
from models import (
    EventDB, 
    EventCreate, 
    EventAdminCreate, 
    EventUpdate, 
    EventPublicRead, 
    EventOrganizerRead, 
    EventList, 
    User,
    Attendees
)

router = APIRouter(tags=['events'])

########################### CRUD operations #####################################
@router.post("/events")
def create_event(data: EventCreate, session: SessionDep, user: User = Depends(get_current_user)):
    if user.role != "organizer":
        raise HTTPException(status_code=403, detail="Only organizers can create events")
    
    event = EventDB(**data.model_dump(), organizer_id=user.id)

    session.add(event)
    session.commit()
    session.refresh(event)

    return EventOrganizerRead.model_validate(event)

@router.post("/events/admin_create/")
def create_event(data: EventAdminCreate, session: SessionDep, user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create events via this route")
    
    table = select(User)
    user = session.exec(table.where(data.organizer_id == User.id)).first()
    if not user:
        raise HTTPException(400, "Organizer does not exist")
    
    event = EventDB(**data.model_dump())
    session.add(event)
    session.commit()
    session.refresh(event)

    return EventOrganizerRead.model_validate(event)


#in theory only the admin should be able to list all events so I commented out the check, but it's there in case?
@router.get("/events/list", response_model=list[EventList])
def list_events(session: SessionDep, user: User = Depends(get_current_user)):
    events = session.exec(select(EventDB).where(EventDB.visibility == "public")).all()
    return events 



@router.get("/events/{event_id}")
def read_event(event_id: int, session: SessionDep, user: User = Depends(get_current_user)):
    event = session.get(EventDB, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if user.role == "student":
        return EventPublicRead.model_validate(event)

    elif user.role == "organizer":
        if event.organizer_id != user.id:
            raise HTTPException(status_code=403, detail="Not your event dawg")
        return EventOrganizerRead.model_validate(event)

    elif user.role == "admin":
        return EventOrganizerRead.model_validate(event)

    raise HTTPException(status_code=403, detail="Invalid role used")


@router.put("/events/{event_id}")
def update_event( event_id: int, data: EventUpdate, session: SessionDep, user: User = Depends(get_current_user)):

    #setting up the event session
    event = session.get(EventDB, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    #authorization to make sure only the correct organizer or admin can update the event
    if user.role == "student":
        raise HTTPException(status_code=403, detail="Students can't update events silly")
    if user.role == "organizer" and event.organizer_id != user.id:
        raise HTTPException(status_code=403, detail="Not your event broski")

    #get the fields to update, exclude_unset means only fields sent in the request body will be included
    updates = data.model_dump()  #literally "exclude_unset=True" is dif between put and patch, oops


    #never allow these attributes to change
    immutable = {"id", "organizer_id", "date_created"}
    for k in immutable:
        updates.pop(k, None)

    #update the event with the new values
    for key, value in updates.items():
        setattr(event, key, value)

    #commit the changes to the database and refresh the event instance
    session.commit()
    session.refresh(event)

    #both organizer and admin get the same view of the event
    return EventOrganizerRead.model_validate(event)


@router.patch("/events/{event_id}")
def patch_event(event_id: int, data: EventUpdate, session: SessionDep, user: User = Depends(get_current_user)):

    #setting up the event session
    event = session.get(EventDB, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    #authorization to make sure only the correct organizer or admin can update the event
    if user.role == "student":
        raise HTTPException(status_code=403, detail="Students can't update events silly")
    if user.role == "organizer" and event.organizer_id != user.id:
        raise HTTPException(status_code=403, detail="Not your event dawg")

    #get the fields to update, exclude_unset means only fields sent in the request body will be included
    updates = data.model_dump(exclude_unset=True)

    #never allow these attributes to change
    immutable = {"id", "organizer_id", "date_created"}
    for k in immutable:
        updates.pop(k, None)

    #update the event with the new values
    for key, value in updates.items():
        setattr(event, key, value)

    #commit the changes to the database and refresh the event instance
    session.commit()
    session.refresh(event)

    #both organizer and admin get the same view of the event
    return EventOrganizerRead.model_validate(event)

@router.delete("/events/{event_id}")
def delete_event( event_id: int, data: EventUpdate, session: SessionDep, user: User = Depends(get_current_user)):
    #setting up the event session
    event = session.get(EventDB, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    #authorization to make sure only the correct organizer or admin can delete the event
    if user.role == "student":
        raise HTTPException(status_code=403, detail="Students can't delete events silly")
    if user.role == "organizer" and event.organizer_id != user.id:
        raise HTTPException(status_code=403, detail="Not your event to delete broseph")

    session.delete(event)
    session.commit()

    return {"detail": "Event deleted, bye bye"}

@router.get("/")
def get_all_events(session: SessionDep):
    return session.query(EventDB).all()

@router.post("/{event_id}/add_ticket/{user_id}")
def add_ticket(event_id: int, user_id: str, session: SessionDep):
    event = session.query(EventDB).filter(EventDB.id == event_id).first()
    user = session.query(User).filter(User.id == user_id).first()
    if not event or not user:
        raise HTTPException(status_code=404, detail="Event or User not found")
    if event.tickets_left <= 0:
        raise HTTPException(status_code=400, detail="No tickets left")
    event.tickets_left -= 1
    session.add(Attendees(event_id=event_id, user_id=user_id))
    session.commit()
    return {"message": "Ticket added and user added to attendees"}


@router.post("/{event_id}/remove_ticket/{user_id}")
def remove_ticket(event_id: int, user_id: str, session: SessionDep):
    event = session.query(EventDB).filter(EventDB.id == event_id).first()
    attendee = (
        session.query(Attendees)
        .filter(Attendees.event_id == event_id, Attendees.user_id == user_id)
        .first()
    )
    if not event or not attendee:
        raise HTTPException(status_code=404, detail="Event or Attendee not found")
    event.tickets_left += 1
    session.delete(attendee)
    session.commit()
    return {"message": "Ticket removed and user removed from attendees"}
