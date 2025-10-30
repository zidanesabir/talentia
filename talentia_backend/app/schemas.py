from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str]


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str]


class Candidate(BaseModel):
    id: Optional[str]
    user_id: Optional[str]
    full_text: str
    created_at: Optional[datetime]
    embedding: Optional[List[float]]


class Job(BaseModel):
    id: Optional[str]
    title: str
    company: Optional[str]
    location: Optional[str]
    description: Optional[str]
    url: Optional[str]
    embedding: Optional[List[float]]
    scraped_at: Optional[datetime]
