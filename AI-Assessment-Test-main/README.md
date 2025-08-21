# AI Assessment Test Platform

A comprehensive assessment platform built with React, Node.js, and MongoDB for conducting online tests with AI-powered features.

## 🚀 Dynamic API Integration Complete!

All candidate pages are now fully integrated with real APIs:

### ✅ Features Implemented:
- **Dynamic Dashboard**: Real-time test data and statistics
- **Dynamic Test Listing**: Live test availability from database
- **Dynamic Test Taking**: Real test questions and submission
- **Dynamic Results**: Actual attempt history and scores
- **Real Authentication**: JWT-based auth system
- **API Error Handling**: Proper loading states and error messages

### 🔧 API Endpoints Used:
- `GET /api/test/available` - Get available tests for candidates
- `GET /api/test/:id` - Get specific test details
- `POST /api/test/:testId/submit` - Submit test attempt
- `GET /api/test/my-attempts` - Get user's test attempts
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration

## 🏃‍♂️ Quick Start

### 1. Start the Backend Server
```bash
cd server
npm install
npm run dev
```

### 2. Start the Frontend Client
```bash
cd client
npm install
npm run dev
```

### 3. Start the AI Question Generator (Flask)
```bash
cd flask-server
pip install -r requirements.txt
python server.py
```

### 4. Access the Application
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- AI Generator: http://localhost:5000

## 🎯 Test Accounts

### HR Account (can create tests)
- Email: hr@example.com
- Password: password123

### Candidate Account (can take tests)
- Email: candidate@example.com
- Password: password123

## 📊 Database Structure

### Tests Collection
- Title, description, category
- Questions with options and correct answers
- Created by HR users
- Published/draft status

### Attempts Collection
- User attempts with timestamps
- Individual question responses
- Final scores and results
- Violation tracking

## 🔄 Real-time Features

### Files Modified for API Integration:
- `client/src/pages/candidate/Dashboard.jsx` - Dynamic stats
- `client/src/pages/candidate/TestList.jsx` - Live test data
- `client/src/pages/candidate/TestTaking.jsx` - Real test submission
- `client/src/pages/candidate/TestResults.jsx` - Actual attempt history
- `server/controllers/test-controller.js` - New API endpoints
- `server/router/test-router.js` - New routes added

## 🎯 What's Dynamic Now:

1. **Dashboard Stats**: Real counts of pending/completed tests
2. **Test Cards**: Actual test data from database
3. **Test Questions**: Real questions with proper scoring
4. **Results History**: Actual attempt data with scores
5. **Performance Analytics**: Real data-driven charts
6. **Loading States**: Proper UX during API calls
7. **Error Handling**: User-friendly error messages

The system is now fully functional with real data flow between frontend and backend!

---

## 🚀 AI-Tutor Setup Guide

### 1. Install Python Dependencies

Run the following script to install all required Python packages:

```bash
pip install -r requirements.txt
```

### 2. Download Dlib Shape Predictor

Download the face landmark predictor model:

👉 [Download shape_predictor_68_face_landmarks.dat.bz2](https://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2)

Extract the file and place it in the following directory:

```
flask-server/proctoring_app/shape_predictor_68_face_landmarks.dat
```

### 3. Run the Application

#### 3.1 Backend Server (Node.js)
```bash
cd server
npm install
npm run dev
```

#### 3.2 Frontend Client (React)
```bash
cd client
npm install
npm run dev
```

#### 3.3 Proctoring Module (Flask App)
```bash
cd flask-server/proctoring_app
python main.py
```

#### 3.4 Contact Bot (Flask App)
```bash
cd contact-bot
python contact_bot.py
```