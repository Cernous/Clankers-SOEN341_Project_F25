from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session
import requests

from app.core.config import settings

URL = "http://localhost:8000/"

@pytest.fixture
def client():
    client = requests.Session()
    return client

@pytest.fixture
def superuser_token_headers(client: requests.Session) -> dict[str, str]:
    data = {
        "username": settings.FIRST_SUPERUSER,
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

def test_seed_database(client:requests.Session, superuser_token_headers: dict[str, str]) -> None:
    
    response = client.post(
        f"{URL}{settings.API_STR}/seed-database/",
        headers=superuser_token_headers
    )
    # This needs to be inaccessible to a regular user
    assert response.status_code == 200