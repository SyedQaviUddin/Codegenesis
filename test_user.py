import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_register_user():
    response = client.post("/users/register", json={
        "username": "testuser",
        "email": "testuser@example.com",
        "password": "testpass123",
        "full_name": "Test User"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "testuser@example.com"

def test_login_user():
    # Register first (if not already)
    client.post("/users/register", json={
        "username": "testlogin",
        "email": "testlogin@example.com",
        "password": "testpass123",
        "full_name": "Test Login"
    })
    response = client.post("/users/token", data={
        "username": "testlogin",
        "password": "testpass123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data 