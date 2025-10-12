from sqlalchemy import Engine
from sqlmodel import Session, select, SQLModel

from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware
import uvicorn

from api.router import api_router
from core.config import settings
from core.sqlite_manager import engine, init_db

def custom_generate_unique_id(route: APIRoute):
    return f'{route.tags[0]}-{route.name}'

def init(db_engine: Engine) -> None:
    '''
        Checks if db is awake
    '''
    with Session(db_engine) as session:
        session.exec(select(1))
        init_db(session)

# SQLModel.metadata.create_all(engine) # Only Run on the first dry run without DB
# init(engine)

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