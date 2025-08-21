# utils.py

import cv2
import os
from datetime import datetime

def save_snapshot(frame, filename):
    timestamp_text = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(frame, f"Timestamp: {timestamp_text}", (10, frame.shape[0] - 10),
                font, 0.6, (0, 0, 255), 2, cv2.LINE_AA)
    
    if not os.path.exists("Snapshots"):
        os.makedirs("Snapshots")

    path = os.path.join("Snapshots", filename)
    cv2.imwrite(path, frame)

def draw_alert_text(frame, text, position):
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(frame, text, position, font, 0.8, (0, 0, 255), 2, cv2.LINE_AA)
    return frame
