from fastapi import APIRouter, Depends
from sqlmodel import Session, func, select
from datetime import datetime, timedelta, date, timezone
import uuid

from models import EventAdminCreate, UserCreate, User, EventDB, UserRole
from api.deps import SessionDep
import crud

from core.security import get_password_hash, verify_password
router = APIRouter()

@router.post("/seed-database", tags=["Admin Utilities"])
def seed_database(session: SessionDep):
    
    #user dummy data
    users = [
        UserCreate(
            email="alice@example.com",
            first_name="Alice",
            last_name="Nguyen",
            pronouns="she/her",
            username="alice",
            password="hashed_pw1",
            role=UserRole.STUDENT,
            date_of_birth=date(2001, 5, 14),
        ),
        UserCreate(
            email="bob@example.com",
            first_name="Bob",
            last_name="Martinez",
            pronouns="he/him",
            username="bob",
            password="hashed_pw2",
            role=UserRole.STUDENT,
            date_of_birth=date(1999, 8, 22),
            tickets=None
        ),
        UserCreate(
            email="jordan@example.com",
            first_name="Jordan",
            last_name="Lee",
            pronouns="they/them",
            username="jordan",
            password="hashed_pw3",
            role=UserRole.ORGANIZER,
            date_of_birth=date(1995, 2, 10),
        ),
        UserCreate(
            email="admin@example.com",
            first_name="Sam",
            last_name="Blake",
            pronouns="he/him",
            username="admin",
            password="hashed_admin_pw",
            role=UserRole.ADMIN,
            date_of_birth=date(1990, 1, 1),
        )
    ]

    for u in users:
        user_sesh = crud.verify_unique_email_username(session=session, username=u.username, email=u.email)
        if not user_sesh:
            crud.create_user(session=session, user_create=u)
    
    uids = crud.get_uid_by_role(session=session, 
                         role=UserRole.ORGANIZER)

    #event dummy data
    now = datetime.now(timezone.utc)
    events = [
        EventAdminCreate(
            name="Tech Expo 2025",
            description="A showcase of student tech projects.",
            price=10.0,
            location="Montreal Convention Centre",
            start_time=now + timedelta(days=7),
            end_time=now + timedelta(days=7, hours=4),
            tags="tech,expo,student",
            visibility="public",
	        capacity=400,
            state="upcoming",
            count_attendees=0,
            tickets_left=50,
            organizer_id=uids[0]
            
        ),
        EventAdminCreate(
            name="Cybersecurity Summit",
            description="Talks and demos on network security and hacking.",
            price=15.0,
            location="McGill Engineering Building",
            start_time=now + timedelta(days=14),
            end_time=now + timedelta(days=14, hours=6),
            tags="cybersecurity,hacking,infosec",
            visibility="public",
	        capacity=40,
            state="upcoming",
            count_attendees=0,
            tickets_left=30,
            organizer_id=uids[0]
        ),
        EventAdminCreate(
            name="AI and Ethics Forum",
            description="Panel discussion on ethical AI deployment.",
            price=0.0,
            location="Concordia Hall",
            start_time=now + timedelta(days=21),
            end_time=now + timedelta(days=21, hours=3),
            tags="AI,ethics,forum",
            visibility="public",
	        capacity=80,
            state="upcoming",
            count_attendees=0,
            tickets_left=100,
            organizer_id=uids[0]
        ),
    ]

    
    for e in events:
        session.add(EventDB(**e.model_dump()))

    session.commit()
    return {"message": "Dummy users and events successfully seeded."}
