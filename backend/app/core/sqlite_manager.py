from sqlmodel import Session, create_engine, select, func
import crud
from core.config import settings
from models import User, UserCreate

engine = create_engine("sqlite:///database.db")

def init_db(session: Session) -> None:
    user = session.exec(
        select(User).where(func.lower(User.email) == func.lower(settings.FIRST_SUPERUSER))
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            username=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            role="admin"
        )
        user = crud.create_user(session=session, user_create=user_in)