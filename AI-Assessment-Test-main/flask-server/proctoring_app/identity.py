import cv2
import face_recognition

def get_face_encoding(frame):
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    encodings = face_recognition.face_encodings(rgb_frame)
    if encodings:
        return encodings[0]
    return None

def compare_face_encoding(known_encoding, frame):
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    encodings = face_recognition.face_encodings(rgb_frame)
    if not encodings:
        return False
    return face_recognition.compare_faces([known_encoding], encodings[0])[0]
