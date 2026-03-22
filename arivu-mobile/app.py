"""
Arivu Mobile - Touch-friendly AI Assistant Web Interface
A mobile-optimized Flask application for the Arivu AI assistant.
Port: 5050
"""

import os
import json
import sqlite3
import uuid
import datetime
from functools import wraps

import bcrypt
import jwt
import requests
from flask import (
    Flask, request, jsonify, render_template, g, send_from_directory
)
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "arivu-mobile-secret-key-change-in-production")
app.config["DATABASE"] = os.getenv("DATABASE", "arivu.db")
app.config["NEURAL_BRAIN_API"] = os.getenv("NEURAL_BRAIN_API", "http://localhost:8000/api/chat")
app.config["MINIMAX_API_URL"] = os.getenv("MINIMAX_API_URL", "https://api.minimax.chat/v1/text/chatcompletion_v2")
app.config["MINIMAX_API_KEY"] = os.getenv("MINIMAX_API_KEY", "")
app.config["JWT_EXPIRY_HOURS"] = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
    """Get a database connection for the current request."""
    if "db" not in g:
        g.db = sqlite3.connect(app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db


@app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Initialize database tables."""
    db = get_db()
    db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL DEFAULT 'New Chat',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
            content TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS preferences (
            user_id TEXT PRIMARY KEY,
            theme TEXT NOT NULL DEFAULT 'dark',
            font_size TEXT NOT NULL DEFAULT 'medium',
            language TEXT NOT NULL DEFAULT 'en',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    """)
    db.commit()


with app.app_context():
    init_db()

# ---------------------------------------------------------------------------
# JWT Authentication
# ---------------------------------------------------------------------------

def create_token(user_id, username):
    """Create a JWT token for a user."""
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=app.config["JWT_EXPIRY_HOURS"]),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")


