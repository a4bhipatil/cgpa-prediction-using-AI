import cv2
import dlib
import numpy as np

# Load face detector and shape predictor
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")

def detect_faces_dlib(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return detector(gray)

def detect_eyes_dlib(frame, face):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    landmarks = predictor(gray, face)
    eyes = []
    for n in range(36, 48):  # Eye landmarks
        x = landmarks.part(n).x
        y = landmarks.part(n).y
        eyes.append((x, y))
    return eyes

def detect_multiple_faces(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = detector(gray)
    return len(faces)

    # Nose tip 
def get_head_pose(frame, face):
    image_points = np.array([
        (predictor(frame, face).part(30).x, predictor(frame, face).part(30).y),  # Nose tip
        (predictor(frame, face).part(8).x, predictor(frame, face).part(8).y),    # Chin
        (predictor(frame, face).part(36).x, predictor(frame, face).part(36).y),  # Left eye left corner
        (predictor(frame, face).part(45).x, predictor(frame, face).part(45).y),  # Right eye right corner
        (predictor(frame, face).part(48).x, predictor(frame, face).part(48).y),  # Left Mouth corner
        (predictor(frame, face).part(54).x, predictor(frame, face).part(54).y)   # Right mouth corner
    ], dtype="double")

    model_points = np.array([
        (0.0, 0.0, 0.0),             # Nose tip
        (0.0, -330.0, -65.0),        # Chin
        (-225.0, 170.0, -135.0),     # Left eye left corner
        (225.0, 170.0, -135.0),      # Right eye right corner
        (-150.0, -150.0, -125.0),    # Left Mouth corner
        (150.0, -150.0, -125.0)      # Right mouth corner
    ])

    size = frame.shape
    focal_length = size[1]
    center = (size[1] // 2, size[0] // 2)

    camera_matrix = np.array(
        [[focal_length, 0, center[0]],
         [0, focal_length, center[1]],
         [0, 0, 1]], dtype="double"
    )
    dist_coeffs = np.zeros((4, 1))  # Assuming no lens distortion

    success, rotation_vector, translation_vector = cv2.solvePnP(
        model_points, image_points, camera_matrix, dist_coeffs
    )

    rvec_matrix = cv2.Rodrigues(rotation_vector)[0]
    proj_matrix = np.hstack((rvec_matrix, translation_vector))
    eulerAngles = cv2.decomposeProjectionMatrix(proj_matrix)[6]
    pitch, yaw, roll = [float(angle) for angle in eulerAngles]

    # Define thresholds for "looking away"
    if yaw < -15:
        return "Looking Left"
    elif yaw > 15:
        return "Looking Right"
    elif pitch < -15:
        return "Looking Up"
    elif pitch > 15:
        return "Looking Down"
    else:
        return "Looking Forward"


# Code for Object and Audio Detection ===

import torch
import torchvision.transforms as T
import sounddevice as sd

# Load YOLOv5 model (use 'yolov5s', 'yolov5m', etc.)
model = torch.hub.load('ultralytics/yolov5', 'yolov5s', trust_repo=True)
model.eval()

def detect_mobile_objects(frame):
    results = model(frame)
    detected_objects = []
    for *box, conf, cls in results.xyxy[0]:
        label = model.names[int(cls)]
        if label == "cell phone":
            x1, y1, x2, y2 = map(int, box)
            w, h = x2 - x1, y2 - y1
            detected_objects.append((label, float(conf), (x1, y1, w, h)))
    return detected_objects


def detect_audio(threshold=0.02, duration=1, samplerate=44100):
    try:
        audio = sd.rec(int(duration * samplerate), samplerate=samplerate, channels=1, dtype='float64')
        sd.wait()
        rms = np.sqrt(np.mean(audio**2))
        return rms > threshold
    except Exception as e:
        print(f"Audio detection error: {e}")
        return False