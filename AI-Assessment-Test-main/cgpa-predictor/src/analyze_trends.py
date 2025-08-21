import os
import numpy as np
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "student_data.csv")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "outputs")

# Reset outputs folder
if os.path.exists(OUT_DIR) and os.path.isdir(OUT_DIR):
    for f in os.listdir(OUT_DIR):
        os.remove(os.path.join(OUT_DIR, f))
else:
    os.makedirs(OUT_DIR, exist_ok=True)

def slope_over_semesters(df: pd.DataFrame, y_col: str = "cgpa") -> float:
    """Fit CGPA ~ semester and return slope."""
    if df["semester"].nunique() < 2:
        return 0.0  # not enough history
    X = df[["semester"]].values
    y = df[[y_col]].values
    model = LinearRegression().fit(X, y)
    return float(model.coef_[0][0])

def analyze(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for sid, g in df.sort_values(["student_id","semester"]).groupby("student_id"):
        g = g.copy()
        g["cgpa_diff"] = g["cgpa"].diff()  # semester-to-semester change

        slope = slope_over_semesters(g, "cgpa")
        sudden_drop = (g["cgpa_diff"] <= -0.6).any()
        low_engagement = ((g["attendance_pct"] < 75) & (g["study_hours_per_week"] < 8)).any()
        consistent_improvement = (g["cgpa_diff"].dropna() > 0).tail(3).all() if len(g) >= 4 else False

        latest = g.iloc[-1]
        flags = []
        if slope < -0.25:
            flags.append("Downward CGPA trend")
        if sudden_drop:
            flags.append("Sudden performance drop (≥0.6)")
        if low_engagement:
            flags.append("Low engagement (attendance<75 & study hours<8)")
        if consistent_improvement:
            flags.append("Consistent improvement (last 3 increases)")

        rows.append({
            "student_id": sid,
            "semesters": len(g),
            "latest_cgpa": latest["cgpa"],
            "trend_slope_per_sem": round(slope, 3),
            "flags": "; ".join(flags) if flags else "",
            "at_risk": "Yes" if ("Downward" in "; ".join(flags) or "Sudden" in "; ".join(flags) or "Low engagement" in "; ".join(flags)) else "No"
        })
    return pd.DataFrame(rows)

if __name__ == "__main__":
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Missing dataset: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)

    # Clean bounds
    for c in ["attendance_pct","assignment_avg","test_score_avg"]:
        df[c] = df[c].clip(0, 100)
    df["prev_gpa"] = df["prev_gpa"].clip(0, 10)
    df["cgpa"] = df["cgpa"].clip(0, 10)

    # === Run Risk Analysis ===
    report = analyze(df)
    out_csv = os.path.join(OUT_DIR, "risk_report.csv")
    report.to_csv(out_csv, index=False)
    print(f" Saved risk report: {out_csv}")
    print(report.head(10).to_string(index=False))

    # === Generate Correlation Heatmap ===
    plt.figure(figsize=(10, 6))
    corr = df.corr(numeric_only=True)  # correlation only for numeric features
    sns.heatmap(corr, annot=True, cmap="coolwarm", center=0)

    plt.title("Feature Correlation Heatmap")
    heatmap_file = os.path.join(OUT_DIR, "correlation_heatmap.png")
    plt.savefig(heatmap_file)
    plt.show()
    print(f" Saved heatmap: {heatmap_file}")
