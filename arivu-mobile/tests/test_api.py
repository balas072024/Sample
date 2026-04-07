"""
Tests for Arivu Mobile API endpoints.
Run with: pytest tests/test_api.py -v
"""

import json
import os
import sys
import tempfile
from unittest.mock import patch

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, init_db


@pytest.fixture
def client():
    """Create a test client with a fresh temporary database for each test."""
    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    app.config["DATABASE"] = db_path
    app.config["TESTING"] = True
    app.config["SECRET_KEY"] = "test-secret-key"

    with app.test_client() as c:
        with app.app_context():
            init_db()
        yield c

    os.close(db_fd)
    os.unlink(db_path)


def _register(client, username="testuser", email="test@example.com", password="secret123"):
    """Helper to register a user and return the response."""
    return client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": password},
    )


def _get_token(client, username="testuser", email="test@example.com", password="secret123"):
    """Register a user and return the JWT token."""
    resp = _register(client, username, email, password)
    return resp.get_json()["token"]


def _auth_header(client, username="testuser", email="test@example.com", password="secret123"):
    """Register a user and return an Authorization header dict."""
    token = _get_token(client, username, email, password)
    return {"Authorization": f"Bearer {token}"}


# ---- Health endpoint -------------------------------------------------------


def test_health(client):
    """Health check returns status, service name, version, and timestamp."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "healthy"
    assert data["service"] == "arivu-mobile"
    assert "version" in data
    assert "timestamp" in data


# ---- Registration ----------------------------------------------------------


def test_register_success(client):
    """Successful registration returns 201 with token and user info."""
    resp = _register(client)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["message"] == "Registration successful"
    assert "token" in data
    assert data["user"]["username"] == "testuser"
    assert data["user"]["email"] == "test@example.com"


def test_register_duplicate(client):
    """Registering with an existing username/email returns 409."""
    _register(client)
    resp = _register(client)
    assert resp.status_code == 409
    assert "already exists" in resp.get_json()["error"]


def test_register_missing_fields(client):
    """Registration with missing required fields returns 400."""
    resp = client.post("/api/auth/register", json={"username": "u"})
    assert resp.status_code == 400
    assert "required" in resp.get_json()["error"]


def test_register_short_password(client):
    """Registration with a password shorter than 6 characters returns 400."""
    resp = client.post(
        "/api/auth/register",
        json={"username": "u", "email": "e@e.com", "password": "abc"},
    )
    assert resp.status_code == 400
    assert "at least 6" in resp.get_json()["error"]


# ---- Login -----------------------------------------------------------------


def test_login_success(client):
    """Successful login returns 200 with a token."""
    _register(client)
    resp = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "secret123"},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["message"] == "Login successful"
    assert "token" in data
    assert data["user"]["username"] == "testuser"


def test_login_wrong_password(client):
    """Login with incorrect password returns 401."""
    _register(client)
    resp = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "wrongpass"},
    )
    assert resp.status_code == 401
    assert "Invalid credentials" in resp.get_json()["error"]


def test_login_missing_fields(client):
    """Login with empty/missing fields returns 400."""
    resp = client.post("/api/auth/login", json={"username": ""})
    assert resp.status_code == 400
    assert "required" in resp.get_json()["error"]


# ---- Auth-required endpoints without token ---------------------------------


def test_chat_requires_auth(client):
    """POST /api/chat without a token returns 401."""
    resp = client.post("/api/chat", json={"message": "hi"})
    assert resp.status_code == 401
    assert "Token" in resp.get_json()["error"]


def test_conversations_requires_auth(client):
    """GET /api/conversations without a token returns 401."""
    resp = client.get("/api/conversations")
    assert resp.status_code == 401


def test_preferences_requires_auth(client):
    """GET /api/preferences without a token returns 401."""
    resp = client.get("/api/preferences")
    assert resp.status_code == 401


def test_invalid_token_rejected(client):
    """A malformed token is rejected with 401."""
    resp = client.get(
        "/api/conversations",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    assert resp.status_code == 401
    assert "invalid" in resp.get_json()["error"].lower()


# ---- Chat ------------------------------------------------------------------


@patch("app.get_ai_response", return_value="Hello from AI!")
def test_chat_send_message(mock_ai, client):
    """Sending a chat message returns an AI response and conversation id."""
    headers = _auth_header(client)
    resp = client.post(
        "/api/chat",
        json={"message": "Hello"},
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["response"] == "Hello from AI!"
    assert "conversation_id" in data
    assert "message_id" in data


def test_chat_empty_message(client):
    """An empty chat message is rejected with 400."""
    headers = _auth_header(client)
    resp = client.post("/api/chat", json={"message": ""}, headers=headers)
    assert resp.status_code == 400
    assert "required" in resp.get_json()["error"]


@patch("app.get_ai_response", return_value="Follow-up reply")
def test_chat_with_existing_conversation(mock_ai, client):
    """A message sent with a conversation_id appends to that conversation."""
    headers = _auth_header(client)
    # First message creates conversation
    with patch("app.get_ai_response", return_value="First"):
        r1 = client.post("/api/chat", json={"message": "hi"}, headers=headers)
    conv_id = r1.get_json()["conversation_id"]
    # Second message in same conversation
    r2 = client.post(
        "/api/chat",
        json={"message": "follow up", "conversation_id": conv_id},
        headers=headers,
    )
    assert r2.status_code == 200
    assert r2.get_json()["conversation_id"] == conv_id


# ---- Conversations ---------------------------------------------------------


def test_list_conversations_empty(client):
    """Listing conversations for a new user returns an empty list."""
    headers = _auth_header(client)
    resp = client.get("/api/conversations", headers=headers)
    assert resp.status_code == 200
    assert resp.get_json()["conversations"] == []


@patch("app.get_ai_response", return_value="ok")
def test_create_and_list_conversations(mock_ai, client):
    """After sending a message, the conversation appears in the list."""
    headers = _auth_header(client)
    client.post("/api/chat", json={"message": "first chat"}, headers=headers)
    resp = client.get("/api/conversations", headers=headers)
    convs = resp.get_json()["conversations"]
    assert len(convs) == 1
    assert "first chat" in convs[0]["title"]


@patch("app.get_ai_response", return_value="ok")
def test_delete_conversation(mock_ai, client):
    """Deleting a conversation removes it from the list."""
    headers = _auth_header(client)
    r = client.post("/api/chat", json={"message": "to delete"}, headers=headers)
    conv_id = r.get_json()["conversation_id"]

    del_resp = client.delete(f"/api/conversations/{conv_id}", headers=headers)
    assert del_resp.status_code == 200
    assert "deleted" in del_resp.get_json()["message"].lower()

    # Verify it is gone
    list_resp = client.get("/api/conversations", headers=headers)
    assert list_resp.get_json()["conversations"] == []


def test_delete_nonexistent_conversation(client):
    """Deleting a conversation that does not exist returns 404."""
    headers = _auth_header(client)
    resp = client.delete("/api/conversations/nonexistent", headers=headers)
    assert resp.status_code == 404


@patch("app.get_ai_response", return_value="ok")
def test_get_conversation_messages(mock_ai, client):
    """Retrieving a conversation includes both user and assistant messages."""
    headers = _auth_header(client)
    r = client.post("/api/chat", json={"message": "hello"}, headers=headers)
    conv_id = r.get_json()["conversation_id"]

    resp = client.get(f"/api/conversations/{conv_id}", headers=headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["conversation"]["id"] == conv_id
    assert len(data["messages"]) == 2  # user + assistant


def test_get_nonexistent_conversation(client):
    """Retrieving a conversation that does not exist returns 404."""
    headers = _auth_header(client)
    resp = client.get("/api/conversations/fake-id", headers=headers)
    assert resp.status_code == 404


# ---- Quick actions ---------------------------------------------------------


@patch("app.get_ai_response", return_value="Translated text")
def test_quick_action_translate(mock_ai, client):
    """The translate quick action returns a result."""
    headers = _auth_header(client)
    resp = client.post(
        "/api/quick-action",
        json={"action": "translate", "text": "Hello", "target_language": "French"},
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["action"] == "translate"
    assert data["result"] == "Translated text"


@patch("app.get_ai_response", return_value="Summary here")
def test_quick_action_summarize(mock_ai, client):
    """The summarize quick action returns a result."""
    headers = _auth_header(client)
    resp = client.post(
        "/api/quick-action",
        json={"action": "summarize", "text": "Long text here..."},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.get_json()["action"] == "summarize"
    assert resp.get_json()["result"] == "Summary here"


@patch("app.get_ai_response", return_value="Explanation")
def test_quick_action_explain(mock_ai, client):
    """The explain quick action returns a result."""
    headers = _auth_header(client)
    resp = client.post(
        "/api/quick-action",
        json={"action": "explain", "text": "E=mc^2"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.get_json()["action"] == "explain"


def test_quick_action_invalid_action(client):
    """An unrecognized action is rejected with 400."""
    headers = _auth_header(client)
    resp = client.post(
        "/api/quick-action",
        json={"action": "dance", "text": "hello"},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "must be" in resp.get_json()["error"]


def test_quick_action_missing_text(client):
    """A quick action with empty text is rejected with 400."""
    headers = _auth_header(client)
    resp = client.post(
        "/api/quick-action",
        json={"action": "translate", "text": ""},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "required" in resp.get_json()["error"].lower()


# ---- Preferences -----------------------------------------------------------


def test_get_preferences_defaults(client):
    """Default preferences are dark theme, medium font, English language."""
    headers = _auth_header(client)
    resp = client.get("/api/preferences", headers=headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["theme"] == "dark"
    assert data["font_size"] == "medium"
    assert data["language"] == "en"


def test_update_preferences(client):
    """Updating preferences persists the new values."""
    headers = _auth_header(client)
    resp = client.put(
        "/api/preferences",
        json={"theme": "light", "font_size": "large", "language": "ta"},
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["theme"] == "light"
    assert data["font_size"] == "large"
    assert data["language"] == "ta"


def test_update_preferences_invalid_theme(client):
    """An invalid theme value is rejected with 400."""
    headers = _auth_header(client)
    resp = client.put(
        "/api/preferences",
        json={"theme": "neon"},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "Theme" in resp.get_json()["error"]


def test_update_preferences_invalid_font_size(client):
    """An invalid font_size value is rejected with 400."""
    headers = _auth_header(client)
    resp = client.put(
        "/api/preferences",
        json={"font_size": "huge"},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "Font size" in resp.get_json()["error"]


def test_update_preferences_invalid_language(client):
    """An invalid language value is rejected with 400."""
    headers = _auth_header(client)
    resp = client.put(
        "/api/preferences",
        json={"language": "xx"},
        headers=headers,
    )
    assert resp.status_code == 400
    assert "Language" in resp.get_json()["error"]
