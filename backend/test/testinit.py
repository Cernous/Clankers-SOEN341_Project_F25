import pytest
from sqlmodel import Session
import requests
import json

from app.core.config import settings

URL = "http://localhost:8000/"

STUDENT_DATA = {
    "username": "clankStudent",
    "email": "clankStudent@clank.com",
    "password": "password123",
    "first_name": "Clank",
    "last_name": "Clink",
    "pronouns": "Clink/Clank",
    "date_of_birth": "2025-11-01"
}

### Test Fixtures ###
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
    global STUDENT_DATA
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