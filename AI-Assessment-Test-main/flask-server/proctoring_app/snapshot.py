# snapshot.py
import cv2
import os
from datetime import datetime

def save_snapshot(frame):
    # Create folder if it doesn't exist
    if not os.path.exists("snapshots"):
        os.makedirs("snapshots")

    # Get current date and time
    now = datetime.now()
    timestamp_str = now.strftime("%Y-%m-%d %H:%M:%S")
    filename_str = now.strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"snapshots/snapshot_{filename_str}.jpg"

    # Copy the frame and draw timestamp on it
    frame_with_timestamp = frame.copy()
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.7
    color = (0, 0, 255)  # Red
    thickness = 2
    position = (10, frame_with_timestamp.shape[0] - 20)  # Bottom-left corner

    cv2.putText(frame_with_timestamp, timestamp_str, position, font, font_scale, color, thickness, cv2.LINE_AA)

    # Save the image with timestamp
    cv2.imwrite(filename, frame_with_timestamp)
