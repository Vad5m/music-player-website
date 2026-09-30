import json
import os
import sqlite3

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(CURRENT_DIR, "music_app.db")

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def create_database():
    conn = get_connection()
    conn.close()

def create_tables():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            user_mail TEXT NOT NULL UNIQUE,
            userpassword_hash TEXT NOT NULL,
            json_settings TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS music (
            music_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            file TEXT NOT NULL,
            duration REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS media (
            media_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            file TEXT NOT NULL,
            media_type TEXT DEFAULT 'image',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS app_config (
            config_id INTEGER PRIMARY KEY,
            config_json TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    cursor.close()
    conn.close()

def create_user(username, user_mail, userpassword_hash, json_settings=None):
    conn = get_connection()
    cursor = conn.cursor()
    if json_settings is None:
        json_settings = {}
    cursor.execute(
        "INSERT INTO user (username, user_mail, userpassword_hash, json_settings) VALUES (?, ?, ?, ?)",
        (username, user_mail, userpassword_hash, json.dumps(json_settings))
    )
    conn.commit()
    user_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return user_id

def _row_to_user(row):
    if not row:
        return None
    user = dict(row)
    if user.get("json_settings"):
        user["json_settings"] = json.loads(user["json_settings"])
    return user

def get_user(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return _row_to_user(row)

def get_user_by_username(username):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user WHERE username = ?", (username,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return _row_to_user(row)

def get_user_by_mail(user_mail):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user WHERE user_mail = ?", (user_mail,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return _row_to_user(row)

def update_user_settings(user_id, json_settings):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE user SET json_settings = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
        (json.dumps(json_settings), user_id)
    )
    conn.commit()
    cursor.close()
    conn.close()

def update_user_password(user_id, userpassword_hash):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE user SET userpassword_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
        (userpassword_hash, user_id)
    )
    conn.commit()
    cursor.close()
    conn.close()

def delete_user(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM user WHERE user_id = ?", (user_id,))
    conn.commit()
    cursor.close()
    conn.close()

def add_music(user_id, name, file, duration=0):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO music (user_id, name, file, duration) VALUES (?, ?, ?, ?)",
        (user_id, name, file, duration)
    )
    conn.commit()
    music_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return music_id

def get_music(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM music WHERE user_id = ? ORDER BY name ASC", (user_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return [dict(r) for r in rows]

def delete_music(music_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM music WHERE music_id = ?", (music_id,))
    conn.commit()
    cursor.close()
    conn.close()

def add_media(user_id, name, file, media_type="image"):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO media (user_id, name, file, media_type) VALUES (?, ?, ?, ?)",
        (user_id, name, file, media_type)
    )
    conn.commit()
    media_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return media_id

def get_media(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM media WHERE user_id = ? ORDER BY name ASC", (user_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return [dict(r) for r in rows]

def delete_media(media_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM media WHERE media_id = ?", (media_id,))
    conn.commit()
    cursor.close()
    conn.close()

def load_app_config():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT config_json FROM app_config WHERE config_id = 1")
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if row and row["config_json"]:
        return json.loads(row["config_json"])
    return None

def save_app_config(config_data):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO app_config (config_id, config_json, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP) "
        "ON CONFLICT(config_id) DO UPDATE SET config_json = excluded.config_json, updated_at = CURRENT_TIMESTAMP",
        (json.dumps(config_data),)
    )
    conn.commit()
    cursor.close()
    conn.close()

def init_db():
    create_database()
    create_tables()

init_db()

if __name__ == "__main__":
    python = """
    ⠀⠀⠀⠀⠀⠀⠀⢀⣤⣴⣶⣶⣶⣶⣶⣦⣄
    ⠀⠀⠀⠀⠀⠀⢀⣾⠟⠛⢿⣿⣿⣿⣿⣿⣿⣷
    ⠀⠀⠀⠀⠀⠀⢸⣿⣄⣀⣼⣿⣿⣿⣿⣿⣿⣿⠀⢀⣀⣀⣀⡀
    ⠀⠀⠀⠀⠀⠀⠈⠉⠉⠉⠉⠉⠉⣿⣿⣿⣿⣿⠀⢸⣿⣿⣿⣿⣦⠀
    ⠀⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⢸⣿⣿⣿⣿⣿⡇
    ⢰⣿⣿⣿⣿⣿⣿⣿⣿⠿⠿⠿⠿⠿⠿⠿⠿⠋⠀⣼⣿⣿⣿⣿⣿⡇
    ⢸⣿⣿⣿⣿⣿⡿⠉⢀⣠⣤⣤⣤⣤⣤⣤⣤⣴⣾⣿⣿⣿⣿⣿⣿⡇
    ⢸⣿⣿⣿⣿⣿⡇⠀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠀
    ⠘⣿⣿⣿⣿⣿⡇⠀⣿⣿⣿⣿⣿⠛⠛⠛⠛⠛⠛⠛⠛⠛⠋⠁⠀⠀
    ⠀⠈⠛⠻⠿⠿⠇⠀⣿⣿⣿⣿⣿⣿⣿⣿⠿⠿⣿⡇
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣧⣀⣀⣿⠇
    ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣿⣿⣿⣿⣿⣿⣿⡿⠋
    """
    print(python)
