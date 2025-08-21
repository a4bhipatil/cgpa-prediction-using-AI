# AI Proctoring App

This project is a simple camera-based AI proctoring tool using Python 3.8 with MediaPipe and Dlib.

## Features

- Face Detection (Dlib)
- Eye Tracking
- Multi-face Detection (MediaPipe)
- Real-time webcam monitoring
- GUI with Tkinter
- Sound alerts for suspicious behavior

## Setup

1. Download the shape predictor from:
   http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2
   Extract and place it in the project folder.

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the App:

```bash
python main.py
```

Press 'q' to quit webcam view.

## Note

Make sure you have a webcam enabled and working. Place `alert.wav` in the root directory.
