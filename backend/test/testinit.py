import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path
import importlib
import time

import pytest
import requests
from sqlmodel import Session, select

ROOT_PATH = Path(__file__).resolve().parents[1]
APP_PATH = ROOT_PATH / "app"
if str(APP_PATH) not in sys.path:
    sys.path.insert(0, str(APP_PATH))

models = importlib.import_module("models")
sys.modules.setdefault("app.models", models)

from core.config import settings
from core.sqlite_manager import engine

Attendees = models.Attendees
EventDB = models.EventDB

URL = "http://localhost:8000/"
BASE_URL = f"{URL.rstrip('/')}{settings.API_STR}"


def api_url(path: str) -> str:
    if not path.startswith("/"):
        path = f"/{path}"
    return f"{BASE_URL}{path}"


@pytest.fixture
def client():
    session = requests.Session()
    return session


@pytest.fixture
def db_session():
    with Session(engine) as session:
        yield session


@pytest.fixture
def admin_headers(client: requests.Session) -> dict[str, str]:
    response = client.post(
        api_url("/login/access-token"),
        data={
            "username": "clankAdmin",
            "password": settings.FIRST_SUPERUSER_PASSWORD,
        },
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def create_user(client: requests.Session):
    def _create(role: str = "student", **overrides):
        unique = uuid.uuid4().hex[:8]
        payload = {
            "username": f"{role}_{unique}",
            "email": f"{role}_{unique}@example.com",
            "password": "Password123!",
            "first_name": "Test",
            "last_name": "User",
            "pronouns": "they/them",
            "date_of_birth": "2000-01-01",
        }
        payload.update(overrides)

        response = client.post(
            api_url(f"/users/signup/{role}"),
            json=payload,
        )
        assert response.status_code == 200, response.text
        login_response = client.post(
            api_url("/login/access-token"),
            data={
                "username": payload["username"],
                "password": payload["password"],
            },
        )
        assert login_response.status_code == 200, login_response.text
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        user_record = None
        for _ in range(10):
            with Session(engine) as session:
                user_record = session.exec(
                    select(models.User).where(models.User.username == payload["username"])
                ).first()
            if user_record:
                break
            time.sleep(0.1)
        assert user_record is not None, "User not persisted in database"

        profile_response = None
        for _ in range(30):
            profile_response = client.get(api_url("/users/me"), headers=headers)
            if profile_response.status_code == 200:
                break
            time.sleep(0.3)
        assert profile_response is not None and profile_response.status_code == 200, (
            profile_response.text if profile_response else "Profile lookup failed"
        )

        return {
            "token": token,
            "headers": headers,
            "payload": payload,
            "id": user_record.id,
            "profile": profile_response.json(),
        }

    return _create


@pytest.fixture
def create_event_record(db_session: Session):
    def _create(**overrides):
        now = datetime.utcnow()
        event = EventDB(
            name=overrides.pop("name", f"Event-{uuid.uuid4().hex[:6]}"),
            description=overrides.pop("description", "Integration test event"),
            price=overrides.pop("price", 15.0),
            location=overrides.pop("location", "Campus Hall"),
            start_time=overrides.pop("start_time", now + timedelta(days=2)),
            end_time=overrides.pop("end_time", now + timedelta(days=2, hours=2)),
            organizer_id=overrides.pop("organizer_id", 9999),
            tags=overrides.pop("tags", "integration"),
            visibility=overrides.pop("visibility", "public"),
            state=overrides.pop("state", "upcoming"),
            count_attendees=overrides.pop("count_attendees", 0),
            tickets_left=overrides.pop("tickets_left", 50),
            pictures=overrides.pop("pictures", None),
        )
        for field, value in overrides.items():
            setattr(event, field, value)

        db_session.add(event)
        db_session.commit()
        db_session.refresh(event)
        return event

    return _create


def make_event_payload(**overrides) -> dict[str, object]:
    now = datetime.utcnow()
    payload = {
        "name": f"Integration Event {uuid.uuid4().hex[:6]}",
        "description": "Event created via API",
        "price": 25.0,
        "location": "Integration Venue",
        "start_time": (now + timedelta(days=3)).isoformat(),
        "end_time": (now + timedelta(days=3, hours=3)).isoformat(),
        "visibility": "public",
        "tags": "integration,test",
        "pictures": None,
    }
    payload.update(overrides)
    return payload


def make_event_update_payload(**overrides) -> dict[str, object]:
    now = datetime.utcnow()
    payload = {
        "name": "Updated Event",
        "description": "Updated integration test event",
        "price": 35.0,
        "location": "Updated Venue",
        "start_time": (now + timedelta(days=4)).isoformat(),
        "end_time": (now + timedelta(days=4, hours=2)).isoformat(),
        "tags": "updated,test",
        "pictures": None,
        "visibility": "public",
        "state": "upcoming",
    }
    payload.update(overrides)
    return payload


def test_seed_database(client: requests.Session, admin_headers: dict[str, str]) -> None:
    response = client.post(api_url("/seed-database"), headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["message"].startswith("Dummy users and events")


def test_signup_student_returns_token(create_user) -> None:
    new_user = create_user(role="student")
    assert isinstance(new_user["token"], str)
    assert new_user["profile"]["role"] == "student"


def test_signup_organizer_returns_token(create_user) -> None:
    organizer = create_user(role="organizer")
    assert isinstance(organizer["token"], str)
    assert organizer["profile"]["role"] == "organizer"


def test_login_access_token(client: requests.Session, create_user) -> None:
    user = create_user(role="student")
    response = client.post(
        api_url("/login/access-token"),
        data={
            "username": user["payload"]["username"],
            "password": user["payload"]["password"],
        },
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_get_me_returns_current_user(client: requests.Session, create_user) -> None:
    user = create_user()
    response = client.get(api_url("/users/me"), headers=user["headers"])
    assert response.status_code == 200
    assert response.json()["id"] == user["id"]


def test_update_me_allows_profile_changes(client: requests.Session, create_user) -> None:
    user = create_user()
    response = client.patch(
        api_url("/users/me/update"),
        json={"first_name": "Updated", "pronouns": "she/her"},
        headers=user["headers"],
    )
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Updated"
    assert data["pronouns"] == "she/her"


def test_update_password_changes_credentials(client: requests.Session, create_user) -> None:
    user = create_user(password="Password123!")
    response = client.patch(
        api_url("/users/me/update-password"),
        json={
            "current_password": user["payload"]["password"],
            "new_password": "NewPassword123!",
        },
        headers=user["headers"],
    )
    assert response.status_code == 200

    login_response = client.post(
        api_url("/login/access-token"),
        data={
            "username": user["payload"]["username"],
            "password": "NewPassword123!",
        },
    )
    assert login_response.status_code == 200


def test_delete_me_removes_user(client: requests.Session, create_user) -> None:
    user = create_user()
    response = client.delete(api_url("/users/me"), headers=user["headers"])
    assert response.status_code == 200

    login_response = client.post(
        api_url("/login/access-token"),
        data={
            "username": user["payload"]["username"],
            "password": user["payload"]["password"],
        },
    )
    assert login_response.status_code == 400


def test_admin_can_retrieve_user_by_id(
    client: requests.Session,
    admin_headers: dict[str, str],
    create_user,
) -> None:
    user = create_user()
    response = client.get(
        api_url(f"/users/{user['id']}"),
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert response.json()["id"] == user["id"]


def test_admin_can_get_all_users(
    client: requests.Session,
    admin_headers: dict[str, str],
    create_user,
) -> None:
    create_user()
    response = client.get(api_url("/tools/users/get-all-users"), headers=admin_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert response.json()


def test_admin_can_get_all_organizers(
    client: requests.Session,
    admin_headers: dict[str, str],
    create_user,
) -> None:
    organizer = create_user(role="organizer")
    response = client.get(
        api_url("/tools/users/get-all-organizers"),
        headers=admin_headers,
    )
    assert response.status_code == 200
    organizers = response.json()
    assert any(entry["id"] == organizer["profile"]["id"] for entry in organizers)


def test_admin_can_delete_user(
    client: requests.Session,
    admin_headers: dict[str, str],
    create_user,
) -> None:
    user = create_user()
    response = client.delete(
        api_url(f"/tools/users/delete/{user['id']}"),
        headers=admin_headers,
    )
    assert response.status_code == 200

    login_response = client.post(
        api_url("/login/access-token"),
        data={
            "username": user["payload"]["username"],
            "password": user["payload"]["password"],
        },
    )
    assert login_response.status_code == 400


def test_list_events_public(client: requests.Session, create_event_record) -> None:
    create_event_record()
    response = client.get(api_url("/events/list"))
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_event_as_organizer(client: requests.Session, create_user) -> None:
    organizer = create_user(role="organizer")
    payload = make_event_payload()
    response = client.post(api_url("/events"), json=payload, headers=organizer["headers"])
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"] == payload["name"]


def test_read_event_as_student(
    client: requests.Session,
    create_user,
    create_event_record,
) -> None:
    event = create_event_record()
    student = create_user(role="student")
    response = client.get(
        api_url(f"/events/{event.id}"),
        headers=student["headers"],
    )
    assert response.status_code == 200
    assert response.json()["name"] == event.name


def test_update_event_put_admin(
    client: requests.Session,
    admin_headers: dict[str, str],
    create_event_record,
) -> None:
    event = create_event_record()
    payload = make_event_update_payload()
    response = client.put(
        api_url(f"/events/{event.id}"),
        json=payload,
        headers=admin_headers,
    )
    assert response.status_code == 200, response.text
    assert response.json()["description"] == payload["description"]


def test_patch_event_admin(
    client: requests.Session,
    admin_headers: dict[str, str],
    create_event_record,
) -> None:
    event = create_event_record()
    response = client.patch(
        api_url(f"/events/{event.id}"),
        json={
            "description": "Patched description",
            "visibility": "public",
            "state": "upcoming",
        },
        headers=admin_headers,
    )
    assert response.status_code == 200, response.text
    assert response.json()["description"] == "Patched description"


def test_delete_event_admin(
    client: requests.Session,
    admin_headers: dict[str, str],
    create_event_record,
) -> None:
    event = create_event_record()
    response = client.delete(
        api_url(f"/events/{event.id}"),
        json={"visibility": "public", "state": "upcoming"},
        headers=admin_headers,
    )
    assert response.status_code == 200

    with Session(engine) as verification_session:
        assert verification_session.get(EventDB, event.id) is None


def test_add_and_remove_ticket_flow(
    client: requests.Session,
    create_user,
    create_event_record,
) -> None:
    event = create_event_record(tickets_left=5)
    attendee = create_user(role="student", date_of_birth="2001-06-01")

    add_response = client.post(
        api_url(f"/{event.id}/add_ticket/"),
        headers=attendee["headers"],
    )
    assert add_response.status_code == 200

    with Session(engine) as refresh_session:
        db_event = refresh_session.get(EventDB, event.id)
        assert db_event.tickets_left == 4

    remove_response = client.post(
        api_url(f"/{event.id}/remove_ticket"),
        headers=attendee["headers"],
    )
    assert remove_response.status_code == 200

    with Session(engine) as refresh_session:
        db_event = refresh_session.get(EventDB, event.id)
        assert db_event.tickets_left == 5
        attendees = refresh_session.query(Attendees).filter(
            Attendees.event_id == event.id,
            Attendees.user_id == attendee["id"],
        ).all()
        assert not attendees


def test_event_average_age_requires_attendees(
    client: requests.Session,
    create_user,
    create_event_record,
) -> None:
    event = create_event_record(tickets_left=10)
    attendee = create_user(role="student", date_of_birth="2000-02-02")
    organizer = create_user(role="organizer")

    add_response = client.post(
        api_url(f"/{event.id}/add_ticket/"),
        headers=attendee["headers"],
    )
    assert add_response.status_code == 200

    response = client.get(
        api_url(f"/tools/analytics/average_age/{event.id}"),
        headers=organizer["headers"],
    )
    assert response.status_code == 200
    assert "average_age" in response.json()


def test_get_all_events_detail_admin(
    client: requests.Session,
    admin_headers: dict[str, str],
    create_event_record,
) -> None:
    create_event_record()
    response = client.get(
        api_url("/tools/analytics/get-all-events/detail"),
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_analytics_user_count(
    client: requests.Session,
    admin_headers: dict[str, str],
    create_user,
) -> None:
    create_user()
    response = client.get(
        api_url("/tools/analytics/user_count"),
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert isinstance(response.json()["number"], int)


def test_analytics_organizer_count(
    client: requests.Session,
    admin_headers: dict[str, str],
    create_user,
) -> None:
    create_user(role="organizer")
    response = client.get(
        api_url("/tools/analytics/organizer_count"),
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert isinstance(response.json()["number"], int)


def test_analytics_pronoun_count(
    client: requests.Session,
    admin_headers: dict[str, str],
    create_user,
) -> None:
    create_user()
    response = client.get(
        api_url("/tools/analytics/pronoun_count"),
        headers=admin_headers,
    )
    assert response.status_code == 200
    pronoun_data = response.json()
    assert isinstance(pronoun_data, dict)
    assert all(isinstance(value, int) for value in pronoun_data.values())


def test_analytics_average_age(
    client: requests.Session,
    admin_headers: dict[str, str],
    create_user,
) -> None:
    create_user(date_of_birth="1995-05-05")
    response = client.get(
        api_url("/tools/analytics/average_age"),
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert "average_age" in response.json()
