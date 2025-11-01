"""
    This is where we create the different sqlmodels for the responses and request arguments
"""

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel, Uuid
from typing import Optional, Literal
from enum import Enum
from datetime import datetime, date, timezone
from functools import partial
import uuid

class UserRole(str, Enum):
    ADMIN = "admin"
    STUDENT = "student"
    ORGANIZER = "organizer"

class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, max_length=255, index=True)
    first_name: str | None = None
    last_name: str | None = None
    pronouns: str | None = None
    username: str 
    date_of_birth: Optional[date] = Field(default=None)
    role: UserRole = Field(default=UserRole.STUDENT)

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)

class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    first_name: str | None = Field(default=None, max_length=255)
    last_name: str | None = Field(default=None, max_length=255)

class UserUpdate(UserBase):
    email: EmailStr | None = Field(unique=True, index=True, max_length=255)
    password: str | None = Field(min_length=8, max_length=40)

class UserUpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)

class UserPublic(UserBase):
    id: str

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
    reviews: list["Review"] = Relationship(back_populates="user")
    # insert list of events and list of saved events

class EventBase(SQLModel):
    name: str  
    description: str
    price: float  
    location: str
    start_time: datetime
    end_time: datetime

class EventCreate(EventBase):
    tags: Optional[str] = None
    pictures: Optional[str] = None
    visibility: str


class EventAdminCreate(EventBase):
    tags: Optional[str] = None
    pictures: Optional[str] = None
    visibility: str
    organizer_id: Optional[int] = None

#we don't inherit the EvenrBase here so that if the organizer/admin only want to update one field they can
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

class EventPublicRead(EventBase):
    tags: Optional[str] = None
    pictures: Optional[str] = None

#not just for organizers, also for admins!
class EventOrganizerRead(EventBase):
    id: int
    organizer_id: int
    visibility: str
    state: str
    count_attendees: int
    date_created: datetime
    date_published: Optional[datetime] = None
    date_archived: Optional[datetime] = None
    tags: Optional[str] = None
    pictures: Optional[str] = None

class EventDB(EventBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organizer_id: int
    tags: Optional[str] = None
    visibility: str = "public"
    state: str = "upcoming"
    count_attendees: int = 0
    date_created: Optional[datetime] = None
    date_published: Optional[datetime] = None
    date_archived: Optional[datetime] = None
    pictures: Optional[str] = None
    tickets_left: Optional[int] = None
    reviews: list["Review"] = Relationship(back_populates="event")
    attendees: list["Attendees"] = Relationship(back_populates="event")

#to be used for listing events with minimal info, for a landing page kinda deal.  Inherits from EventBase and adds tags and pictures
class EventList(EventBase):
    tags: Optional[str] = None
    pictures: Optional[str] = None

#review table, one to many relationship with each event
class ReviewBase(SQLModel):
    desc: str | None = None
    star: int | None = None
    date_created: datetime = Field(default_factory=None)

class Review(ReviewBase, table=True):
    id: int = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.id") 
    event_id: int = Field(foreign_key="eventdb.id")
    visible: bool = Field(default=True)
    
    #This may cause infinite recursion we have to test it
    user: Optional["User"] = Relationship(back_populates="reviews")
    event: Optional["EventDB"] = Relationship(back_populates="reviews")
   
#lets admin hide reviews
class ReviewModerate(SQLModel):
    visible: bool | None = None

class ReviewRead(ReviewBase):
    first_name: str
    event_id: int
    desc: str
    star: int
    date_created: datetime

class Attendees(SQLModel, table=True):
    id: int = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    event_id: int = Field(foreign_key="eventdb.id")
    ticket: str
    event: Optional["EventDB"] = Relationship(back_populates="attendees")
