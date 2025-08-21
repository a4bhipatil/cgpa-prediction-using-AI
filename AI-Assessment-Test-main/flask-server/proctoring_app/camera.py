import cv2
import time
import os
import numpy as np
import threading
from datetime import datetime
from detection import detect_faces_dlib, detect_eyes_dlib, get_head_pose, detect_multiple_faces
from identity import get_face_encoding, compare_face_encoding
from playsound import playsound
from detection import detect_mobile_objects
from detection import detect_audio
import csv

SNAPSHOT_LOG = "snapshot_log.csv"

# Create CSV log with headers if not exists
if not os.path.exists(SNAPSHOT_LOG):
    with open(SNAPSHOT_LOG, mode='w', newline='') as log_file:
        log_writer = csv.writer(log_file)
        log_writer.writerow(["Event", "Timestamp", "Filename", "Details"])

# === SETTINGS ===
ALERT_SOUND = "alert.wav"
SNAPSHOT_DIR = "snapshots"
LOOK_AWAY_THRESHOLD = 5  # seconds
ABSENCE_THRESHOLD = 10   # seconds

if not os.path.exists(SNAPSHOT_DIR):
    os.makedirs(SNAPSHOT_DIR)

def sound_alert():
    try:
        playsound(ALERT_SOUND)
    except:
        print("[Sound Error] Check alert.wav and audio setup")

def take_snapshot(frame, event, details=""):
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"{SNAPSHOT_DIR}/{event}_{timestamp}.jpg"
    cv2.imwrite(filename, frame)
    print(f"[Snapshot] {event} saved at {filename}")

    # Log event to CSV
    with open(SNAPSHOT_LOG, mode='a', newline='') as log_file:
        log_writer = csv.writer(log_file)
        log_writer.writerow([event, timestamp, filename, details])

def log_event(event, details=""):
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    with open(SNAPSHOT_LOG, mode='a', newline='') as log_file:
        log_writer = csv.writer(log_file)
        log_writer.writerow([event, timestamp, "", details])

def generate_frames():
    cap = cv2.VideoCapture(0)
    known_face = None
    absence_start_time = None
    look_away_start_time = None
    last_snapshot_time = time.time()

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        faces = detect_faces_dlib(frame)
        face_count = detect_multiple_faces(frame)
        current_time = time.time()

        status_msgs = ["✅ Face Detected"]
        color = (0, 255, 0)

        # Identity verification
        if face_count == 1:
            if known_face is None:
                known_face = get_face_encoding(frame)
            elif not compare_face_encoding(known_face, frame):
                status_msgs.append("🚫 Different Face Detected")
                color = (0, 0, 255)
                threading.Thread(target=sound_alert).start()
                take_snapshot(frame, "face_swap", "Identity mismatch detected")

        # Absence detection
        if face_count == 0:
            if absence_start_time is None:
                absence_start_time = current_time
            elif current_time - absence_start_time >= ABSENCE_THRESHOLD:
                status_msgs.append("🚫 No Face Detected")
                color = (0, 0, 255)
                threading.Thread(target=sound_alert).start()
                take_snapshot(frame, "no_face", "No face detected for 10 seconds")
        else:
            absence_start_time = None

        # Multiple faces
        if face_count > 1:
            status_msgs.append("👥 Multiple Faces Detected")
            color = (0, 0, 255)
            threading.Thread(target=sound_alert).start()
            take_snapshot(frame, "multiple_faces")
            log_event("multiple_faces", "More than one face in frame")

        # Head Pose (Gaze)
        if face_count == 1:
            direction = get_head_pose(frame, faces[0])
            if direction != "Looking Forward":
                if look_away_start_time is None:
                    look_away_start_time = current_time
                elif current_time - look_away_start_time >= LOOK_AWAY_THRESHOLD:
                    status_msgs.append(f"👀 {direction}")
                    color = (0, 0, 255)
                    threading.Thread(target=sound_alert).start()
                    take_snapshot(frame, "looking_away", f"User looking {direction}")
            else:
                look_away_start_time = None
        else:
            look_away_start_time = None

        # Object detection (e.g., Mobile Phone)
        detected_objects = detect_mobile_objects(frame)
        for (label, conf, (x, y, w, h)) in detected_objects:
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
            cv2.putText(frame, f"{label} {conf:.2f}", (x, y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
            if label.lower() == "cell phone":
                status_msgs.append("📱 Mobile Detected")
                threading.Thread(target=sound_alert).start()
                take_snapshot(frame, "mobile_detected", f"Detected: {label} ({conf:.2f})")

        # Audio detection
        if detect_audio():
            status_msgs.append("🎹 Sound Detected")
            threading.Thread(target=sound_alert).start()
            take_snapshot(frame, "sound_detected", "Microphone input detected")

        # Snapshot every 60 seconds
        if current_time - last_snapshot_time >= 60:
            take_snapshot(frame, "periodic")
            log_event("periodic_snapshot", "Routine snapshot every 60 seconds")
            last_snapshot_time = current_time

        # Draw overlays
        final_status = " | ".join(status_msgs)
        cv2.putText(frame, final_status, (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        cv2.putText(frame, f"Faces: {face_count}", (30, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

        # Draw rectangles on faces
        for face in faces:
            x, y, w, h = face.left(), face.top(), face.width(), face.height()
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
            eyes = detect_eyes_dlib(frame, face)
            for (ex, ey) in eyes:
                cv2.circle(frame, (ex, ey), 3, (0, 255, 255), -1)

        # Encode for streaming
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    cap.release()