import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def get_token():
    # Register test user
    client.post("/users/register", json={
        "username": "testposter",
        "email": "testposter@example.com",
        "password": "testpass123",
        "full_name": "Test Poster"
    })
    # Login
    response = client.post("/users/token", data={
        "username": "testposter",
        "password": "testpass123"
    })
    return response.json()["access_token"]

def test_create_post():
    token = get_token()
    response = client.post("/posts", json={
        "title": "Test Post",
        "content": "This is a test post.",
        "tag_names": []
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Post"
    assert data["content"] == "This is a test post."

def test_list_posts():
    response = client.get("/posts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list) 