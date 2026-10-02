import json
import os
import sys
import secrets
import urllib.parse
import requests as http_requests

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from flask import Flask, Blueprint, jsonify, render_template, request, send_from_directory, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import bg

bp = Blueprint('music', __name__,
               url_prefix='/music',
               template_folder='templates',
               static_folder='static')

MUSIC_FOLDER = os.path.join(CURRENT_DIR, "music")
MEDIA_FOLDER = os.path.join(CURRENT_DIR, "media")

os.makedirs(MUSIC_FOLDER, exist_ok=True)
os.makedirs(MEDIA_FOLDER, exist_ok=True)

DEVELOPER = "vad5m_dev"

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "").strip()

GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID", "").strip()
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET", "").strip()

OAUTH_REDIRECT_BASE = os.environ.get("OAUTH_REDIRECT_BASE", "http://localhost:50003").rstrip("/")

SUPPORTED_EXTENSIONS = (".mp3", ".m4a", ".aac", ".ogg", ".wav", ".flac", ".opus", ".webm")

DEFAULT_WIDGETS = {
    "profile": {"x": 80, "y": 20, "width": 48, "height": 48, "rotation": 0, "scale": 1, "fontScale": 1},
    "settings": {"x": 20, "y": 20, "width": 48, "height": 48, "rotation": 0, "scale": 1, "fontScale": 1},
    "file": {"x": 140, "y": 20, "width": 48, "height": 48, "rotation": 0, "scale": 1, "fontScale": 1},
    "player": {"x": 100, "y": 100, "width": 280, "height": 70, "rotation": 0, "scale": 1, "fontScale": 1},
    "info": {"x": 120, "y": 40, "width": 220, "height": 80, "rotation": 0, "scale": 1, "fontScale": 1},
    "progress": {"x": 0, "y": 0, "width": 400, "height": 44, "rotation": 0, "scale": 1, "fontScale": 1},
    "volume": {"x": 0, "y": 0, "width": 180, "height": 44, "rotation": 0, "scale": 1, "fontScale": 1},
    "playlist": {"x": 0, "y": 0, "width": 280, "height": 340, "rotation": 0, "scale": 1, "fontScale": 1},
}

DEFAULT_CONFIG = {
    "accent_color": "#ff001c",
    "edit_mode": False,
    "site_title": "",
    "visualizer_opacity": 30,
    "playlist_visible": True,
    "visualizer_mode": 0,
    "eq_gains": [0, 0, 0, 0, 0, 0, 0],
    "effects_mode": 0,
    "effects_opacity": 50,
    "effects_color": "#ff001c",
    "volume": 70,
    "language": "ru",
    "widgets": DEFAULT_WIDGETS.copy()
}


def get_user_music_folder(user_id):
    folder = os.path.join(MUSIC_FOLDER, str(user_id))
    os.makedirs(folder, exist_ok=True)
    return folder


def deep_merge(base, update):
    for key, value in update.items():
        if key in base and isinstance(base[key], dict) and isinstance(value, dict):
            deep_merge(base[key], value)
        else:
            base[key] = value
    return base


def ensure_config_structure(config):
    def merge_defaults(target, defaults):
        for key, value in defaults.items():
            if key not in target:
                target[key] = value
            elif isinstance(value, dict) and isinstance(target[key], dict):
                merge_defaults(target[key], value)
        return target
    return merge_defaults(config, DEFAULT_CONFIG)


def load_config(user_id):
    config = bg.load_user_config(user_id)
    if config is None:
        config = DEFAULT_CONFIG.copy()
        bg.save_user_config(user_id, config)
    config = ensure_config_structure(config)
    return config


def save_config(user_id, data):
    bg.save_user_config(user_id, data)


def get_music_list(user_id):
    folder = get_user_music_folder(user_id)
    music_files = []
    for file in os.listdir(folder):
        if file.lower().endswith(SUPPORTED_EXTENSIONS):
            music_files.append({"name": os.path.splitext(file)[0], "file": file})
    music_files.sort(key=lambda x: x["name"].lower())
    return music_files


def _oauth_redirect_uri(provider):
    return f"{OAUTH_REDIRECT_BASE}/music/login/api/oauth/{provider}/callback"


def _generate_unique_username(base):
    base = "".join(c for c in base if c.isalnum() or c in "_-")[:24] or "user"
    if not bg.get_user_by_username(base):
        return base
    i = 1
    while bg.get_user_by_username(f"{base}_{i}"):
        i += 1
    return f"{base}_{i}"


def _google_exchange_code(code):
    token_resp = http_requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": _oauth_redirect_uri("google"),
            "grant_type": "authorization_code",
        },
        timeout=10,
    )
    token_data = token_resp.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise RuntimeError(token_data.get("error_description") or token_data.get("error") or "no access_token")

    info_resp = http_requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    info = info_resp.json()
    return {
        "provider_user_id": str(info.get("id")),
        "username": info.get("name") or (info.get("email", "").split("@")[0] if info.get("email") else "user"),
        "email": info.get("email"),
        "access_token": access_token,
    }


