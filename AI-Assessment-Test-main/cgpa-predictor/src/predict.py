import os
import json
import joblib
import numpy as np
import pandas as pd

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "cgpa_model.joblib")
FEATURES_PATH = os.path.join(MODEL_DIR, "feature_names.json")

def load_model():
    model = joblib.load(MODEL_PATH)
    with open(FEATURES_PATH, "r") as f:
        features = json.load(f)
    return model, features

def predict_cgpa(sample: dict) -> float:
    model, features = load_model()
    X = pd.DataFrame([sample], columns=features)
    pred = float(model.predict(X)[0])
    return max(0.0, min(10.0, pred))  # keep in 0–10

def risk_level(pred_cgpa: float, prev_gpa: float) -> tuple[str, list[str]]:
    """Simple rule-based flags. Adjust thresholds to your context."""
    reasons = []
    level = "Low"

    # core threshold (example): “at risk” if predicted CGPA < 6.0
    if pred_cgpa < 6.0:
        level = "High"
        reasons.append("Predicted CGPA below 6.0")

    # significant drop vs previous GPA (heuristic)
    if prev_gpa - pred_cgpa >= 0.5:
        level = "Medium" if level == "Low" else level
        reasons.append("Significant predicted drop vs previous GPA (≥0.5)")

    return level, reasons

if __name__ == "__main__":
    # Example input (replace with real values)
    sample = {
        "prev_gpa": 6.9,
        "attendance_pct": 76,
        "assignment_avg": 68,
        "study_hours_per_week": 7,
        "test_score_avg": 64
    }

    pred = predict_cgpa(sample)
    level, reasons = risk_level(pred, sample["prev_gpa"])

    print(f"Predicted CGPA: {pred:.2f}")
    print(f"Risk Level    : {level}")
    if reasons:
        print("Reasons:")
        for r in reasons:
            print(f" - {r}")
