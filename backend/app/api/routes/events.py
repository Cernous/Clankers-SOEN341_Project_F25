from sqlmodel import SQLModel, Field, create_engine, Session, select, func
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
    listed_events = crud.list_events(session)
    
    return listed_events 

@router.get("/events/random")
def random_button(session: SessionDep):
    #loads chosen random event into random_event variable
    random_event = crud.get_random_event(session)

    #return model validated event from public perspective
    return EventPublicRead.model_validate(random_event)

@router.get("/events/pub/{event_id}")
def read_public_event(event_id: int, session: SessionDep):
    return EventPublicRead.model_validate(crud.get_event_by_id(session=session, event_id=event_id))

@router.get("/events/{event_id}")
def read_event(event_id: int, session: SessionDep, user: CurrentUser):
    get_event = crud.get_event_by_id(session, event_id)
    if not get_event:
        raise HTTPException(status_code=404, detail="Event not found")

    if user.role == "organizer":
        if get_event.organizer_id != user.id:
            return EventPublicRead.model_validate(get_event)
        else:
            return EventOrganizerRead.model_validate(get_event)

    elif user.role == "admin":
        return EventOrganizerRead.model_validate(get_event)

    return EventPublicRead.model_validate(get_event)


@router.put("/events/{event_id}")
def update_event( event_id: int, data: EventUpdate, session: SessionDep, user: User = Depends(get_current_user)):

    #setting up the event session
    event = session.get(EventDB, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    #setting up the event session
    get_event = crud.get_event_by_id(session, event_id)

    if not get_event:
        raise HTTPException(status_code=404, detail="Event not found")

    #authorization to make sure only the correct organizer or admin can update the event
    if user.role == "student":
        raise HTTPException(status_code=403, detail="Students can't update events silly")
    if user.role == "organizer" and get_event.organizer_id != user.id:
        raise HTTPException(status_code=403, detail="Not your event dawg")

    #get the fields to update, exclude_unset means only fields sent in the request body will be included
    updates = data.model_dump(exclude_unset=True, exclude_none=True)

    #never allow these attributes to change
    immutable = {"id", "organizer_id", "date_created"}
    for k in immutable:
        updates.pop(k, None)

    updated_event = crud.patch_event(session, get_event, updates)

    #both organizer and admin get the same view of the event
    return EventOrganizerRead.model_validate(updated_event)


@router.patch("/events/{event_id}")
def patch_event(event_id: int, data: EventUpdate, session: SessionDep, user: User = Depends(get_current_user)):

    #setting up the event session
    get_event = crud.get_event_by_id(session, event_id)

    if not get_event:
        raise HTTPException(status_code=404, detail="Event not found")

    #authorization to make sure only the correct organizer or admin can update the event
    if user.role == "student":
        raise HTTPException(status_code=403, detail="Students can't update events silly")
    if user.role == "organizer" and get_event.organizer_id != user.id:
        raise HTTPException(status_code=403, detail="Not your event dawg")

    #get the fields to update, exclude_unset means only fields sent in the request body will be included
    updates = data.model_dump(exclude_unset=True)

    #never allow these attributes to change
    immutable = {"id", "organizer_id", "date_created"}
    for k in immutable:
        updates.pop(k, None)

    updated_event = crud.patch_event(session, get_event, updates)

    #both organizer and admin get the same view of the event
    return EventOrganizerRead.model_validate(updated_event)

@router.delete("/events/{event_id}")
def delete_event( event_id: int, data: EventUpdate, session: SessionDep, user: User = Depends(get_current_user)):
    #setting up the event session
    get_event = crud.get_event_by_id(session, event_id)
    if not get_event:
        raise HTTPException(status_code=404, detail="Event not found")

    #authorization to make sure only the correct organizer or admin can delete the event
    if user.role == "student":
        raise HTTPException(status_code=403, detail="Students can't delete events silly")
    if user.role == "organizer" and get_event.organizer_id != user.id:
        raise HTTPException(status_code=403, detail="Not your event to delete broseph")

    results = crud.delete_event_by_id(session, event_id)

    if results == False:
        raise HTTPException(status_code=500, detail="Event could not be deleted")

    return {"detail": "Event deleted, bye bye"}

@router.post("/{event_id}/add_ticket/")
def add_ticket(event_id: int, session: SessionDep, ticket: str, current_user: CurrentUser):
    event = crud.get_event_by_id(session=session, event_id=event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event or User not found")
    if event.tickets_left <= 0:
        raise HTTPException(status_code=400, detail="No tickets left")
    if crud.assign_ticket_to_user(user_id=current_user.id,
                                  event_id=event_id,
                                  new_ticket=ticket,
                                  session=session):
        return {"message": "Ticket added and user added to attendees"}
    else:
        raise HTTPException(status_code=500, detail="Cannot add ticket to user")


@router.post("/{event_id}/remove_ticket")
def remove_ticket(event_id: int, session: SessionDep, current_user: CurrentUser):
    event = crud.get_event_by_id(session=session, event_id=event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.tickets_left <= 0:
        raise HTTPException(status_code=400, detail="No tickets left")
    if not crud.remove_ticket(
        user_id=current_user.id,
        event_id=event_id,
        session=session
    ): 
        raise HTTPException(status_code=500, detail="Cannot remove ticket from user")
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
