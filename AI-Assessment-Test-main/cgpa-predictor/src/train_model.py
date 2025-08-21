import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.pipeline import Pipeline

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "student_data.csv")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURES = ["prev_gpa", "attendance_pct", "assignment_avg", "study_hours_per_week", "test_score_avg"]
TARGET = "cgpa"

def load_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    # basic cleaning / clipping to reasonable ranges
    df["attendance_pct"] = df["attendance_pct"].clip(0, 100)
    df["assignment_avg"] = df["assignment_avg"].clip(0, 100)
    df["test_score_avg"] = df["test_score_avg"].clip(0, 100)
    df["study_hours_per_week"] = df["study_hours_per_week"].clip(lower=0)
    df["prev_gpa"] = df["prev_gpa"].clip(0, 10)
    df[TARGET] = df[TARGET].clip(0, 10)
    df = df.dropna(subset=FEATURES + [TARGET])
    return df

def train_and_eval(df: pd.DataFrame):
    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = Pipeline(steps=[
        ("gbr", GradientBoostingRegressor(random_state=42))
    ])

    model.fit(X_train, y_train)
    preds = model.predict(X_test)

    mae = mean_absolute_error(y_test, preds)
    import math
    rmse = math.sqrt(mean_squared_error(y_test,preds))
    r2 = r2_score(y_test, preds)

    print("Evaluation on hold-out set")
    print(f"MAE : {mae:.3f}")
    print(f"RMSE: {rmse:.3f}")
    print(f"R^2 : {r2:.3f}")

    return model

def save_model(model):
    model_path = os.path.join(MODEL_DIR, "cgpa_model.joblib")
    joblib.dump(model, model_path)
    print(f"Saved model to: {model_path}")

    # Save feature names for prediction script
    with open(os.path.join(MODEL_DIR, "feature_names.json"), "w") as f:
        json.dump(FEATURES, f)

if __name__ == "__main__":
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(
            f"Dataset not found at {DATA_PATH}. "
            f"Make sure 'student_data.csv' is in the 'data' folder."
        )
    df = load_data(DATA_PATH)
    model = train_and_eval(df)
    save_model(model)
