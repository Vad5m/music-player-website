import json
import os
import sys
from flask import Flask, Blueprint, jsonify, render_template, request, send_from_directory

bp = Blueprint('music', __name__,
               url_prefix='/music',
               template_folder='templates',
               static_folder='static')

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MUSIC_FOLDER = os.path.join(CURRENT_DIR, "music")
MEDIA_FOLDER = os.path.join(CURRENT_DIR, "media")
CONFIG_FILE = os.path.join(CURRENT_DIR, "config.json")

os.makedirs(MUSIC_FOLDER, exist_ok=True)
os.makedirs(MEDIA_FOLDER, exist_ok=True)

DEVELOPER = "vad5m_dev"

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

DEFAULT_WIDGETS = {
    "settings": {"x": 20, "y": 20, "width": 48, "height": 48, "rotation": 0, "scale": 1, "fontScale": 1},
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
    "widgets": DEFAULT_WIDGETS.copy()
}

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

def load_config():
    if not os.path.exists(CONFIG_FILE):
        save_config(DEFAULT_CONFIG)
        return DEFAULT_CONFIG.copy()
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            config = json.load(f)
            config = ensure_config_structure(config)
            return config
    except (json.JSONDecodeError, IOError):
        save_config(DEFAULT_CONFIG)
        return DEFAULT_CONFIG.copy()

def save_config(data):
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def get_music_list():
    music_files = []
    for file in os.listdir(MUSIC_FOLDER):
        if file.lower().endswith(".mp3"):
            music_files.append({"name": os.path.splitext(file)[0], "file": file})
    return music_files

@bp.route("/")
def index():
    config = load_config()
    return render_template("music_index.html", music_list=get_music_list(), config=config, developer=DEVELOPER)

@bp.route("/music/<filename>")
def serve_music(filename):
    return send_from_directory(MUSIC_FOLDER, filename)

@bp.route("/api/music-list")
def api_music_list():
    return jsonify(get_music_list())

@bp.route("/api/config", methods=["GET"])
def api_get_config():
    return jsonify(load_config())

@bp.route("/api/config", methods=["POST"])
def api_update_config():
    new_config = request.get_json()
    if new_config is None:
        return jsonify({"error": "Invalid JSON"}), 400
    current_config = load_config()
    merged = deep_merge(current_config, new_config)
    save_config(merged)
    return jsonify({"status": "ok", "config": merged}), 200

@bp.route('/media/<path:filename>')
def serve_media_fix(filename):
    return send_from_directory(MEDIA_FOLDER, filename)

def create_app():
    app = Flask(__name__)
    app.register_blueprint(bp)
    return app

if __name__ == "__main__":
    app = create_app()
    print("=" * 50)
    print("Launch as standalone on port 50003")
    print(f"Available at: http://127.0.0.1:50003/music/")
    print("=" * 50)
    print(python)
    print("=" * 50)
    app.run(host='0.0.0.0', port=50003, debug=True)
