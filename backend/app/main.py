from fastapi import FastAPI
from fastapi.routing import APIRoute

from app.api.router import api_router
from app.core.config import settings

engine = create_engine("sqlite:///database.db")
SQLModel.metadata.create_all(engine)