def _github_exchange_code(code):
    token_resp = http_requests.post(
        "https://github.com/login/oauth/access_token",
        data={
            "code": code,
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "redirect_uri": _oauth_redirect_uri("github"),
        },
        headers={"Accept": "application/json"},
        timeout=10,
    )
    token_data = token_resp.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise RuntimeError(token_data.get("error_description") or token_data.get("error") or "no access_token")

    headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"}

    user_resp = http_requests.get("https://api.github.com/user", headers=headers, timeout=10)
    gh_user = user_resp.json()

    email = gh_user.get("email")
    if not email:
        emails_resp = http_requests.get("https://api.github.com/user/emails", headers=headers, timeout=10)
        emails = emails_resp.json()
        if isinstance(emails, list):
            primary = next((e for e in emails if e.get("primary")), None)
            if primary:
                email = primary.get("email")

    return {
        "provider_user_id": str(gh_user.get("id")),
        "username": gh_user.get("login") or "gh_user",
        "email": email,
        "access_token": access_token,
    }


@bp.route("/")
def index():
    if not session.get("user_id"):
        return redirect(url_for("music.music_login"))
    user_id = session["user_id"]
    config = load_config(user_id)
    get_user_music_folder(user_id)
    return render_template(
        "music_index.html",
        music_list=get_music_list(user_id),
        config=config,
        developer=DEVELOPER,
        username=session.get("username", "")
    )


@bp.route("/login/")
@bp.route("/login")
def music_login():
    if session.get("user_id"):
        return redirect(url_for("music.index"))
    return render_template("login.html")


@bp.route("/login/api/register", methods=["POST"])
def music_api_register():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    password_confirm = data.get("password_confirm") or ""

    if not username or not password:
        return jsonify({"error": "Missing fields"}), 400

    if password != password_confirm:
        return jsonify({"error": "Passwords do not match"}), 400

    if bg.get_user_by_username(username):
        return jsonify({"error": "Username already exists"}), 409

    fake_mail = f"{username}@local"
    if bg.get_user_by_mail(fake_mail):
        return jsonify({"error": "Mail already exists"}), 409

    password_hash = generate_password_hash(password)
    user_id = bg.create_user(username, fake_mail, password_hash)
    get_user_music_folder(user_id)
    load_config(user_id)

    session["user_id"] = user_id
    session["username"] = username
    session.permanent = True

    return jsonify({"status": "ok", "user_id": user_id, "redirect": "/music/"}), 201


