"""
This is where we create the different sqlmodels for the responses and request arguments
"""
import uuid
from datetime import datetime, date
from enum import Enum
from typing import Optional, Literal

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


# -----------USER MODELS-------------#


class UserRole(str, Enum):
    ADMIN = "admin"
    STUDENT = "student"
    ORGANIZER = "organizer"


class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, max_length=255, index=True)
    first_name: str | None = None
    last_name: str | None = None
    pronouns: str | None = None
    username: str = Field(unique=True, max_length=255)
    date_of_birth: Optional[date] = Field(default=None)
    role: UserRole = Field(default=UserRole.STUDENT)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    username: str = Field(unique=True, max_length=255)
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    first_name: str = Field(default=None, max_length=255)
    last_name: str = Field(default=None, max_length=255)
    pronouns: str | None = None
    date_of_birth: Optional[date] = Field(default=None)


class UserUpdate(SQLModel):
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    pronouns: str | None = None


class UserUpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


class GetUserProfile(UserBase):
    tickets: Optional[str] = None
    reviews: list["Review"] = Relationship(back_populates="user")


class UserPublic(UserBase):
    id: str


class TicketHandler(SQLModel):
    tickets: Optional[str] = None


class Message(SQLModel):
    message: str


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


class User(UserBase, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    hashed_password: str
    tickets: Optional[str] = None
    saved_events: Optional[str] = None
    reviews: list["Review"] = Relationship(back_populates="user")
    # insert list of events and list of saved events


# -----------EVENT MODELS-------------#


class EventCreate(SQLModel):
    name: str
    description: str
    price: float
    location: str
    start_time: datetime
    end_time: datetime
    tags: Optional[str] = None
    pictures: Optional[str] = None
    visibility: Optional[str] = Field(default="private")
    organizer_id: str
    count_attendees: int = 0
    capacity: int = 1
    tickets_left: int = 1


class EventAdminCreate(EventCreate):
    organizer_id: Optional[str] = None


# we don't inherit the EvenrBase here so that if the organizer/admin only want to update one field they can
class EventUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    tags: Optional[str] = None
    pictures: Optional[str] = None
    visibility: str
    state: str


class EventPublicRead(SQLModel):
    id: int
    name: str
    description: str
    price: float
    location: str
    start_time: datetime
    end_time: datetime
    tags: str | None = None
    pictures: str | None = None
    reviews: list["Review"] = Relationship(back_populates="event")
    organizer_id: Optional[str] = None


# not just for organizers, also for admins!
class EventOrganizerRead(SQLModel):
    name: str
    description: str
    price: float
    location: str
    start_time: datetime
    end_time: datetime
    id: int
    organizer_id: str
    visibility: Literal["public", "private"] = "private"
    state: str
    count_attendees: int = 0
    date_created: Optional[datetime] = None
    date_published: Optional[datetime] = None
    date_archived: Optional[datetime] = None
    tags: str | None = None
    pictures: str | None = None
    capacity: int = 1
    ticket_count: int = 0
    tickets_left: int = 1
    reviews: list["Review"] = Relationship(back_populates="event")
    attendees: list["Attendees"] = Relationship(back_populates="event")


class EventDB(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organizer_id: str
    name: str
    description: str
    price: float
    location: str
    start_time: datetime
    end_time: datetime
    visibility: Optional[str] = Field(default="private")
    tags: Optional[str] = None
    state: Optional[str] = Field(default="upcoming")
    count_attendees: int = 0
    date_created: Optional[datetime] = Field(default_factory=datetime.utcnow)
    date_published: Optional[datetime] = Field(default=None)
    date_archived: Optional[datetime] = Field(default=None)
    pictures: Optional[str] = Field(default=None)
    capacity: int = 1
    ticket_count: int = 0
    tickets_left: Optional[int] = Field(default=1)
    reviews: list["Review"] = Relationship(back_populates="event")
    attendees: list["Attendees"] = Relationship(back_populates="event")


# to be used for listing events with minimal info, for a landing page kinda deal.  Inherits from EventBase and adds tags and pictures
class EventList(SQLModel):
    id: int
    name: str
    description: str
    price: float
    location: str
    start_time: datetime
    end_time: datetime
    tags: str | None = None
    pictures: str | None = None
    organizer_id: str


# -----------REVIEW MODELS-------------#


# review table, one to many relationship with each event
class Review(SQLModel, table=True):
    id: int = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    event_id: int = Field(foreign_key="eventdb.id")
    desc: str | None = None
    star: int | None = None
    date_created: datetime = Field(default_factory=None)
    visible: str = Field(default="private")

    # This may cause infinite recursion we have to test it
    user: Optional["User"] = Relationship(back_populates="reviews")
    event: Optional["EventDB"] = Relationship(back_populates="reviews")


# lets admin hide reviews
class ReviewModerate(SQLModel):
    visible: Literal["public", "private"] = "private"


class ReviewRead(SQLModel):
    first_name: str | None = None
    event_id: int | None = None
    desc: str | None = None
    star: int | None = None
    date_created: Optional[datetime] = Field(default=None)


class ReviewAdd(SQLModel):
    user_id: str
    event_id: int
    desc: str | None = None
    star: int | None = None
    date_created: datetime = Field(default_factory=None)


# -----------ATTENDEES MODELS-------------#


class Attendees(SQLModel, table=True):
    id: int = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    event_id: int = Field(foreign_key="eventdb.id")
    ticket: str | None = None
    event: Optional["EventDB"] = Relationship(back_populates="attendees")


# -----------ATTENDEES MODELS-------------#


class ModQueue(SQLModel, table=True):
    req: int = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    desc: str = Field(default=None)
    date_created: datetime = Field(default_factory=datetime.utcnow)


class AddToQueue(SQLModel):
    user_id: str
    desc: str


class GetQueue(SQLModel):
    req: int = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    desc: str = Field(default=None)
    date_created: datetime
