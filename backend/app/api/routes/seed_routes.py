from fastapi import APIRouter, Depends
from sqlmodel import Session, func, select
from datetime import datetime, timedelta, date, timezone

from models import EventAdminCreate, UserCreate, User, EventDB, UserRole
from api.deps import SessionDep
import crud

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
        EventAdminCreate(
            name="Machine Learning Bootcamp",
            description="Hands-on introduction to modern ML workflows.",
            price=49.99,
            location="EV Building",
            start_time=now + timedelta(days=10),
            end_time=now + timedelta(days=10, hours=6),
            tags="ML,workshop,training",
            visibility="public",
            capacity=50,
            state="upcoming",
            count_attendees=0,
            tickets_left=50,
            organizer_id=uids[1]
        ),

        EventAdminCreate(
            name="Cybersecurity Awareness Night",
            description="Learn how to secure your digital identity.",
            price=0.0,
            location="H110 Auditorium",
            start_time=now + timedelta(days=5),
            end_time=now + timedelta(days=5, hours=2),
            tags="security,cyber,lecture",
            visibility="public",
            capacity=120,
            state="upcoming",
            count_attendees=0,
            tickets_left=120,
            organizer_id=uids[2]
        ),

        EventAdminCreate(
            name="Cloud Computing Expo",
            description="Showcase of cloud platforms and tools.",
            price=10.0,
            location="Conference Center A",
            start_time=now + timedelta(days=30),
            end_time=now + timedelta(days=30, hours=5),
            tags="cloud,expo,technology",
            visibility="public",
            capacity=150,
            state="upcoming",
            count_attendees=0,
            tickets_left=150,
            organizer_id=uids[0]
        ),

        EventAdminCreate(
            name="Intro to Robotics",
            description="An interactive session exploring robotics fundamentals.",
            price=15.0,
            location="Engineering Lab 2",
            start_time=now + timedelta(days=14),
            end_time=now + timedelta(days=14, hours=4),
            tags="robotics,workshop",
            visibility="public",
            capacity=40,
            state="upcoming",
            count_attendees=0,
            tickets_left=40,
            organizer_id=uids[1]
        ),

        EventAdminCreate(
            name="Blockchain & Web3 Meetup",
            description="Exploring decentralized technologies and applications.",
            price=5.0,
            location="GS Building Room 301",
            start_time=now + timedelta(days=18),
            end_time=now + timedelta(days=18, hours=3),
            tags="blockchain,web3,meetup",
            visibility="public",
            capacity=60,
            state="upcoming",
            count_attendees=0,
            tickets_left=60,
            organizer_id=uids[2]
        ),

        EventAdminCreate(
            name="Data Science Career Panel",
            description="Industry professionals discuss roles in data science.",
            price=0.0,
            location="John Molson School of Business",
            start_time=now + timedelta(days=25),
            end_time=now + timedelta(days=25, hours=2),
            tags="data,career,panel",
            visibility="public",
            capacity=200,
            state="upcoming",
            count_attendees=0,
            tickets_left=200,
            organizer_id=uids[0]
        ),

        EventAdminCreate(
            name="Game Development Jam",
            description="Team-based game building competition.",
            price=20.0,
            location="Design Studio 4",
            start_time=now + timedelta(days=40),
            end_time=now + timedelta(days=42),
            tags="game,jam,development",
            visibility="public",
            capacity=100,
            state="upcoming",
            count_attendees=0,
            tickets_left=100,
            organizer_id=uids[1]
        ),

        EventAdminCreate(
            name="Quantum Computing Intro",
            description="Beginner-friendly explanation of quantum logic and algorithms.",
            price=25.0,
            location="Physics Lecture Hall",
            start_time=now + timedelta(days=16),
            end_time=now + timedelta(days=16, hours=3),
            tags="quantum,computing,lecture",
            visibility="public",
            capacity=70,
            state="upcoming",
            count_attendees=0,
            tickets_left=70,
            organizer_id=uids[2]
        ),

        EventAdminCreate(
            name="VR/AR Experience Fair",
            description="Try immersive virtual and augmented reality technologies.",
            price=12.0,
            location="Innovation Space",
            start_time=now + timedelta(days=12),
            end_time=now + timedelta(days=12, hours=5),
            tags="vr,ar,expo",
            visibility="public",
            capacity=90,
            state="upcoming",
            count_attendees=0,
            tickets_left=90,
            organizer_id=uids[0]
        ),

        EventAdminCreate(
            name="AI Hackathon 48h",
            description="48-hour hackathon focused on AI applications.",
            price=30.0,
            location="H Building Labs",
            start_time=now + timedelta(days=45),
            end_time=now + timedelta(days=47),
            tags="ai,hackathon,competition",
            visibility="public",
            capacity=120,
            state="upcoming",
            count_attendees=0,
            tickets_left=120,
            organizer_id=uids[1]
        ),

        EventAdminCreate(
            name="Python for Beginners",
            description="Absolute beginner-level Python programming workshop.",
            price=0.0,
            location="ENCS Lab 5",
            start_time=now + timedelta(days=4),
            end_time=now + timedelta(days=4, hours=3),
            tags="python,programming,workshop",
            visibility="public",
            capacity=35,
            state="upcoming",
            count_attendees=0,
            tickets_left=35,
            organizer_id=uids[2]
        ),

        EventAdminCreate(
            name="Sustainability in Tech",
            description="Understanding energy-conscious software and hardware development.",
            price=0.0,
            location="Green Center",
            start_time=now + timedelta(days=22),
            end_time=now + timedelta(days=22, hours=2),
            tags="sustainability,tech,environment",
            visibility="public",
            capacity=75,
            state="upcoming",
            count_attendees=0,
            tickets_left=75,
            organizer_id=uids[0]
        ),

        EventAdminCreate(
            name="Deep Learning Advanced Workshop",
            description="Dive deep into neural networks, transformers, and optimization tricks.",
            price=59.0,
            location="AI Lab 1",
            start_time=now + timedelta(days=28),
            end_time=now + timedelta(days=28, hours=6),
            tags="deep learning,neural networks,training",
            visibility="public",
            capacity=45,
            state="upcoming",
            count_attendees=0,
            tickets_left=45,
            organizer_id=uids[1]
        ),

        EventAdminCreate(
            name="Tech Startup Pitch Night",
            description="Founders present their startup ideas to a panel of judges.",
            price=10.0,
            location="Startup Hub",
            start_time=now + timedelta(days=20),
            end_time=now + timedelta(days=20, hours=3),
            tags="startup,pitch,entrepreneurship",
            visibility="public",
            capacity=100,
            state="upcoming",
            count_attendees=0,
            tickets_left=100,
            organizer_id=uids[2]
        ),

        EventAdminCreate(
            name="Math for AI",
            description="Crash course on linear algebra and calculus foundations for AI.",
            price=0.0,
            location="Math Building Room 210",
            start_time=now + timedelta(days=9),
            end_time=now + timedelta(days=9, hours=3),
            tags="math,ai,lecture",
            visibility="public",
            capacity=80,
            state="upcoming",
            count_attendees=0,
            tickets_left=80,
            organizer_id=uids[0]
        ),

        EventAdminCreate(
            name="Networking Fundamentals",
            description="Introductory talk on network protocols and architectures.",
            price=0.0,
            location="Computer Centre",
            start_time=now + timedelta(days=11),
            end_time=now + timedelta(days=11, hours=2),
            tags="networking,tech,lecture",
            visibility="public",
            capacity=60,
            state="upcoming",
            count_attendees=0,
            tickets_left=60,
            organizer_id=uids[1]
        ),

        EventAdminCreate(
            name="Mobile App Development Workshop",
            description="Build your first cross-platform mobile app.",
            price=29.99,
            location="Software Lab 3",
            start_time=now + timedelta(days=17),
            end_time=now + timedelta(days=17, hours=5),
            tags="mobile,app,workshop",
            visibility="public",
            capacity=50,
            state="upcoming",
            count_attendees=0,
            tickets_left=50,
            organizer_id=uids[2]
        ),

        EventAdminCreate(
            name="Databases Crash Course",
            description="Learn SQL, indexes, ACID, and schema design basics.",
            price=0.0,
            location="DB Lab",
            start_time=now + timedelta(days=8),
            end_time=now + timedelta(days=8, hours=3),
            tags="database,sql,training",
            visibility="public",
            capacity=40,
            state="upcoming",
            count_attendees=0,
            tickets_left=40,
            organizer_id=uids[0]
        ),

        EventAdminCreate(
            name="AI in Healthcare Symposium",
            description="Exploring the role of AI in diagnosis and treatment.",
            price=35.0,
            location="Medical Sciences Auditorium",
            start_time=now + timedelta(days=35),
            end_time=now + timedelta(days=35, hours=4),
            tags="ai,healthcare,symposium",
            visibility="public",
            capacity=150,
            state="upcoming",
            count_attendees=0,
            tickets_left=150,
            organizer_id=uids[1]
        )
    ]

    
    for e in events:
        session.add(EventDB(**e.model_dump()))

    session.commit()
    return {"message": "Dummy users and events successfully seeded."}
