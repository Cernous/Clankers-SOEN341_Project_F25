from sqlmodel import SQLModel, Field, create_engine, Session, select
from datetime import datetime
from typing import Optional

import crud

from fastapi import FastAPI, Depends, HTTPException, APIRouter

from crud import create_review, delete_review, get_reviews_for_event
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
    Attendees,
    ReviewAdd
)

router = APIRouter(tags=['events'])

########################### CRUD operations #####################################
@router.post("/events")
def create_event(data: EventAdminCreate, session: SessionDep, user: User = Depends(get_current_user)):
    if user.role not in ["organizer","admin"]:
        raise HTTPException(status_code=403, detail="Only organizers can create events")
    if user.role == "organizer":
        data.organizer_id = user.id
    db_event = EventDB(**data.model_dump())

    post_event = crud.create_event(session=session, data=db_event)

    return EventOrganizerRead.model_validate(post_event)

#in theory only the admin should be able to list all events so I commented out the check, but it's there in case?
@router.get("/events/list", response_model=list[EventList])
def list_events(session: SessionDep):
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
            return EventPublicRead.model_validate(event)
        else:
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

@router.post("/{event_id}/add_ticket/")
def add_ticket(event_id: int, session: SessionDep, ticket: str, current_user: CurrentUser):
    event = session.query(EventDB).filter(EventDB.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event or User not found")
    if event.tickets_left <= 0:
        raise HTTPException(status_code=400, detail="No tickets left")
    event.tickets_left -= 1
    ticket = str(event_id) + ":" + f"{ticket}"
    if current_user.tickets == None:
        current_user.tickets = ticket
    else:
        current_user.tickets += f",{ticket}"
    session.add(Attendees(event_id=event_id, user_id=current_user.id))
    session.commit()
    return {"message": "Ticket added and user added to attendees"}


@router.post("/{event_id}/remove_ticket")
def remove_ticket(event_id: int, session: SessionDep, current_user: CurrentUser):
    event = session.query(EventDB).filter(EventDB.id == event_id).first()
    attendee = (
        session.query(Attendees)
        .filter(Attendees.event_id == event_id, Attendees.user_id == current_user.id)
        .first()
    )
    if not event or not attendee:
        raise HTTPException(status_code=404, detail="Event or Attendee not found")
    event.tickets_left += 1 
    if current_user.tickets:
        tickets_list = current_user.tickets.split(',')
        filtered_tickets = [t for t in tickets_list if not t.startswith(f"{event_id}:")]
        current_user.tickets = ','.join(filtered_tickets) if filtered_tickets else None

    session.delete(attendee)
    session.commit()
    return {"message": "Ticket removed and user removed from attendees"}

@router.post("/reviews/add")
def add_review(review: ReviewAdd, session: SessionDep):
    success = create_review(
        session,
        user_id=review.user_id,
        event_id=int(review.event_id),
        desc=review.desc,
        star=review.star
    )
    if success == True:
        return {"Review added"}
    else:
        return {"Review could not be added"}

@router.delete("/reviews/{review_id}")
def remove_review(review_id: int, session: SessionDep):
    success = delete_review(session, review_id)
    if not success:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review deleted"}

@router.get("/reviews/event/{event_id}")
def get_event_reviews(event_id: int, session: SessionDep):
    reviews = get_reviews_for_event(session, event_id)
    return {"reviews": reviews}
