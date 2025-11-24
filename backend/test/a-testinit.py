
import sys
import uuid
import warnings
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from passlib.context import CryptContext
from sqlalchemy import func
from sqlalchemy.exc import SADeprecationWarning
from sqlmodel import Session, select

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

security.pwd_context = CryptContext(schemes=["plaintext"], deprecated="auto")

pytestmark = [
    pytest.mark.filterwarnings(
        "ignore:The Select.column\\(\\) method is deprecated.*",
        category=SADeprecationWarning,
    ),
    pytest.mark.filterwarnings(
        "ignore:.*session\\.query\\(\\).*deprecated.*",
        category=DeprecationWarning,
    ),
    pytest.mark.filterwarnings(
        "ignore:.*utcnow\\(\\) is deprecated.*",
        category=DeprecationWarning,
    ),
]

# Suppress upstream deprecation warnings to keep CI output clean.
warnings.filterwarnings(
    "ignore",
    message=".*Select\\.column\\(\\) method is deprecated.*",
    category=DeprecationWarning,
)
warnings.filterwarnings(
    "ignore",
    message=".*session\\.query\\(\\).*deprecated.*",
    category=DeprecationWarning,
)
warnings.filterwarnings(
    "ignore",
    message=".*utcnow\\(\\) is deprecated.*",
    category=DeprecationWarning,
)


def _build_user_payload(prefix: str = "user") -> dict[str, str]:
    suffix = uuid.uuid4().hex[:8]
    return {
        "username": f"{prefix}_{suffix}",
        "email": f"{prefix}_{suffix}@clank.com",
        "password": "ValidPass!2",
        "first_name": "Test",
        "last_name": "User",
        "pronouns": "they/them",
        "date_of_birth": "1999-01-01",
    }


def _event_payload() -> dict:
    start = datetime.now(timezone.utc)
    return {
        "name": "pytest-student-event",
        "description": "Students should not be able to create events",
        "price": 25.0,
        "location": "pytest-location",
        "start_time": start.isoformat(),
        "end_time": (start + timedelta(hours=2)).isoformat(),
        "tags": "pytest,blocked",
        "visibility": "public",
        "capacity": 10,
        "tickets_left": 10,
    }


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
    response = client.get(f"{settings.API_STR}/events/list")
    if response.status_code == 200:
        events = response.json()
        assert events, "No public events available"
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


@pytest.fixture()
def student_token_headers(client: TestClient) -> dict[str, str]:
    student_payload = _build_user_payload("student")
    response = client.post(
        f"{settings.API_STR}/users/signup/student",
        json=student_payload,
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
    public_events = client.get(f"{settings.API_STR}/events/list")
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


def test_login_rejects_invalid_password(client: TestClient) -> None:
    response = client.post(
        f"{settings.API_STR}/login/access-token",
        data={"username": "clankAdmin", "password": "bad-password"},
    )
    assert response.status_code == 400, response.text
    assert response.json()["detail"] == "Incorrect email or password"


def test_signup_rejects_duplicate_username(client: TestClient) -> None:
    payload = _build_user_payload("dupe_student")
    first = client.post(
        f"{settings.API_STR}/users/signup/student",
        json=payload,
    )
    assert first.status_code == 200, first.text

    duplicate = client.post(
        f"{settings.API_STR}/users/signup/student",
        json=payload,
    )
    assert duplicate.status_code == 403, duplicate.text


def test_signup_rejects_unknown_role(client: TestClient) -> None:
    payload = _build_user_payload("bad_role")
    with pytest.raises(TypeError):
        client.post(
            f"{settings.API_STR}/users/signup/notarole",
            json=payload,
        )


def test_student_cannot_create_event(
    client: TestClient,
    student_token_headers: dict[str, str],
) -> None:
    response = client.post(
        f"{settings.API_STR}/events",
        headers=student_token_headers,
        json=_event_payload(),
    )
    assert response.status_code == 403, response.text


def test_calendar_requires_authentication(client: TestClient) -> None:
    response = client.get(f"{settings.API_STR}/calendar/")
    assert response.status_code == 401, response.text


def test_moderation_delete_requires_admin(
    client: TestClient,
    organizer_token_headers: dict[str, str],
    superuser_token_headers: dict[str, str],
    admin_profile: dict,
) -> None:
    created = client.post(
        f"{settings.API_STR}/tools/moderation/queue",
        json={"user_id": admin_profile["id"], "desc": "pytest non-admin delete guard"},
    )
    assert created.status_code == 200, created.text
    req_id = created.json()["req"]

    unauthorized = client.delete(
        f"{settings.API_STR}/tools/moderation/queue/{req_id}",
        headers=organizer_token_headers,
    )
    assert unauthorized.status_code == 403, unauthorized.text

    cleanup = client.delete(
        f"{settings.API_STR}/tools/moderation/queue/{req_id}",
        headers=superuser_token_headers,
    )
    assert cleanup.status_code == 200, cleanup.text


def test_login_unknown_user_fails(client: TestClient) -> None:
    response = client.post(
        f"{settings.API_STR}/login/access-token",
        data={"username": "ghost_user", "password": "Nope123!"},
    )
    assert response.status_code == 400, response.text
    assert response.json()["detail"] == "Incorrect email or password"


def test_protected_analytics_requires_token(client: TestClient) -> None:
    response = client.get(f"{settings.API_STR}/tools/analytics/user_count")
    assert response.status_code == 401, response.text


def test_users_me_requires_authentication(client: TestClient) -> None:
    response = client.get(f"{settings.API_STR}/users/me")
    assert response.status_code == 401, response.text


def test_delete_me_forbidden_for_admin(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_STR}/users/me",
        headers=superuser_token_headers,
    )
    assert response.status_code == 403, response.text


