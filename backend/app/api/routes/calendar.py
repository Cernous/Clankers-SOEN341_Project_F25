from fastapi import HTTPException, APIRouter

import crud
from api.deps import CurrentUser, SessionDep
from models import EventList

router = APIRouter(tags=["calendar"], prefix="/calendar")


@router.get("/", response_model=list[EventList])
def get_user_calendar(session: SessionDep, user: CurrentUser):
    """
    Gets the calendar of the saved events from the current user
    """
    return crud.get_user_calendar(session=session, user_id=user.id)


@router.delete("/{event_id}")
def delete_event_calendar(session: SessionDep, user: CurrentUser, event_id: int):
    if crud.delete_event_calendar(session=session, user_id=user.id, event_id=event_id):
        return {"message": "Saved event removed from user's calendar"}
    raise HTTPException(status_code=404, detail="Event not found")


@router.post("/{event_id}")
def save_event_calendar(session: SessionDep, user: CurrentUser, event_id: int):
    if crud.save_event_calendar(session=session, user_id=user.id, event_id=event_id):
        return {"message": "Saved event added to the user's calendar"}
    raise HTTPException(status_code=404, detail="Event not found")
