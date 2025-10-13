from datetime import timedelta
from app.core import security

def test_password_hash_and_verify():
    password = "supersecret"
    hashed = security.get_password_hash(password)
    assert security.verify_password(password, hashed)

def test_create_access_token():
    token = security.create_access_token("user123", expires_delta=timedelta(seconds=3600))
    assert isinstance(token, str)



# test working pipeline after JWT/YAML fixes
