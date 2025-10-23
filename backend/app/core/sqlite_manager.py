from sqlmodel import Session, create_engine, select, SQLModel
import crud
from core.config import settings
from models import User, UserCreate
from sqlalchemy.engine import Engine
import os

engine = create_engine("sqlite:///database.db")

def db_create(db_engine: Engine) -> None:
    db_exists = os.path.exists("database.db")
    if not db_exists:
        SQLModel.metadata.create_all(db_engine)

def def_admin_create(session: Session) -> None:
    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            username=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            role="admin"
        )
        user = crud.create_user(session=session, user_create=user_in)

def db_init(db_engine: Engine) -> None:
    '''
        checks if db is awake
    '''
    with Session(db_engine) as session:
        session.exec(select(1))
        def_admin_create(session)
