from fastapi import APIRouter, Depends
from sqlmodel import Session
from datetime import datetime, timedelta, date
import uuid

from models import User, EventDB, UserRole
from api.deps import SessionDep

router = APIRouter()

@router.post("/seed-database", tags=["Admin Utilities"])
def seed_database(session: SessionDep):
    #user dummy data
    users = [
        User(
            id=uuid.uuid4(),
            email="alice@example.com",
            first_name="Alice",
            last_name="Nguyen",
            pronouns="she/her",
            username="alice",
            hashed_password="hashed_pw1",
            role=UserRole.STUDENT,
            date_of_birth=date(2001, 5, 14),
            tickets=None
        ),
        User(
            id=uuid.uuid4(),
            email="bob@example.com",
            first_name="Bob",
            last_name="Martinez",
            pronouns="he/him",
            username="bob",
            hashed_password="hashed_pw2",
            role=UserRole.STUDENT,
            date_of_birth=date(1999, 8, 22),
            tickets=None
        ),
        User(
            id=uuid.uuid4(),
            email="jordan@example.com",
            first_name="Jordan",
            last_name="Lee",
            pronouns="they/them",
            username="jordan",
            hashed_password="hashed_pw3",
            role=UserRole.ORGANIZER,
            date_of_birth=date(1995, 2, 10),
            tickets=None
        ),
        User(
            id=uuid.uuid4(),
            email="admin@example.com",
            first_name="Sam",
            last_name="Blake",
            pronouns="he/him",
            username="admin",
            hashed_password="hashed_admin_pw",
            role=UserRole.ADMIN,
            date_of_birth=date(1990, 1, 1),
            tickets=None
        )
    ]

    #event dummy data
    now = datetime.utcnow()
    events = [
        EventDB(
            name="Tech Expo 2025",
            description="A showcase of student tech projects.",
            price=10.0,
            location="Montreal Convention Centre",
            start_time=now + timedelta(days=7),
            end_time=now + timedelta(days=7, hours=4),
            organizer_id=3,
            tags="tech,expo,student",
            visibility="public",
            state="upcoming",
            count_attendees=0,
            tickets_left=50,
        ),
        EventDB(
            name="Cybersecurity Summit",
            description="Talks and demos on network security and hacking.",
            price=15.0,
            location="McGill Engineering Building",
            start_time=now + timedelta(days=14),
            end_time=now + timedelta(days=14, hours=6),
            organizer_id=3,
            tags="cybersecurity,hacking,infosec",
            visibility="public",
            state="upcoming",
            count_attendees=0,
            tickets_left=30,
        ),
        EventDB(
            name="AI and Ethics Forum",
            description="Panel discussion on ethical AI deployment.",
            price=0.0,
            location="Concordia Hall",
            start_time=now + timedelta(days=21),
            end_time=now + timedelta(days=21, hours=3),
            organizer_id=3,
            tags="AI,ethics,forum",
            visibility="public",
            state="upcoming",
            count_attendees=0,
            tickets_left=100,
        ),
    ]

    for u in users:
        session.add(u)
    for e in events:
        session.add(e)

    session.commit()
    return {"message": "Dummy users and events successfully seeded."}
