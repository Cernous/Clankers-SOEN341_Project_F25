from datetime import datetime
from typing import Optional
from sqlmodel import Field, Relationship, SQLModel

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
    date_created: datetime = Field(default_factory=datetime.utcnow)
    date_published: Optional[datetime] = None
    date_archived: Optional[datetime] = None
    pictures: Optional[str] = None
