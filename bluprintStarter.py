from flask import Flask
import os
import importlib

"""But for your blueprint to connect,
 you need to rename your blueprint file to routes/
  insert it into the routes entry)"""

app = Flask(__name__)
app.secret_key = 'YOUR_KEY'

for root, dirs, files in os.walk("routes"):
    for file in files:
        if file.endswith(".py") and file != "__init__.py":
            file_path = os.path.join(root, file)
            import_path = file_path.replace(".py", "").replace(os.sep, ".")
            module = importlib.import_module(import_path)
            if hasattr(module, "bp"):
                app.register_blueprint(getattr(module, "bp"))
                print(f"🔌 Подключил: {import_path}")

@app.route('/')
def home():
    return "main page"

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=9999, debug=True)