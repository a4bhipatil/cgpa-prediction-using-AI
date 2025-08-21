const User = require("../models/user-model");
const Test = require("../models/test-model");
const TestAssignment = require("../models/test-assignment-model");
const Attempt = require("../models/attempt-model");
const crypto = require("crypto");
//
// ✅ GET /api/hr/monitor - Fetch candidates for monitoring
const getMonitoredTests = async (req, res) => {
  try {
    const candidates = await User.find({ role: "candidate" }).select("-password");
    res.status(200).json(candidates);
  } catch (error) {
    console.error("Error fetching monitored candidates:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ POST /api/hr/create-test - Save AI-created test
const createTest = async (req, res) => {
  console.log("🧪 Received test creation request:", req.body);
  console.log("👤 HR ID:", req.user._id);
  console.log("🌐 Request headers:", req.headers);
  console.log("🔍 Request origin:", req.get('origin'));
  
  try {
    const {
      title,
      description,
      category,
      questions,
      duration,
      accessType,
      passingScore,
      enableProctoring,
    } = req.body;

    const createdBy = req.user._id; // from authMiddleware

    const newTest = new Test({
      title,
      description,
      category,
      questions,
      duration,
      accessType,
      passingScore,
      enableProctoring,
      createdBy,
    });

    await newTest.save();
    console.log("✅ Test saved successfully:", newTest._id);

    res.status(201).json({ message: "Test created successfully", test: newTest });
  } catch (error) {
    console.error("❌ Error creating test:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// ✅ GET /api/hr/my-tests - Get all tests created by the HR
const getHrCreatedTests = async (req, res) => {
  console.log("📋 Fetching tests for HR:", req.user._id);
  try {
    const tests = await Test.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    console.log("📋 Found tests:", tests.length);
    console.log("📋 First test data:", tests[0] ? {
      title: tests[0].title,
      description: tests[0].description,
      category: tests[0].category,
      questionsCount: tests[0].questions?.length
    } : "No tests found");
    res.status(200).json(tests);
  } catch (error) {
    console.error("❌ Error fetching HR tests:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ POST /api/hr/assign-test - Assign test to candidates
const assignTestToCandidates = async (req, res) => {
  console.log("📧 Received test assignment request:", req.body);
  console.log("👤 HR ID:", req.user._id);
  
  try {
    const { testId, candidateEmails } = req.body;
    
    if (!testId || !candidateEmails || !Array.isArray(candidateEmails) || candidateEmails.length === 0) {
      return res.status(400).json({ 
        error: "Test ID and candidate emails are required" 
      });
    }

    // Verify the test exists and belongs to this HR
    const test = await Test.findOne({ _id: testId, createdBy: req.user._id });
    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you don't have permission to assign it" 
      });
    }

    const assignments = [];
    const errors = [];

    for (const email of candidateEmails) {
      try {
        // Check if assignment already exists
        const existingAssignment = await TestAssignment.findOne({ 
          testId, 
          candidateEmail: email.trim().toLowerCase() 
        });
        
        if (existingAssignment) {
          errors.push(`${email}: Already assigned`);
          continue;
        }

        // Generate unique access token
        const accessToken = crypto.randomBytes(32).toString('hex');
        
        // Check if candidate exists in system
        const candidate = await User.findOne({ 
          email: email.trim().toLowerCase(), 
          role: "candidate" 
        });

        const assignment = new TestAssignment({
          testId,
          candidateEmail: email.trim().toLowerCase(),
          candidateId: candidate ? candidate._id : null,
          assignedBy: req.user._id,
          accessToken
        });

        await assignment.save();
        assignments.push({
          email: email.trim().toLowerCase(),
          accessToken,
          accessLink: `${process.env.CLIENT_URL || 'http://localhost:8081'}/test/${accessToken}`
        });

      } catch (error) {
        console.error(`Error assigning test to ${email}:`, error);
        errors.push(`${email}: ${error.message}`);
      }
    }

    console.log("✅ Test assignments created:", assignments.length);
    
    res.status(201).json({ 
      message: "Test assignment completed",
      assignments,
      errors: errors.length > 0 ? errors : undefined,
      testTitle: test.title
    });

  } catch (error) {
    console.error("❌ Error assigning test:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ GET /api/hr/test-assignments/:testId - Get assignments for a specific test
const getTestAssignments = async (req, res) => {
  try {
    const { testId } = req.params;
    
    // Verify the test belongs to this HR
    const test = await Test.findOne({ _id: testId, createdBy: req.user._id });
    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you don't have permission to view its assignments" 
      });
    }

    const assignments = await TestAssignment.find({ testId })
      .populate('candidateId', 'name email')
      .populate('testId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({ assignments, testTitle: test.title });
  } catch (error) {
    console.error("❌ Error fetching test assignments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ POST /api/hr/toggle-publish/:testId - Toggle test publish status
const toggleTestPublish = async (req, res) => {
  console.log("📢 Toggle publish request for test:", req.params.testId);
  console.log("👤 HR ID:", req.user._id);
  
  try {
    const { testId } = req.params;
    
    // Find the test and verify it belongs to this HR
    const test = await Test.findOne({ _id: testId, createdBy: req.user._id });
    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you don't have permission to modify it" 
      });
    }

    // Toggle the published status
    test.published = !test.published;
    await test.save();

    console.log(`✅ Test ${test.published ? 'published' : 'unpublished'}:`, test.title);
    
    res.status(200).json({ 
      message: `Test ${test.published ? 'published' : 'unpublished'} successfully`,
      test: {
        _id: test._id,
        title: test.title,
        published: test.published
      }
    });

  } catch (error) {
    console.error("❌ Error toggling test publish status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ GET /api/hr/test-reports - Get test reports with completion data
const getTestReports = async (req, res) => {
  const startTime = Date.now();
  console.log("📊 Fetching test reports for HR:", req.user._id);
  
  try {
    // Add pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Default to 50 tests per page
    const skip = (page - 1) * limit;
    
    console.log("🔍 Querying tests...");
    const testsStartTime = Date.now();
    
    // Get tests created by this HR with pagination
    const tests = await Test.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const testsEndTime = Date.now();
    console.log(`📊 Found ${tests.length} tests for HR (page ${page}) in ${testsEndTime - testsStartTime}ms`);
    
    if (tests.length === 0) {
      return res.status(200).json([]);
    }

    // Get test IDs for batch queries
    const testIds = tests.map(test => test._id);
    
    console.log("🔍 Querying assignments...");
    const assignmentsStartTime = Date.now();
    
    // Batch query for all assignments
    const allAssignments = await TestAssignment.find({ testId: { $in: testIds } });
    
    const assignmentsEndTime = Date.now();
    console.log(`📊 Found ${allAssignments.length} total assignments in ${assignmentsEndTime - assignmentsStartTime}ms`);
    
    console.log("🔍 Querying attempts...");
    const attemptsStartTime = Date.now();
    
    // Batch query for all completed attempts
    const allAttempts = await Attempt.find({ 
      testId: { $in: testIds }, 
      status: "completed" 
    });
    
    const attemptsEndTime = Date.now();
    console.log(`📊 Found ${allAttempts.length} total completed attempts in ${attemptsEndTime - attemptsStartTime}ms`);
    
    // Group assignments and attempts by testId
    const assignmentsByTest = {};
    const attemptsByTest = {};
    
    allAssignments.forEach(assignment => {
      const testId = assignment.testId.toString();
      if (!assignmentsByTest[testId]) assignmentsByTest[testId] = [];
      assignmentsByTest[testId].push(assignment);
    });
    
    allAttempts.forEach(attempt => {
      const testId = attempt.testId.toString();
      if (!attemptsByTest[testId]) attemptsByTest[testId] = [];
      attemptsByTest[testId].push(attempt);
    });
    
    // Generate reports
    const reports = tests.map(test => {
      const testId = test._id.toString();
      const assignments = assignmentsByTest[testId] || [];
      const completedAttempts = attemptsByTest[testId] || [];
      
      // Calculate statistics
      const totalCandidates = assignments.length;
      const completedCount = completedAttempts.length;
      const scores = completedAttempts.map(attempt => attempt.score).filter(score => score !== null);
      const avgScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      const passRate = completedCount > 0 ? (scores.filter(score => score >= (test.passingScore || 60)).length / completedCount) * 100 : 0;
      
      return {
        id: test._id,
        title: test.title,
        category: test.category,
        candidates: totalCandidates,
        completed: completedCount,
        avgScore: Math.round(avgScore * 10) / 10, // Round to 1 decimal place
        passRate: Math.round(passRate),
        createdAt: test.createdAt.toISOString().split('T')[0], // Format as YYYY-MM-DD
        published: test.published,
        passingScore: test.passingScore || 60
      };
    });
    
    const endTime = Date.now();
    console.log(`📊 Generated reports for ${reports.length} tests`);
    console.log(`⏱️ Total request time: ${endTime - startTime}ms`);
    
    res.status(200).json(reports);
    
  } catch (error) {
    const endTime = Date.now();
    console.error(`❌ Error fetching test reports after ${endTime - startTime}ms:`, error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ GET /api/hr/test-results/:testId - Get detailed results for a specific test
const getTestResults = async (req, res) => {
  const startTime = Date.now();
  console.log("📊 Fetching detailed test results for test:", req.params.testId);
  
  try {
    const { testId } = req.params;
    
    console.log("🔍 Verifying test ownership...");
    const testStartTime = Date.now();
    
    // Verify the test belongs to this HR
    const test = await Test.findOne({ _id: testId, createdBy: req.user._id });
    if (!test) {
      return res.status(404).json({ 
        error: "Test not found or you don't have permission to view its results" 
      });
    }

    const testEndTime = Date.now();
    console.log(`✅ Test verified in ${testEndTime - testStartTime}ms`);

    console.log("🔍 Fetching assignments...");
    const assignmentsStartTime = Date.now();

    // Get all assignments for this test (optimized query)
    const assignments = await TestAssignment.find({ testId })
      .populate('candidateId', 'name email')
      .lean(); // Use lean() for better performance

    const assignmentsEndTime = Date.now();
    console.log(`📊 Found ${assignments.length} assignments in ${assignmentsEndTime - assignmentsStartTime}ms`);

    console.log("🔍 Fetching attempts...");
    const attemptsStartTime = Date.now();

    // Get all attempts for this test (optimized query)
    const attempts = await Attempt.find({ testId })
      .populate('candidateId', 'name email')
      .lean(); // Use lean() for better performance

    const attemptsEndTime = Date.now();
    console.log(`📊 Found ${attempts.length} attempts in ${attemptsEndTime - attemptsStartTime}ms`);

    console.log("🔄 Processing results...");
    const processingStartTime = Date.now();

    // Create a map of attempts by candidateId for faster lookup
    const attemptsByCandidate = new Map();
    attempts.forEach(attempt => {
      if (attempt.candidateId && attempt.candidateId._id) {
        attemptsByCandidate.set(attempt.candidateId._id.toString(), attempt);
      }
    });

    // Create a map of assignments by candidateId for faster lookup
    const assignmentsByCandidate = new Map();
    assignments.forEach(assignment => {
      if (assignment.candidateId && assignment.candidateId._id) {
        assignmentsByCandidate.set(assignment.candidateId._id.toString(), assignment);
      }
    });

    // Get all unique candidates (from both assignments and attempts)
    const allCandidateIds = new Set();
    
    // Add candidates from assignments
    assignments.forEach(assignment => {
      if (assignment.candidateId?._id) {
        allCandidateIds.add(assignment.candidateId._id.toString());
      }
    });
    
    // Add candidates from attempts (even if they don't have assignments)
    attempts.forEach(attempt => {
      if (attempt.candidateId?._id) {
        allCandidateIds.add(attempt.candidateId._id.toString());
      }
    });

    console.log(`📊 Found ${allCandidateIds.size} unique candidates (${assignments.length} assignments + ${attempts.length} attempts)`);

    // Combine assignment and attempt data for all candidates
    const results = Array.from(allCandidateIds).map(candidateIdStr => {
      const assignment = assignmentsByCandidate.get(candidateIdStr);
      const attempt = attemptsByCandidate.get(candidateIdStr);

      // Get candidate info from assignment or attempt
      const candidateInfo = assignment?.candidateId || attempt?.candidateId;

      return {
        assignmentId: assignment?._id || null,
        candidateEmail: assignment?.candidateEmail || candidateInfo?.email || 'Unknown',
        candidateName: candidateInfo?.name || 'Unknown',
        candidateId: candidateInfo?._id,
        status: attempt?.status || assignment?.status || 'pending',
        score: attempt?.score || null,
        submittedAt: attempt?.submittedAt || null,
        duration: attempt?.duration || null,
        assignedAt: assignment?.createdAt || attempt?.startedAt || null,
        passed: attempt?.score ? attempt.score >= (test.passingScore || 60) : null,
        hasAssignment: !!assignment,
        hasAttempt: !!attempt
      };
    });

    // Calculate summary statistics
    const completedResults = results.filter(r => r.status === 'completed');
    const scores = completedResults.map(r => r.score).filter(s => s !== null);
    const avgScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    const passRate = completedResults.length > 0 ? (completedResults.filter(r => r.passed).length / completedResults.length) * 100 : 0;

    const summary = {
      testTitle: test.title,
      testCategory: test.category,
      totalAssigned: assignments.length,
      totalCandidates: results.length, // Total unique candidates (assigned + unassigned)
      completed: completedResults.length,
      pending: results.filter(r => r.status === 'pending').length,
      inProgress: results.filter(r => r.status === 'started' || r.status === 'in-progress').length,
      avgScore: Math.round(avgScore * 10) / 10,
      passRate: Math.round(passRate),
      passingScore: test.passingScore || 60,
      questionCount: test.questions ? test.questions.length : 0,
      duration: test.duration || 0,
      candidatesWithAssignments: results.filter(r => r.hasAssignment).length,
      candidatesWithoutAssignments: results.filter(r => !r.hasAssignment).length
    };

    const processingEndTime = Date.now();
    console.log(`🔄 Results processed in ${processingEndTime - processingStartTime}ms`);

    const endTime = Date.now();
    console.log(`⏱️ Total getTestResults time: ${endTime - startTime}ms`);

    res.status(200).json({ summary, results });
    
  } catch (error) {
    const endTime = Date.now();
    console.error(`❌ Error fetching test results after ${endTime - startTime}ms:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ GET /api/hr/monitor-sessions - Get candidate test sessions for monitoring
const getMonitorSessions = async (req, res) => {
  try {
    // Get all candidates
    const candidates = await User.find({ role: "candidate" }).select("_id name email");

    // Get all test assignments and attempts
    const assignments = await TestAssignment.find({}).populate("testId", "title category duration").lean();
    const attempts = await Attempt.find({}).populate("testId", "title category duration").lean();

    // Map candidateId to assignments and attempts
    const assignmentMap = {};
    assignments.forEach(a => {
      if (!assignmentMap[a.candidateEmail]) assignmentMap[a.candidateEmail] = [];
      assignmentMap[a.candidateEmail].push(a);
    });

    const attemptMap = {};
    attempts.forEach(attempt => {
      const candidateId = attempt.candidateId?.toString();
      if (!attemptMap[candidateId]) attemptMap[candidateId] = [];
      attemptMap[candidateId].push(attempt);
    });

    // Build session objects for frontend
    const sessions = [];
    for (const candidate of candidates) {
      // Find assignments and attempts for this candidate
      const candidateAssignments = assignmentMap[candidate.email] || [];
      const candidateAttempts = attemptMap[candidate._id.toString()] || [];

      // For each assignment, determine status
      candidateAssignments.forEach(assignment => {
        // Find corresponding attempt
        const attempt = candidateAttempts.find(a => a.testId._id.toString() === assignment.testId._id.toString());
        let status = "not-started";
        let progress = 0;
        let violations = 0;
        let timeRemaining = assignment.testId.duration ? `${assignment.testId.duration} min` : "N/A";
        let testName = assignment.testId.title;

        if (attempt) {
          if (attempt.status === "completed") {
            status = "completed";
            progress = 100;
            timeRemaining = "0 min";
          } else {
            status = "active";
            progress = 50; 
          }
        }

        sessions.push({
          id: `${candidate._id}_${assignment.testId._id}`,
          candidateId: candidate._id,
          name: candidate.name,
          email: candidate.email,
          testName,
          status,
          progress,
          violations,
          timeRemaining,
        });
      });

      // If candidate has attempts for tests not assigned (edge case)
      candidateAttempts.forEach(attempt => {
        const alreadyIncluded = sessions.find(s => s.candidateId.toString() === candidate._id.toString() && s.testName === attempt.testId.title);
        if (!alreadyIncluded) {
          let status = attempt.status === "completed" ? "completed" : "active";
          let progress = attempt.status === "completed" ? 100 : 50;
          let violations = attempt?.violations || 0; // Placeholder if available in `Attempt`

          let timeRemaining = attempt.testId.duration ? `${attempt.testId.duration} min` : "N/A";
          let testName = attempt.testId.title;

          sessions.push({
            id: `${candidate._id}_${attempt.testId._id}`,
            candidateId: candidate._id,
            name: candidate.name,
            email: candidate.email,
            testName,
            status,
            progress,
            violations,
            timeRemaining,
          });
        }
      });
    }

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("❌ Error fetching monitor sessions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getMonitoredTests,
  createTest,
  getHrCreatedTests,
  assignTestToCandidates,
  getTestAssignments,
  toggleTestPublish,
  getTestReports,
  getTestResults,
  getMonitorSessions,
};
