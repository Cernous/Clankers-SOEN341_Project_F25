"""
    This is where we create the different sqlmodels for the responses and request arguments
"""

import uuid

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel

class UserBase(SQLModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    first_name: str = ""
    last_name: str = ""
    pronoun: str = ""
    role: str = ""
    username: str = ""
    # password: str
    # token: str
    date_of_birth: str = ""
    # saved_events: list[str]
    # tickets: list[str]

class UserCreate(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    date_of_birth: str  = ""
    username: str = ""
    first_name: str = ""
    last_name: str = ""
    password: str = ""

class UserSignIn(SQLModel):
    username: str = ""
    password: str = ""

# class OrganizerCreate(UserCreate):


