"""
    This is where we create the different sqlmodels for the responses and request arguments
"""

import uuid

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel

from typing import Literal

### 
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    first_name: str | None
    last_name: str | None 
    pronouns: str | None
    username: str 
    role: Literal['admin', 'organizer', 'student'] = "student"

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

class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    # insert list of events and list of saved events

class UserPublic(UserBase):
    id: uuid.UUID

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