@bp.route("/login/api/login", methods=["POST"])
def music_api_login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "Missing fields"}), 400

    user = bg.get_user_by_username(username)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not check_password_hash(user["userpassword_hash"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    session["user_id"] = user["user_id"]
    session["username"] = user["username"]
    session.permanent = True

    return jsonify({
        "status": "ok",
        "user_id": user["user_id"],
        "username": user["username"],
        "redirect": "/music/"
    }), 200


@bp.route("/logout")
def music_logout():
    session.clear()
    return redirect(url_for("music.music_login"))


@bp.route("/login/api/oauth/<provider>")
def oauth_start(provider):
    if provider not in ("google", "github"):
        return jsonify({"error": "Unsupported provider"}), 400

    if provider == "google" and (not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET):
        return _oauth_error("Google OAuth не настроен: проверь GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET в .env")
    if provider == "github" and (not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET):
        return _oauth_error("GitHub OAuth не настроен: проверь GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET в .env")

    state = secrets.token_urlsafe(24)
    session["oauth_state"] = state
    session["oauth_provider"] = provider

    if provider == "google":
        params = {
            "client_id": GOOGLE_CLIENT_ID,
            "redirect_uri": _oauth_redirect_uri("google"),
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "online",
            "prompt": "select_account",
            "state": state,
        }
        url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    else:
        params = {
            "client_id": GITHUB_CLIENT_ID,
            "redirect_uri": _oauth_redirect_uri("github"),
            "scope": "read:user user:email",
            "state": state,
        }
        url = "https://github.com/login/oauth/authorize?" + urllib.parse.urlencode(params)

    return redirect(url)


@bp.route("/login/api/oauth/<provider>/callback")
def oauth_callback(provider):
    if provider not in ("google", "github"):
        return _oauth_error("Неподдерживаемый провайдер.")

    if request.args.get("state") != session.get("oauth_state"):
        return _oauth_error("Неверный state-параметр. Попробуйте войти заново.")
    session.pop("oauth_state", None)

    if request.args.get("error"):
        return _oauth_error(
            f"Провайдер вернул ошибку: {request.args.get('error')} — {request.args.get('error_description', '')}"
        )

    code = request.args.get("code")
    if not code:
        return _oauth_error("Провайдер не вернул код авторизации.")

    try:
        if provider == "google":
            profile = _google_exchange_code(code)
        else:
            profile = _github_exchange_code(code)
    except Exception as e:
        return _oauth_error(f"Ошибка обмена кода: {e}")

    if not profile or not profile.get("provider_user_id"):
        return _oauth_error("Не удалось получить профиль пользователя.")

    oauth_acc = bg.get_oauth_account(provider, profile["provider_user_id"])

    if oauth_acc:
        user = bg.get_user(oauth_acc["user_id"])
    else:
        user = None
        if profile.get("email"):
            user = bg.get_user_by_mail(profile["email"])

        if user is None:
            username = _generate_unique_username(profile.get("username") or profile["provider_user_id"])
            email = profile.get("email") or f"{provider}_{profile['provider_user_id']}@oauth.local"
            pw_hash = generate_password_hash(secrets.token_urlsafe(32))
            user_id = bg.create_user(username, email, pw_hash)
            user = bg.get_user(user_id)
            get_user_music_folder(user_id)
            load_config(user_id)

        bg.link_oauth_account(
            user["user_id"], provider,
            profile["provider_user_id"],
            profile.get("email"),
            profile.get("access_token"),
        )

    get_user_music_folder(user["user_id"])
    load_config(user["user_id"])

    session["user_id"] = user["user_id"]
    session["username"] = user["username"]
    session["provider"] = provider
    session.permanent = True

    return redirect("/music/")


def _oauth_error(msg):
    html = f"""
    <!doctype html><html lang="ru"><head><meta charset="utf-8">
    <title>Ошибка входа</title>
    <style>
      body{{background:#000;color:#fff;font-family:system-ui,sans-serif;
           display:flex;align-items:center;justify-content:center;height:100vh;margin:0}}
      .box{{max-width:520px;padding:32px;border:1px solid #222;border-radius:16px;text-align:center}}
      h1{{font-size:20px;margin:0 0 12px}} p{{color:#888;margin:0 0 20px;font-size:14px;word-break:break-word}}
      a{{display:inline-block;padding:12px 24px;background:#fff;color:#000;
         border-radius:8px;text-decoration:none;font-weight:600;font-size:14px}}
    </style></head><body>
      <div class="box">
        <h1>Не удалось войти</h1>
        <p>{msg}</p>
        <a href="/music/login">Вернуться к входу</a>
      </div>
    </body></html>
    """
    return html, 400


@bp.route("/music/<path:filename>")
def serve_music(filename):
    if not session.get("user_id"):
        return jsonify({"error": "Unauthorized"}), 401
    user_id = session["user_id"]
    folder = get_user_music_folder(user_id)
    return send_from_directory(folder, filename)


@bp.route("/api/music-list")
def api_music_list():
    if not session.get("user_id"):
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify(get_music_list(session["user_id"]))


@bp.route("/api/config", methods=["GET"])
def api_get_config():
    if not session.get("user_id"):
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify(load_config(session["user_id"]))


@bp.route("/api/config", methods=["POST"])
def api_update_config():
    if not session.get("user_id"):
        return jsonify({"error": "Unauthorized"}), 401
    new_config = request.get_json()
    if new_config is None:
        return jsonify({"error": "Invalid JSON"}), 400
    user_id = session["user_id"]
    current_config = load_config(user_id)
    merged = deep_merge(current_config, new_config)
    save_config(user_id, merged)
    return jsonify({"status": "ok", "config": merged}), 200


@bp.route('/media/<path:filename>')
def serve_media_fix(filename):
    return send_from_directory(MEDIA_FOLDER, filename)


@bp.route("/api/upload-music", methods=["POST"])
def api_upload_music():
    if not session.get("user_id"):
        return jsonify({"error": "Unauthorized"}), 401
    if 'files' not in request.files:
        return jsonify({"error": "No files"}), 400
    user_id = session["user_id"]
    folder = get_user_music_folder(user_id)
    files = request.files.getlist('files')
    uploaded = []
    for f in files:
        if f.filename and f.filename.lower().endswith(SUPPORTED_EXTENSIONS):
            safe_name = f.filename
            base, ext = os.path.splitext(safe_name)
            counter = 1
            dest = os.path.join(folder, safe_name)
            while os.path.exists(dest):
                safe_name = f"{base}_{counter}{ext}"
                dest = os.path.join(folder, safe_name)
                counter += 1
            f.save(dest)
            uploaded.append({"name": os.path.splitext(safe_name)[0], "file": safe_name})
    return jsonify({"status": "ok", "uploaded": uploaded}), 200


@bp.route("/api/delete-music", methods=["POST"])
def api_delete_music():
    if not session.get("user_id"):
        return jsonify({"error": "Unauthorized"}), 401
    data = request.get_json()
    if not data or 'file' not in data:
        return jsonify({"error": "Missing file"}), 400
    user_id = session["user_id"]
    folder = get_user_music_folder(user_id)
    filename = data['file']
    filepath = os.path.join(folder, filename)
    if os.path.exists(filepath) and os.path.isfile(filepath):
        os.remove(filepath)
        return jsonify({"status": "ok"}), 200
    return jsonify({"error": "File not found"}), 404


def create_app():
    bg.init_db()
    app = Flask(__name__)
    app.secret_key = os.environ.get("SECRET_KEY") or secrets.token_hex(32)
    app.config.update(
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=False,
        PERMANENT_SESSION_LIFETIME=60 * 60 * 24 * 30,
    )
    app.register_blueprint(bp)
    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host='0.0.0.0', port=50003, debug=True)
