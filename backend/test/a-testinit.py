"""
    Order of the functions/test fixture matters
    Please beware!
"""

import pytest
from sqlmodel import Session
import requests
import json

from app.core.config import settings

URL: str = "http://localhost:8000/"

STUDENT_DATA: dict = {
    "username": "clankStudent",
    "email": "clankStudent@clank.com",
    "password": "password123",
    "first_name": "Clank",
    "last_name": "Clink",
    "pronouns": "Clink/Clank",
    "date_of_birth": "2025-11-01"
}

STUDENT_HEADERS: dict | None = None

"""
    Test Fixtures
"""
@pytest.fixture
def client():
    client = requests.Session()
    return client

@pytest.fixture
def superuser_token_headers(client: requests.Session) -> dict[str, str]:
    data = {
        "username": "clankAdmin",
        "password": settings.FIRST_SUPERUSER_PASSWORD
    }

    response = client.post(
        f"{URL}{settings.API_STR}/login/access-token",
        data=data
    )

    response = response.json()
    auth_token = response["access_token"]
    headers = {"Authorization": f"Bearer {auth_token}"}
    return headers

### Actual Tests
"""
    Admin Analytics
"""
def test_seed_database(client:requests.Session, superuser_token_headers: dict[str, str]) -> None:
    """
        Seed Database Check 
        NOTE: WILL FAIL! if the database has already been seeded
    """
    response = client.post(
        f"{URL}{settings.API_STR}/seed-database/",
        headers=superuser_token_headers
    )
    # This needs to be inaccessible to a regular user
    assert response.status_code == 200


def test_analytics_user_count(client: requests.Session, superuser_token_headers: dict[str, str]) -> None:
    """
        Analytics User Count Check 
        - Scope: Admin
    """
    response = client.get(
        f"{URL}{settings.API_STR}/tools/analytics/user_count",
        headers=superuser_token_headers
    )
    # This needs to be inaccessible to a regular user
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data["number"], (int))

def test_analytics_organizer_count(client:requests.Session, superuser_token_headers: dict[str, str]) -> None:
    """
        Analytics Organizer Count Check 
        - Scope: Admin
    """
    response = client.get(
        f"{URL}{settings.API_STR}/tools/analytics/organizer_count",
        headers=superuser_token_headers
    )
    # This needs to be inaccessible to a regular user
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data["number"], (int))

def test_analytics_pronouns_count(client: requests.Session, superuser_token_headers: dict[str, str]) -> None:
    """
        Analytics Pronouns Count 
        - Scope: Admin
    """
    response = client.get(
        f"{URL}{settings.API_STR}/tools/analytics/pronoun_count",
        headers=superuser_token_headers
    )
    # This needs to be inaccessible to a regular user
    data:dict = response.json()
    assert response.status_code == 200
    for key in data.keys():
        assert isinstance(data[key], int)

def test_analytics_average_age(client: requests.Session, superuser_token_headers: dict[str, str]) -> None:
    """
        Analytics Average Age 
        - Scope: Admin
    """
    response = client.get(
        f"{URL}{settings.API_STR}/tools/analytics/average_age",
        headers=superuser_token_headers
    )
    # This needs to be inaccessible to a regular user
    data:dict = response.json()
    assert response.status_code == 200
    assert list(data.keys())[0] == "average_age"
    for key in data.keys():
        assert isinstance(data[key], float)

"""
    Student Flow
"""

def test_sign_up_student(client:requests.Session) -> None:
    """
        Sign Up as a Student 
        - Scope: Public
    """
    global STUDENT_DATA
    response = client.post(
        f"{URL}{settings.API_STR}/users/signup/student",
        json=STUDENT_DATA
    )
    print(response.text)
    assert response.status_code == 200
    assert isinstance(response.json()["access_token"], str)
    assert response.json()["token_type"] == "bearer"

def test_sign_in_student(client:requests.Session) -> None:
    """
        Sign In as a Student
        - Scope: Public
    """
    global STUDENT_DATA, STUDENT_HEADERS
    response = client.post(
        f"{URL}{settings.API_STR}/login/access-token",
        data={
            "username":STUDENT_DATA["username"],
            "password":STUDENT_DATA["password"]
        }
    )

    assert response.status_code == 200
    assert isinstance(response.json()["access_token"], str)
    assert response.json()["token_type"] == "bearer"

    if response.status_code == 200:
        STUDENT_HEADERS = {"Authorization": f"bearer {response.json()["access_token"]}"}

def test_update_password(client:requests.Session) -> None:
    """
        Update Student Password as the current user
        - Scope: student
    """
    global STUDENT_DATA, STUDENT_HEADERS
    new_password = "clinkclank12~"
    
    response = client.patch(
        f"{URL}{settings.API_STR}/users/me/update-password",
        headers=STUDENT_HEADERS,
        json={
            "current_password": STUDENT_DATA["password"],
            "new_password": new_password
        }
    )

    assert response.status_code == 200
    assert isinstance(response.json()["message"], str)

    STUDENT_DATA["password"] = new_password

def test_update_student(client:requests.Session) -> None:
    """
        Update student profile information as the current user
        - Scope: student
    """
    global STUDENT_HEADERS, STUDENT_DATA
    response = client.patch(
        f"{URL}{settings.API_STR}/users/me/update",
        headers=STUDENT_HEADERS,
        json={
            "first_name": "Clonk"
        }
    )
    assert response.status_code == 200
    data = response.json()
    for key in data.keys():
        assert isinstance(data[key], str)
    
    STUDENT_DATA["first_name"] = "Clonk"

def test_get_student_data(client: requests.Session) -> None:
    """
        Obtains the student data as the current user
        - Scope: student
    """
    global STUDENT_HEADERS, STUDENT_DATA
    response = client.get(
        f"{URL}{settings.API_STR}/users/me",
        headers=STUDENT_HEADERS
    )
    data = response.json()
    assert response.status_code == 200
    for key in data.keys():
        assert isinstance(data[key], str)
        if key in STUDENT_DATA:
            assert STUDENT_DATA[key] == data[key]

def test_events_list(client: requests.Session) -> None:
    global STUDENT_HEADERS, STUDENT_DATA
    response = client.get(
        f"{URL}{settings.API_STR}/events/list",
        headers=STUDENT_HEADERS
    )
    data_keys = [
        "id",
        "name",
        "description",
        "price",
        "location",
        "start_time",
        "end_time",
        "tags",
        "pictures",
        "organizer_id"
    ]
    data = response.json()
    assert response.status_code == 200
    if len(data) == 0:
        assert str(response) == "[]"
    else:
        for key in data_keys:
            assert key in data[0].keys()

def test_delete_student(client: requests.Session) -> None:
    """
        Delete the student as the current user
        - Scope: student
    """
    global STUDENT_HEADERS, STUDENT_DATA
    response = client.delete(
        f"{URL}{settings.API_STR}/users/me",
        headers=STUDENT_HEADERS,
    )

    assert response.status_code == 200
    assert isinstance(response.json()["message"], str)

"""

"""