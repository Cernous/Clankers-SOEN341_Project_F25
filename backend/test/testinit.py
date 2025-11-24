"""Integration tests that exercise FastAPI route validation through TestClient."""

import sys
import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from passlib.context import CryptContext
from sqlalchemy import func
from sqlmodel import Session, select

# Ensure local packages (app/, api/) are importable when running pytest/debugger from backend/
BASE_DIR = Path(__file__).resolve().parents[1]
APP_DIR = BASE_DIR / "app"
for path in (BASE_DIR, APP_DIR):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from core.config import settings
from core.sqlite_manager import engine
from main import app
from models import User, UserCreate, UserRole
from core import security
import crud

# Use a simple hash scheme for tests to avoid missing bcrypt backend locally.
security.pwd_context = CryptContext(schemes=["plaintext"], deprecated="auto")


@pytest.fixture(scope="session")
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    def _login() -> dict:
        resp = client.post(
            f"{settings.API_STR}/login/access-token",
            data={
                "username": "clankAdmin",
                "password": settings.FIRST_SUPERUSER_PASSWORD,
            },
        )
        return resp

    response = _login()

    # If admin creds are stale locally, reset them so we can hit protected routes.
    if response.status_code != 200:
        with Session(engine) as session:
            user = session.exec(
                select(User).where(func.lower(User.username) == func.lower("clankAdmin"))
            ).first()
            hashed = crud.get_password_hash(settings.FIRST_SUPERUSER_PASSWORD)
            if user:
                user.hashed_password = hashed
                user.role = UserRole.ADMIN
                session.add(user)
                session.commit()
            else:
                user_in = UserCreate(
                    email=settings.FIRST_SUPERUSER,
                    username="clankAdmin",
                    password=settings.FIRST_SUPERUSER_PASSWORD,
                    role=UserRole.ADMIN,
                )
                crud.create_user(session=session, user_create=user_in)

        response = _login()

    assert response.status_code == 200, response.text
    auth_token = response.json()["access_token"]
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(scope="session", autouse=True)
def seed_database(client: TestClient, superuser_token_headers: dict[str, str]) -> None:
    response = client.post(
        f"{settings.API_STR}/seed-database",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200, response.text


@pytest.fixture(scope="session")
def admin_profile(client: TestClient, superuser_token_headers: dict[str, str]) -> dict:
    response = client.get(
        f"{settings.API_STR}/users/me",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200, response.text
    return response.json()


@pytest.fixture(scope="session")
def seeded_event_id(seed_database: None, client: TestClient) -> int:
    response = client.get(f"{settings.API_STR}/events/pub/list")
    if response.status_code == 200:
        events = response.json()
        assert events, "No public events available after seeding"
        return events[0]["id"]

    # If the static list path conflicts and returns a validation error, fall back to random.
    alt = client.get(f"{settings.API_STR}/events/random")
    assert alt.status_code == 200, alt.text
    event = alt.json()
    assert "id" in event, f"Random event payload missing id: {event}"
    return event["id"]


@pytest.fixture()
def organizer_token_headers(client: TestClient) -> dict[str, str]:
    suffix = uuid.uuid4().hex[:6]
    organizer_payload = {
        "username": f"organizer_{suffix}",
        "email": f"organizer_{suffix}@clank.com",
        "password": "Organ1zer!2",
        "first_name": "Org",
        "last_name": "User",
        "pronouns": "they/them",
        "date_of_birth": "1999-01-01",
    }
    response = client.post(
        f"{settings.API_STR}/users/signup/organizer",
        json=organizer_payload,
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_openapi_schema_is_available(client: TestClient) -> None:
    response = client.get(f"{settings.API_STR}/openapi.json")
    assert response.status_code == 200, response.text
    schema = response.json()
    paths = set(schema["paths"].keys())
    assert f"{settings.API_STR}/login/access-token" in paths
    assert f"{settings.API_STR}/users/signup/{{userRole}}" in paths
    assert any(p.startswith(f"{settings.API_STR}/events/pub") for p in paths)


def test_admin_tools_and_analytics(client: TestClient, superuser_token_headers: dict[str, str]) -> None:
    user_count = client.get(
        f"{settings.API_STR}/tools/analytics/user_count",
        headers=superuser_token_headers,
    )
    assert user_count.status_code == 200, user_count.text
    assert isinstance(user_count.json()["number"], int)

    organizer_count = client.get(
        f"{settings.API_STR}/tools/analytics/organizer_count",
        headers=superuser_token_headers,
    )
    assert organizer_count.status_code == 200, organizer_count.text
    assert isinstance(organizer_count.json()["number"], int)

    pronouns_count = client.get(
        f"{settings.API_STR}/tools/analytics/pronoun_count",
        headers=superuser_token_headers,
    )
    assert pronouns_count.status_code == 200, pronouns_count.text
    for value in pronouns_count.json().values():
        assert isinstance(value, int)

    average_age = client.get(
        f"{settings.API_STR}/tools/analytics/average_age",
        headers=superuser_token_headers,
    )
    assert average_age.status_code == 200, average_age.text
    assert "average_age" in average_age.json()


def test_admin_user_listings(client: TestClient, superuser_token_headers: dict[str, str]) -> None:
    all_users = client.get(
        f"{settings.API_STR}/tools/users/get-all-users",
        headers=superuser_token_headers,
    )
    assert all_users.status_code == 200, all_users.text
    assert isinstance(all_users.json(), list)

    organizers = client.get(
        f"{settings.API_STR}/tools/users/get-all-organizers",
        headers=superuser_token_headers,
    )
    assert organizers.status_code == 200, organizers.text
    assert isinstance(organizers.json(), list)


def test_public_event_endpoints(client: TestClient, seeded_event_id: int) -> None:
    public_events = client.get(f"{settings.API_STR}/events/pub/list")
    assert public_events.status_code == 200, public_events.text
    assert isinstance(public_events.json(), list)

    random_event = client.get(f"{settings.API_STR}/events/random")
    assert random_event.status_code == 200, random_event.text

    event_detail = client.get(f"{settings.API_STR}/events/pub/{seeded_event_id}")
    assert event_detail.status_code == 200, event_detail.text
    assert event_detail.json()["id"] == seeded_event_id


def test_event_average_age_as_organizer(
    client: TestClient,
    organizer_token_headers: dict[str, str],
    seeded_event_id: int,
) -> None:
    response = client.get(
        f"{settings.API_STR}/tools/analytics/average_age/{seeded_event_id}",
        headers=organizer_token_headers,
    )
    assert response.status_code == 200, response.text
    assert "average_age" in response.json()


def test_moderation_queue_roundtrip(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    admin_profile: dict,
) -> None:
    created = client.post(
        f"{settings.API_STR}/tools/moderation/queue",
        json={
            "user_id": admin_profile["id"],
            "desc": "pytest moderation check",
        },
    )
    assert created.status_code == 200, created.text
    req_id = created.json()["req"]

    fetched = client.get(f"{settings.API_STR}/tools/moderation/queue")
    assert fetched.status_code == 200, fetched.text
    assert any(entry["req"] == req_id for entry in fetched.json())

    deleted = client.delete(
        f"{settings.API_STR}/tools/moderation/queue/{req_id}",
        headers=superuser_token_headers,
    )
    assert deleted.status_code == 200, deleted.text


def test_student_flow_and_calendar(client: TestClient, seeded_event_id: int) -> None:
    suffix = uuid.uuid4().hex[:8]
    student_payload = {
        "username": f"student_{suffix}",
        "email": f"student_{suffix}@clank.com",
        "password": "Stud3ntTest!",
        "first_name": "Clank",
        "last_name": "Clink",
        "pronouns": "Clink/Clank",
        "date_of_birth": "2000-01-01",
    }

    signup_response = client.post(
        f"{settings.API_STR}/users/signup/student",
        json=student_payload,
    )
    assert signup_response.status_code == 200, signup_response.text
    headers = {"Authorization": f"Bearer {signup_response.json()['access_token']}"}

    login_response = client.post(
        f"{settings.API_STR}/login/access-token",
        data={
            "username": student_payload["username"],
            "password": student_payload["password"],
        },
    )
    assert login_response.status_code == 200, login_response.text
    headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}

    new_password = "ClinkClank12!"
    password_update = client.patch(
        f"{settings.API_STR}/users/me/update-password",
        headers=headers,
        json={
            "current_password": student_payload["password"],
            "new_password": new_password,
        },
    )
    assert password_update.status_code == 200, password_update.text
    student_payload["password"] = new_password

    refreshed_login = client.post(
        f"{settings.API_STR}/login/access-token",
        data={
            "username": student_payload["username"],
            "password": student_payload["password"],
        },
    )
    assert refreshed_login.status_code == 200, refreshed_login.text
    headers = {"Authorization": f"Bearer {refreshed_login.json()['access_token']}"}

    profile_update = client.patch(
        f"{settings.API_STR}/users/me/update",
        headers=headers,
        json={"first_name": "Clonk"},
    )
    assert profile_update.status_code == 200, profile_update.text

    me_response = client.get(f"{settings.API_STR}/users/me", headers=headers)
    assert me_response.status_code == 200, me_response.text
    assert me_response.json()["first_name"] == "Clonk"

    calendar_add = client.post(
        f"{settings.API_STR}/calendar/{seeded_event_id}",
        headers=headers,
    )
    assert calendar_add.status_code == 200, calendar_add.text

    calendar_list = client.get(f"{settings.API_STR}/calendar/", headers=headers)
    assert calendar_list.status_code == 200, calendar_list.text
    calendar_body = calendar_list.json()
    assert isinstance(calendar_body, list)
    assert any(event["id"] == seeded_event_id for event in calendar_body)

    calendar_delete = client.delete(
        f"{settings.API_STR}/calendar/{seeded_event_id}",
        headers=headers,
    )
    assert calendar_delete.status_code == 200, calendar_delete.text

    delete_response = client.delete(
        f"{settings.API_STR}/users/me",
        headers=headers,
    )
    assert delete_response.status_code == 200, delete_response.text
