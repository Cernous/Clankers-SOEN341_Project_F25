import uuid
from typing import Any, Dict

from sqlmodel import Session, select, func, Sequence
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from core.security import get_password_hash, verify_password
from models import EventDB, User, UserCreate, UserUpdate, Review, Attendees

def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, 
        update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj

def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

def get_user_by_uid(*, session: Session, uid: str) -> User | None:
    usersTable = select(User)
    session_user = session.exec(usersTable.filter(User.id == uid)).first()
    return session_user

def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(func.lower(User.email) == func.lower(email))
    session_user = session.exec(statement).first()
    return session_user

def get_user_by_username(*, session: Session, username: str) -> User | None:
    statement = select(User).where(func.lower(User.username) == func.lower(username))
    session_user = session.exec(statement).first()
    return session_user

def get_uid_by_role(*, session: Session, role: str) -> list[str] | None:
    statement = select(User).where(func.lower(User.role) == role).column(User.id)
    session_users = session.exec(statement).all()
    return [u.id for u in session_users]

def verify_unique_email_username(*, session: Session, username: str, email: str) -> bool:
    statement = session.exec(select(User).where(email == User.email or username == User.username)).all()
    return True if statement else False

def authenticate(*, session: Session, username: str, password: str) -> User | None:
    db_user = get_user_by_username(session=session, username=username)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user

def create_review(session: Session, user_id: str, event_id: int, desc: str, star: int) -> bool:
    review = Review(
        user_id=user_id,
        event_id=event_id,
        desc=desc,
        star=star,
        date_created=datetime.utcnow(),
        visible=True
    )
    session.add(review)
    session.commit()
    session.refresh(review)
    return True    

def delete_review(session: Session, review_id: int) -> bool:
    review = session.get(Review, review_id)
    if review:
        session.delete(review)
        session.commit()
        return True
    return False

def get_reviews_for_event(session: Session, event_id: int):
    statement = select(Review).where(Review.event_id == event_id)
    reviews = session.exec(statement).all()

    reviews_with_names = []
    for review in reviews:
        reviews_with_names.append({
            "review_id": review.id,
            "user_id": review.user_id,
            "first_name": review.user.first_name if review.user else None,
            "desc": review.desc,
            "star": review.star,
            "date_created": review.date_created
        })

    return reviews_with_names

def get_event_attendees(event_id: int, session: Session) -> List[Attendees]:
    statement = select(Attendees).where(Attendees.event_id == event_id)
    return session.exec(statement).all()

def get_user_tickets(user_id: str, session: Session) -> Optional[str]:
    statement = select(User.tickets).where(User.id == user_id)
    return session.exec(statement).first()

def get_event_attendance_count(event_id: int, session: Session) -> int:
    statement = select(func.count()).select_from(Attendees).where(Attendees.event_id == event_id)
    return session.exec(statement).one()

def get_all_users(session: Session) -> List[User]:
    statement = select(User)
    return session.exec(statement).all()

def assign_ticket_to_user(user_id: str, event_id: int, new_ticket: str, session: Session) -> bool:
    user = session.get(User, user_id)
    event = session.get(EventDB, event_id)

    if not user or not event or event.tickets_left is None or event.tickets_left <= 0:
        return False

    #tickets are saved as a CSV
    if not user.tickets or user.tickets.strip() == "":
        user.tickets = new_ticket
    else:
        user.tickets += f",{new_ticket}"

    #update the event tickets
    event.tickets_left -= 1

    #update attendees
    attendee = Attendees(user_id=user_id, event_id=event_id, ticket=new_ticket)
    session.add(attendee)

    session.add(user)
    session.add(event)
    session.commit()
    session.refresh(user)
    session.refresh(event)
    return True

def remove_ticket(user_id: str, event_id: int, ticket_str: str, session: Session) -> bool:
    #We can add refund functionality here
    user = session.get(User, user_id)
    event = session.get(EventDB, event_id)
    if not user or not event:
        return False

    if not user.tickets:
        return False
    #remove from the csv
    tickets = [t.strip() for t in user.tickets.split(",") if t.strip()]
    if ticket_str not in tickets:
        return False

    tickets.remove(ticket_str)
    user.tickets = ",".join(tickets) if tickets else None

    #put the ticket back into the event
    if event.tickets_left is not None:
        event.tickets_left += 1

    #update attendees list
    statement = select(Attendees).where(
        Attendees.user_id == user_id,
        Attendees.event_id == event_id,
        Attendees.ticket == ticket_str
    )
    attendee = session.exec(statement).first()
    if attendee:
        session.delete(attendee)

    session.add(user)
    session.add(event)
    session.commit()
    session.refresh(user)
    session.refresh(event)
    return True