def token_required(f):
    """Decorator to require a valid JWT token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

        if not token:
            return jsonify({"error": "Token is missing"}), 401

        try:
            data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            g.current_user_id = data["user_id"]
            g.current_username = data["username"]
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token is invalid"}), 401

        return f(*args, **kwargs)
    return decorated

# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

@app.route("/api/auth/register", methods=["POST"])
def register():
    """Register a new user."""
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "Username, email and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    db = get_db()
    existing = db.execute(
        "SELECT id FROM users WHERE username = ? OR email = ?", (username, email)
    ).fetchone()
    if existing:
        return jsonify({"error": "Username or email already exists"}), 409

    user_id = str(uuid.uuid4())
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    db.execute(
        "INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)",
        (user_id, username, email, password_hash),
    )
    db.execute(
        "INSERT INTO preferences (user_id) VALUES (?)", (user_id,)
    )
    db.commit()

    token = create_token(user_id, username)
    return jsonify({
        "message": "Registration successful",
        "token": token,
        "user": {"id": user_id, "username": username, "email": email},
    }), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    """Authenticate a user and return a JWT token."""
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    db = get_db()
    user = db.execute(
        "SELECT id, username, email, password_hash FROM users WHERE username = ?", (username,)
    ).fetchone()

    if not user or not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"].encode("utf-8")):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_token(user["id"], user["username"])
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {"id": user["id"], "username": user["username"], "email": user["email"]},
    }), 200

# ---------------------------------------------------------------------------
# Chat / AI proxy
# ---------------------------------------------------------------------------

def call_neural_brain(message, history=None):
    """Try the Neural Brain API first."""
    try:
        payload = {"message": message}
        if history:
            payload["history"] = history
        resp = requests.post(
            app.config["NEURAL_BRAIN_API"],
            json=payload,
            timeout=15,
        )
        if resp.status_code == 200:
            body = resp.json()
            return body.get("response") or body.get("reply") or body.get("message", "")
    except Exception:
        pass
    return None


def call_minimax(message, history=None):
    """Fallback to MiniMax API."""
    api_key = app.config["MINIMAX_API_KEY"]
    if not api_key:
        return None
    try:
        messages = []
        if history:
            for h in history[-10:]:
                messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": message})

        resp = requests.post(
            app.config["MINIMAX_API_URL"],
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "MiniMax-Text-01",
                "messages": messages,
                "max_tokens": 1024,
            },
            timeout=30,
        )
        if resp.status_code == 200:
            body = resp.json()
            choices = body.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "")
    except Exception:
        pass
    return None


def get_ai_response(message, history=None):
    """Get a response from AI, trying Neural Brain then MiniMax."""
    response = call_neural_brain(message, history)
    if response:
        return response

    response = call_minimax(message, history)
    if response:
        return response

    # Final fallback
    return (
        "I'm Arivu, your AI assistant. I'm currently unable to reach the AI backend. "
        "Please check your API configuration or try again later."
    )


@app.route("/api/chat", methods=["POST"])
@token_required
def chat():
    """Send a message and get an AI response."""
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()
    conversation_id = data.get("conversation_id")

    if not message:
        return jsonify({"error": "Message is required"}), 400

    db = get_db()

    # Create or validate conversation
    if conversation_id:
        conv = db.execute(
            "SELECT id FROM conversations WHERE id = ? AND user_id = ?",
            (conversation_id, g.current_user_id),
        ).fetchone()
        if not conv:
            return jsonify({"error": "Conversation not found"}), 404
    else:
        conversation_id = str(uuid.uuid4())
        title = message[:50] + ("..." if len(message) > 50 else "")
        db.execute(
            "INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)",
            (conversation_id, g.current_user_id, title),
        )

    # Save user message
    user_msg_id = str(uuid.uuid4())
    db.execute(
        "INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, 'user', ?)",
        (user_msg_id, conversation_id, message),
    )

    # Build history
    rows = db.execute(
        "SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at",
        (conversation_id,),
    ).fetchall()
    history = [{"role": r["role"], "content": r["content"]} for r in rows]

    # Get AI response
    ai_text = get_ai_response(message, history)

    # Save assistant message
    asst_msg_id = str(uuid.uuid4())
    db.execute(
        "INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, 'assistant', ?)",
        (asst_msg_id, conversation_id, ai_text),
    )

    # Update conversation timestamp
    db.execute(
        "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?",
        (conversation_id,),
    )
    db.commit()

    return jsonify({
        "response": ai_text,
        "conversation_id": conversation_id,
        "message_id": asst_msg_id,
    }), 200

# ---------------------------------------------------------------------------
# Quick actions
# ---------------------------------------------------------------------------

@app.route("/api/quick-action", methods=["POST"])
@token_required
def quick_action():
    """Perform a quick action (translate, summarize, explain)."""
    data = request.get_json(silent=True) or {}
    action = data.get("action", "").strip()
    text = data.get("text", "").strip()
    target_language = data.get("target_language", "English")

    if action not in ("translate", "summarize", "explain"):
        return jsonify({"error": "Action must be translate, summarize, or explain"}), 400
    if not text:
        return jsonify({"error": "Text is required"}), 400

    prompts = {
        "translate": f"Translate the following text to {target_language}:\n\n{text}",
        "summarize": f"Provide a concise summary of the following text:\n\n{text}",
        "explain": f"Explain the following text in simple terms:\n\n{text}",
    }

    ai_text = get_ai_response(prompts[action])

    return jsonify({"result": ai_text, "action": action}), 200

# ---------------------------------------------------------------------------
# Conversations
# ---------------------------------------------------------------------------

@app.route("/api/conversations", methods=["GET"])
@token_required
def list_conversations():
    """List all conversations for the current user."""
    db = get_db()
    rows = db.execute(
        "SELECT id, title, created_at, updated_at FROM conversations "
        "WHERE user_id = ? ORDER BY updated_at DESC",
        (g.current_user_id,),
    ).fetchall()
    conversations = [dict(r) for r in rows]
    return jsonify({"conversations": conversations}), 200


@app.route("/api/conversations/<conversation_id>", methods=["GET"])
@token_required
def get_conversation(conversation_id):
    """Get messages for a conversation."""
    db = get_db()
    conv = db.execute(
        "SELECT id, title, created_at, updated_at FROM conversations WHERE id = ? AND user_id = ?",
        (conversation_id, g.current_user_id),
    ).fetchone()
    if not conv:
        return jsonify({"error": "Conversation not found"}), 404

    messages = db.execute(
        "SELECT id, role, content, created_at FROM messages "
        "WHERE conversation_id = ? ORDER BY created_at",
        (conversation_id,),
    ).fetchall()

    return jsonify({
        "conversation": dict(conv),
        "messages": [dict(m) for m in messages],
    }), 200


@app.route("/api/conversations/<conversation_id>", methods=["DELETE"])
@token_required
def delete_conversation(conversation_id):
    """Delete a conversation and its messages."""
    db = get_db()
    conv = db.execute(
        "SELECT id FROM conversations WHERE id = ? AND user_id = ?",
        (conversation_id, g.current_user_id),
    ).fetchone()
    if not conv:
        return jsonify({"error": "Conversation not found"}), 404

    db.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
    db.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
    db.commit()

    return jsonify({"message": "Conversation deleted"}), 200

# ---------------------------------------------------------------------------
# Voice-to-text stub
# ---------------------------------------------------------------------------

@app.route("/api/voice-to-text", methods=["POST"])
@token_required
def voice_to_text():
    """Voice-to-text stub endpoint. Returns a placeholder transcription."""
    return jsonify({
        "text": "This is a placeholder transcription. Voice-to-text integration coming soon.",
        "confidence": 0.0,
        "status": "stub",
    }), 200

# ---------------------------------------------------------------------------
# User preferences
# ---------------------------------------------------------------------------

@app.route("/api/preferences", methods=["GET"])
@token_required
def get_preferences():
    """Get user preferences."""
    db = get_db()
    prefs = db.execute(
        "SELECT theme, font_size, language FROM preferences WHERE user_id = ?",
        (g.current_user_id,),
    ).fetchone()
    if not prefs:
        return jsonify({"theme": "dark", "font_size": "medium", "language": "en"}), 200
    return jsonify(dict(prefs)), 200


@app.route("/api/preferences", methods=["PUT"])
@token_required
def update_preferences():
    """Update user preferences."""
    data = request.get_json(silent=True) or {}

    valid_themes = ("dark", "light")
    valid_font_sizes = ("small", "medium", "large")
    valid_languages = ("en", "ta", "hi", "es", "fr", "de", "zh", "ja")

    theme = data.get("theme")
    font_size = data.get("font_size")
    language = data.get("language")

    if theme and theme not in valid_themes:
        return jsonify({"error": f"Theme must be one of: {', '.join(valid_themes)}"}), 400
    if font_size and font_size not in valid_font_sizes:
        return jsonify({"error": f"Font size must be one of: {', '.join(valid_font_sizes)}"}), 400
    if language and language not in valid_languages:
        return jsonify({"error": f"Language must be one of: {', '.join(valid_languages)}"}), 400

    db = get_db()
    prefs = db.execute(
        "SELECT user_id FROM preferences WHERE user_id = ?", (g.current_user_id,)
    ).fetchone()

    if prefs:
        updates = []
        values = []
        if theme:
            updates.append("theme = ?")
            values.append(theme)
        if font_size:
            updates.append("font_size = ?")
            values.append(font_size)
        if language:
            updates.append("language = ?")
            values.append(language)
        if updates:
            values.append(g.current_user_id)
            db.execute(
                f"UPDATE preferences SET {', '.join(updates)} WHERE user_id = ?",
                values,
            )
    else:
        db.execute(
            "INSERT INTO preferences (user_id, theme, font_size, language) VALUES (?, ?, ?, ?)",
            (g.current_user_id, theme or "dark", font_size or "medium", language or "en"),
        )

    db.commit()
    prefs = db.execute(
        "SELECT theme, font_size, language FROM preferences WHERE user_id = ?",
        (g.current_user_id,),
    ).fetchone()
    return jsonify(dict(prefs)), 200

# ---------------------------------------------------------------------------
# PWA / Manifest / Health
# ---------------------------------------------------------------------------

@app.route("/manifest.json")
def manifest():
    """Serve PWA manifest."""
    return send_from_directory("static", "manifest.json", mimetype="application/manifest+json")


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "arivu-mobile",
        "version": "1.0.0",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
    }), 200


@app.route("/")
def index():
    """Serve the main mobile interface."""
    return render_template("index.html")

# ---------------------------------------------------------------------------
# Service worker (offline stub)
# ---------------------------------------------------------------------------

@app.route("/sw.js")
def service_worker():
    """Serve service worker from root scope."""
    return send_from_directory("static", "sw.js", mimetype="application/javascript")

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=True)