def test_get_user_unknown_returns_404(client: TestClient) -> None:
    missing_id = str(uuid.uuid4())
    response = client.get(f"{settings.API_STR}/users/{missing_id}")
    assert response.status_code == 404, response.text


def test_update_me_email_conflict(client: TestClient) -> None:
    user1 = _build_user_payload("conflict_one")
    user2 = _build_user_payload("conflict_two")

    first = client.post(f"{settings.API_STR}/users/signup/student", json=user1)
    assert first.status_code == 200, first.text
    headers = {"Authorization": f"Bearer {first.json()['access_token']}"}

    second = client.post(f"{settings.API_STR}/users/signup/student", json=user2)
    assert second.status_code == 200, second.text

    conflict = client.patch(
        f"{settings.API_STR}/users/me/update",
        headers=headers,
        json={"email": user2["email"]},
    )
    assert conflict.status_code == 409, conflict.text


def test_signup_organizer_can_create_event(
    client: TestClient, organizer_token_headers: dict[str, str]
) -> None:
    payload = _event_payload()
    payload["name"] = f"pytest-event-{uuid.uuid4().hex[:6]}"
    created = client.post(
        f"{settings.API_STR}/events",
        headers=organizer_token_headers,
        json=payload,
    )
    assert created.status_code == 200, created.text
    body = created.json()
    assert body["name"] == payload["name"]
    assert "id" in body


def test_signup_missing_password_validation(client: TestClient) -> None:
    payload = _build_user_payload("missing_pw")
    payload.pop("password")
    response = client.post(
        f"{settings.API_STR}/users/signup/student",
        json=payload,
    )
    assert response.status_code == 422, response.text


def test_event_detail_nonexistent_404(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_STR}/events/999999",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404, response.text


def test_patch_event_wrong_organizer_forbidden(
    client: TestClient, organizer_token_headers: dict[str, str]
) -> None:
    creator_event = _event_payload()
    creator_event["name"] = f"creator-event-{uuid.uuid4().hex[:6]}"
    created = client.post(
        f"{settings.API_STR}/events",
        headers=organizer_token_headers,
        json=creator_event,
    )
    assert created.status_code == 200, created.text
    event_id = created.json()["id"]

    other_payload = _build_user_payload("other_org")
    other_response = client.post(
        f"{settings.API_STR}/users/signup/organizer",
        json=other_payload,
    )
    assert other_response.status_code == 200, other_response.text
    other_headers = {"Authorization": f"Bearer {other_response.json()['access_token']}"}

    forbidden = client.patch(
        f"{settings.API_STR}/events/{event_id}",
        headers=other_headers,
        json={
            "name": "should-not-update",
            "visibility": "public",
            "state": "upcoming",
        },
    )
    assert forbidden.status_code == 403, forbidden.text


def test_calendar_delete_nonexistent_event(
    client: TestClient, student_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_STR}/calendar/999999",
        headers=student_token_headers,
    )
    assert response.status_code == 404, response.text


def test_moderation_delete_nonexistent_entry(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_STR}/tools/moderation/queue/999999",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404, response.text


def test_tools_user_count_requires_admin(
    client: TestClient, organizer_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_STR}/tools/analytics/user_count",
        headers=organizer_token_headers,
    )
    assert response.status_code == 403, response.text


def test_tools_pronoun_count_requires_admin(
    client: TestClient, organizer_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_STR}/tools/analytics/pronoun_count",
        headers=organizer_token_headers,
    )
    assert response.status_code == 403, response.text


def test_tools_average_age_requires_admin(
    client: TestClient, organizer_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_STR}/tools/analytics/average_age",
        headers=organizer_token_headers,
    )
    assert response.status_code == 403, response.text


def test_add_ticket_unknown_event_404(
    client: TestClient, student_token_headers: dict[str, str]
) -> None:
    response = client.post(
        f"{settings.API_STR}/events/999999/add_ticket/",
        headers=student_token_headers,
        params={"ticket": "TEST-TICKET-1"},
    )
    assert response.status_code in (400, 404), response.text


def test_signup_duplicate_email_rejected(client: TestClient) -> None:
    first = _build_user_payload("dupe_email_one")
    second = _build_user_payload("dupe_email_two")
    second["email"] = first["email"]

    created = client.post(f"{settings.API_STR}/users/signup/student", json=first)
    assert created.status_code == 200, created.text

    duplicate = client.post(f"{settings.API_STR}/users/signup/student", json=second)
    assert duplicate.status_code == 403, duplicate.text
