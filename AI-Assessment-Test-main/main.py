from flask import Flask, render_template, request
import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
SRC_DIR = BASE_DIR / "cgpa-predictor" / "src"


app = Flask(__name__, template_folder=str(SRC_DIR / "Templates"))

def run_script(script_name, args=None):
    """Run a Python script in src/ folder"""
    script_path = SRC_DIR / script_name
    cmd = [sys.executable, str(script_path)]
    if args:
        cmd.extend(args)

    result = subprocess.run(
        cmd, capture_output=True, text=True, cwd=str(SRC_DIR)
    )
    return result.stdout, result.stderr

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    stdout, stderr = run_script("predict.py")
    return render_template("index.html", prediction=stdout, errors=stderr)

@app.route("/analyze", methods=["POST"])
def analyze():
    stdout, stderr = run_script("analyze_trends.py")
    return render_template("index.html", analysis=stdout, errors=stderr)

if __name__ == "__main__":
    app.run(debug=True)