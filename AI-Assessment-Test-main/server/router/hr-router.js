const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth-middleware");
//
const {
  getMonitoredTests,
  createTest,
  getHrCreatedTests,
  assignTestToCandidates,
  getTestAssignments,
  toggleTestPublish,
  getTestReports,
  getTestResults,
  getMonitorSessions, // <-- Add this import
} = require("../controllers/hr-controller");

// ✅ Route to monitor candidates
router.get("/monitor", authMiddleware, getMonitoredTests);

// ✅ Route to get live test sessions for monitoring (NEW)
router.get("/monitor-sessions", authMiddleware, getMonitorSessions);

// ✅ Route to save a test created by HR (including AI-generated)
router.post("/create-test", authMiddleware, createTest);

// ✅ Route to get tests created by this HR
router.get("/my-tests", authMiddleware, getHrCreatedTests);

// ✅ Route to assign test to candidates
router.post("/assign-test", authMiddleware, assignTestToCandidates);

// ✅ Route to get assignments for a specific test
router.get("/test-assignments/:testId", authMiddleware, getTestAssignments);

// ✅ Route to toggle test publish status
router.post("/toggle-publish/:testId", authMiddleware, toggleTestPublish);

// ✅ Route to get test reports with completion data
router.get("/test-reports", authMiddleware, getTestReports);

// ✅ Route to get detailed results for a specific test
router.get("/test-results/:testId", authMiddleware, getTestResults);

module.exports = router;