def get_all_pronoun(session: Session) -> Dict[str, int]:
    statement = select(User.pronouns, func.count()).group_by(User.pronouns)
    results = session.exec(statement).all()
    return {pronoun if pronoun else "Unspecified": count for pronoun, count in results}

def get_event_average_age(event_id: int, session: Session) -> Optional[float]:
    stmt = (
        select(func.avg(func.extract("year", func.age(func.current_date(), User.date_of_birth))))
        .join(Attendees, Attendees.user_id == User.id)
        .where(Attendees.event_id == event_id)
    )
    result = session.exec(stmt).first()
    return float(result) if result is not None else None

def get_all_average_age(session: Session) -> Optional[float]:
    stmt = select(func.avg(func.extract("year", func.age(func.current_date(), User.date_of_birth))))
    result = session.exec(stmt).first()
    return float(result) if result is not None else None


#############################  Events Related CRUD #############################
def create_event(session: Session, data: EventDB) -> EventDB:
    event = EventDB(**data.model_dump())

    session.add(event)
    session.commit()
    session.refresh(event)

    return event

def list_events(session: Session) -> List[EventDB]:
    statement = select(EventDB)
    events = session.exec(statement).all()
    return events

def get_random_event(session: Session) -> EventDB:
    #select a random public event from the database of existing databases organized by the tag public
    statement = select(EventDB).where(EventDB.visibility == "public").order_by(func.random()).limit(1)

    #loads chosen random event into event variable
    return session.exec(statement).first()

def get_event_by_id(session: Session, event_id: int) -> Optional[EventDB]:

    return session.get(EventDB, event_id)

def delete_event_by_id(session: Session, event_id: int) -> bool:
    event = session.get(EventDB, event_id)
    if event:
        session.delete(event)
        session.commit()
        return True
    return False

def update_event_by_id(session: Session, event_id: int, updates: dict) -> Optional[EventDB]:
    event = session.get(EventDB, event_id)
    if not event:
        return None

    for key, value in updates.items():
        setattr(event, key, value)

    session.add(event)
    session.commit()
    session.refresh(event)

    return event

def patch_event(session: Session, event: EventDB, updates: dict) -> EventDB:
    for key, value in updates.items():
        setattr(event, key, value)

    session.add(event)
    session.commit()
    session.refresh(event)

    return event

def save_event_calendar(session: Session, user_id: str, event_id: int) -> bool:
    user:User = get_user_by_uid(session=session, uid=user_id)
    calendar_data:str = user.saved_events
    saved_events:list[str] = calendar_data.strip("[]").split(",")

    if not get_event_by_id(session=session, event_id=event_id):
        return False
    
    saved_events.append(str(event_id))
    saved_events=list(set(saved_events)) # removes duplicates
    user.saved_events = "[" + (",".join(saved_events)) + "]"
    user.sqlmodel_update(user)
    session.add(user)
    session.commit()
    session.refresh(user)
    return True

def delete_event_calendar(session: Session, user_id: str, event_id: int) -> bool:
    user:User = get_user_by_uid(session=session, uid=user_id)
    calendar_data:str = user.saved_events
    saved_events:list[str] = calendar_data.strip("[]").split(",")

    if not get_event_by_id(session=session, event_id=event_id) or str(event_id) not in saved_events:
        return False
    
    saved_events.remove(str(event_id))
    user.saved_events = "[" + (",".join(saved_events)) + "]"
    user.sqlmodel_update(user)
    session.add(user)
    session.commit()
    session.refresh(user)
    return True

def get_user_calendar(session: Session, user_id: str) -> list[EventDB]:
    user:User = get_user_by_uid(session=session, uid=user_id)
    calendar_data:str = user.saved_events if user.saved_events is not None else "[]"
    saved_events:list[str] = calendar_data.strip("[]").split(",")
    calendar:list[EventDB] = []
    validated_calendar:list[str] = []

    for events_id_str in saved_events:
        if not events_id_str.isnumeric():
            continue
        
        id = int(events_id_str)
        event = get_event_by_id(session=session, event_id=id)
        # if the event does not exists
        if not event:
            continue

        validated_calendar.append(events_id_str)
        calendar.append(event)

    user.saved_events = "[" + (",".join(validated_calendar)) + "]"
    user.sqlmodel_update(user)
    session.add(user)
    session.commit()
    session.refresh(user)
    return calendar