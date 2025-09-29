from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware
import uvicorn

from app.api.router import api_router
from app.core.config import settings

def custom_generate_unique_id(route: APIRoute):
    return f'{route.tags[0]}-{route.name}'

app = FastAPI(
    title=settings.PROJECT_NAME,
    generate_unique_id_function=custom_generate_unique_id,
    openapi_url=f"{settings.API_STR}/openapi.json"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins= settings.all_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],     
)

app.include_router(api_router, prefix=settings.API_STR)