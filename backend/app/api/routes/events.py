from sqlmodel import SQLModel, Field, create_engine, Session, select
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, APIRouter

from api.deps import CurrentUser, SessionDep, get_current_user
from models import EventDB, EventCreate, EventUpdate, EventPublicRead, EventOrganizerRead, EventList, User

router = APIRouter(tags=['events'])

########################### CRUD operations #####################################
@router.post("/events")
def create_event(data: EventCreate, session: SessionDep, user: User = Depends(get_current_user)):

    if user.role == "student":
        raise HTTPException(status_code=403, detail="Only organizers or admins can create events")
    
    event = EventDB(**data.model_dump(), organizer_id=user.id)

    session.add(event)
    session.commit()
    session.refresh(event)

    return EventOrganizerRead.model_validate(event)


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

#in theory only the admin should be able to list all events so I commented out the check, but it's there in case?
@router.get("/events")
def list_events(session: SessionDep, user: User = Depends(get_current_user)):
   
   #if user.role != "admin":
       # raise HTTPException(status_code=406, detail="Admin access required")

    events = session.exec(select(EventDB).where(EventDB.visibility == "public")).all()
    
    return EventList.model_validate(events, many=True)


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
