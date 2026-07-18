
<img width="1919" height="1040" alt="изображение" src="https://github.com/user-attachments/assets/c78ee7b2-c1fa-475b-801c-2dc313aa2e3f" />


# music-player-website
## ✨ Features

- **Audio Player** - Play MP3 files with standard controls
- **Visualizer** - Audio visualization with multiple modes
- **Equalizer** - 7-band equalizer for audio adjustments
- **Customizable Layout** - Drag and resize widgets (player, info, progress, volume, playlist)
- **Playlist Management** - Display and navigate through your music library
- **Persistent Settings** - All configurations are saved to `config.json`
- **Responsive Design** - Works on different screen sizes

## 📋 Requirements

- **Python 3.6+**
- **Flask** (web framework)
- **Modern web browser** (Chrome, Firefox, Edge, etc.)

## 🚀 Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/flask-music-player.git
cd flask-music-player
```

### 2. Set up Python virtual environment (recommended)
```bash
python3 -m venv venv
source venv/bin/activate  # On Linux/Mac
# or
venv\Scripts\activate     # On Windows
```

### 3. Install dependencies
```bash
pip install flask
```

### 4. Create required directories
```bash
mkdir -p music media templates
```

## 🎮 Usage

### Quick Start
```bash
python3 main.py
```

The server will start at `http://localhost:50003`

### Add Music Files
Place your MP3 files in the `music/` directory:
```bash
cp /path/to/your/music/*.mp3 music/
```

### Access the Player
Open your browser and navigate to:
```
http://localhost:50003
```

## 🗂️ Project Structure

```
flask-music-player/
├── main.py              # Application entry point
├── config.json          # Configuration file (auto-generated)
├── music/               # MP3 files directory
├── media/               # Media files directory
├── templates/
│   └── index.html       # Main HTML template
└── README.md
```
