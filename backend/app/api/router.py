from fastapi import APIRouter

from api.routes import (
    events, 
    login, 
    tools, 
    users,
    seed_routes,
    calendar
)
from core.config import settings

api_router = APIRouter()
# api_router.include_router(path.router) # this is how you add api endpoint paths from the routes folder
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(events.router)
api_router.include_router(calendar.router)
api_router.include_router(tools.router)
api_router.include_router(seed_routes.router) #dummy data route
