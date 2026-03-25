"""SQLite3 database for caching API responses."""

import sqlite3
import json
import time
from config import DATABASE_PATH


def get_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS cache (
            key TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            updated_at REAL NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def get_cached(key: str, max_age: float) -> dict | None:
    """Get cached data if it exists and is not expired."""
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT data, updated_at FROM cache WHERE key = ?", (key,))
    row = c.fetchone()
    conn.close()

    if row is None:
        return None

    age = time.time() - row["updated_at"]
    if age > max_age:
        return None

    return json.loads(row["data"])


def set_cached(key: str, data: dict):
    """Store data in cache."""
    conn = get_connection()
    c = conn.cursor()
    c.execute(
        "INSERT OR REPLACE INTO cache (key, data, updated_at) VALUES (?, ?, ?)",
        (key, json.dumps(data), time.time()),
    )
    conn.commit()
    conn.close()
