from fastapi import APIRouter

from app.api.routes import *
from app.core.config import settings

api_router = APIRouter()
# api_router.include_router(path.router) # this is how you add api endpoint paths from the routes folder