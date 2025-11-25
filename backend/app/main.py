import json
from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from api.router import api_router
from core.config import settings
from core.sqlite_manager import engine, db_create, db_init


def custom_generate_unique_id(route: APIRoute):
    return f"{route.tags[0]}-{route.name}"


def generate_openapi_client():
    f = open("openapi.json", "w")
    f.write(json.dumps(app.openapi()))
    f.close()


db_create(engine)  # only runs on the first dry run without DB
db_init(engine)  # sets up superuser if not already there

app = FastAPI(
    title=settings.PROJECT_NAME,
    generate_unique_id_function=custom_generate_unique_id,
    openapi_url=f"{settings.API_STR}/openapi.json",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.all_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_STR)

generate_openapi_client()
