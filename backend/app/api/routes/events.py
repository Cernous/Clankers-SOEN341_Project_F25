from sqlmodel import SQLModel, Field, create_engine, Session, select
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException

from app.api.deps import CurrentUser, SessionDep
from app.models import EventDB, EventCreate, EventUpdate, EventPublicRead, EventOrganizerRead

app = FastAPI()

########################### CRUD operations #####################################
@app.post("/events")
def create_event(data: EventCreate, session: Session = Depends(get_session), user: User = Depends(get_current_user)):

    if user.role != "organizer":
        raise HTTPException(status_code=403, detail="Only organizers can create events")
    
    event = EventDB(**data.model_dump(), organizer_id=user.id)

    session.add(event)
    session.commit()
    session.refresh(event)

    return EventOrganizerRead.model_validate(event)


@app.get("/events/{event_id}")
def read_event(event_id: int, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
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


@app.put("/events/{event_id}")
def update_event( event_id: int, data: EventUpdate, session: Session = Depends(get_session), user: User = Depends(get_current_user)):

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


@app.patch("/events/{event_id}")
def patch_event(event_id: int, data: EventUpdate, session: Session = Depends(get_session), user: User = Depends(get_current_user)):

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

@app.delete("/events/{event_id}")
def delete_event( event_id: int, data: EventUpdate, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
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