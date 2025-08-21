const Test = require("../models/test-model");
const Attempt = require("../models/attempt-model");
const TestAssignment = require("../models/test-assignment-model");
const { testCache, attemptCache } = require("../utils/cache");
const crypto = require("crypto");

const createTest = async (req, res) => {
  try {
    const startTime = Date.now();
    console.log("💾 Creating test - Request received");
    
    // 🚀 Performance: Extract and validate data efficiently
    const { 
      title, 
      description, 
      questions, 
      category, 
      duration, 
      passingScore, 
      questionCount,
      accessType,
      enableProctoring 
    } = req.body;
    
    // 🚀 Performance: Validate required fields early
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Test title is required" });
    }
    
    if (!questions || questions.length === 0) {
      return res.status(400).json({ error: "Test must have at least one question" });
    }
    
    // 🚀 Performance: Optimize question data structure
    const optimizedQuestions = questions.map((q, index) => ({
      id: q.id || `q_${Date.now()}_${index}`,
      text: q.text?.trim() || `Question ${index + 1}`,
      type: q.type || 'multiple-choice',
      options: q.options?.map((opt, optIndex) => ({
        id: opt.id || optIndex + 1,
        text: opt.text?.trim() || `Option ${optIndex + 1}`,
        isCorrect: Boolean(opt.isCorrect)
      })) || [],
      explanation: q.explanation?.trim() || ""
    }));
    
    console.log(`💾 Processing ${optimizedQuestions.length} questions`);
    
    // 🚀 Performance: Create test with optimized data structure
    const testData = {
      title: title.trim(),
      description: description?.trim() || "",
      category: category?.trim() || "General",
      duration: duration || 30,
      passingScore: passingScore || 70,
      questionCount: questionCount || optimizedQuestions.length,
      accessType: accessType || "invited",
      enableProctoring: Boolean(enableProctoring),
      questions: optimizedQuestions,
      createdBy: req.user._id,
      published: false, // Default to unpublished
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 🚀 Performance: Save with optimized options
    const test = new Test(testData);
    await test.save();
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Test created successfully in ${processingTime}ms`);
    console.log(`📊 Test ID: ${test._id}, Questions: ${test.questions.length}`);
    
    // 🚀 Performance: Return minimal response data
    const responseData = {
      _id: test._id,
      title: test.title,
      description: test.description,
      questionCount: test.questions.length,
      published: test.published,
      createdAt: test.createdAt
    };
    
    res.status(201).json({ 
      message: "Test created successfully", 
      test: responseData,
      processingTime: `${processingTime}ms`
    });
    
  } catch (error) {
    console.error("❌ Error creating test:", error);
    
    // 🚀 Performance: Detailed error logging
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: error.message 
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: "Test with this title already exists" 
      });
    }
    
    res.status(500).json({ 
      error: "Failed to create test",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getAllTests = async (req, res) => {
  try {
    const tests = await Test.find({ createdBy: req.user._id });
    res.status(200).json({ tests });
  } catch (error) {
    console.error("Error fetching tests:", error);
    res.status(500).json({ error: "Failed to fetch tests" });
  }
};

const getAvailableTests = async (req, res) => {
  try {
    console.log("🔍 Fetching available tests for candidate:", req.user._id);
    
    // 🚀 Performance: Check cache first
    const cacheKey = `available_tests_${req.user._id}`;
    const cachedTests = testCache.get(cacheKey);
    if (cachedTests) {
      console.log("🎯 Returning cached available tests:", cachedTests.length);
      return res.status(200).json({ tests: cachedTests });
    }
    
    // 🚀 Performance: Get attempted test IDs first (using lean for faster query)
    const candidateAttempts = await Attempt.find(
      { candidateId: req.user._id },
      { testId: 1, _id: 0 }
    ).lean();
    const attemptedTestIds = candidateAttempts.map(attempt => attempt.testId);
    console.log("✅ Attempted tests:", attemptedTestIds.length);
    
    // 🚀 Performance: Query tests that are published AND not attempted (database-level filtering)
    const availableTests = await Test.find({
      published: true,
      _id: { $nin: attemptedTestIds }
    })
    .populate('createdBy', 'name email')
    .select('title description category duration questions published createdAt createdBy')
    .sort({ createdAt: -1 }) // Show newest tests first
    .lean(); // Use lean for better performance
    
    console.log("🎯 Available tests after filtering:", availableTests.length);
    
    // 🚀 Performance: Cache the results
    testCache.set(cacheKey, availableTests);
    
    res.status(200).json({ tests: availableTests });
  } catch (error) {
    console.error("Error fetching available tests:", error);
    res.status(500).json({ error: "Failed to fetch available tests" });
  }
};

const getTestById = async (req, res) => {
  try {
    console.log("🔍 Fetching test by ID:", req.params.id);
    console.log("👤 User:", req.user.email, req.user.role);
    
    const test = await Test.findById(req.params.id);
    if (!test) {
      console.log("❌ Test not found with ID:", req.params.id);
      return res.status(404).json({ error: "Test not found" });
    }
    
    console.log("✅ Found test:", test.title);
    console.log("🔍 Test published status:", test.published);
    console.log("🔍 Test questions count:", test.questions?.length || 0);
    console.log("🔍 First question sample:", test.questions?.[0] ? {
      text: test.questions[0].text,
      optionsCount: test.questions[0].options?.length || 0,
      firstOption: test.questions[0].options?.[0]
    } : "No questions");
    
    res.status(200).json({ test });
  } catch (error) {
    console.error("❌ Error fetching test by ID:", error);
    res.status(404).json({ error: "Test not found" });
  }
};

const submitAttempt = async (req, res) => {
  try {
    const { testId } = req.params;
    const candidateId = req.user._id;

    console.log("📝 Submitting test attempt:", {
      testId,
      candidateId,
      score: req.body.score,
      answersCount: req.body.answers?.length || 0
    });

    // Check if user has already attempted this test
    const existingAttempt = await Attempt.findOne({ testId, candidateId });

    if (existingAttempt) {
      console.log("⚠️ User already attempted this test:", existingAttempt._id);
      return res.status(409).json({
        error: "You have already taken this test",
        existingAttemptId: existingAttempt._id
      });
    }

    // Create the new attempt record
    const attempt = new Attempt({
      testId,
      candidateId,
      answers: req.body.answers,
      score: req.body.score,
      status: "completed",
      submittedAt: new Date(),
    });

    await attempt.save();
    console.log("✅ Test attempt saved successfully:", attempt._id);

    // ⭐️ UPDATE a a ssignment status to 'completed'
    await TestAssignment.findOneAndUpdate(
      { testId: testId, candidateId: candidateId },
      { status: "completed" }
    );
    console.log("✅ Test assignment status updated to completed.");


    // Invalidate cache after new attempt
    const availableTestsCacheKey = `available_tests_${req.user._id}`;
    const dashboardTestsCacheKey = `dashboard_tests_${req.user._id}`;
    const attemptsCacheKey = `my_attempts_${req.user._id}`;
    testCache.delete(availableTestsCacheKey);
    testCache.delete(dashboardTestsCacheKey);
    attemptCache.delete(attemptsCacheKey);

    res.status(201).json({
      message: "Test submitted successfully",
      attempt: {
        _id: attempt._id,
        testId: attempt.testId,
        score: attempt.score,
        status: attempt.status,
        submittedAt: attempt.submittedAt
      },
      refreshDashboard: true
    });
  } catch (error) {
    console.error("❌ Error submitting attempt:", error);
    if (error.code === 11000) {
      return res.status(409).json({ error: "You have already taken this test" });
    }
    res.status(500).json({
      error: "Failed to submit test attempt",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const getCandidateAttempts = async (req, res) => {
  try {
    // Get attempts for the authenticated user
    const attempts = await Attempt.find({ candidateId: req.user._id }).populate("testId");
    res.status(200).json({ attempts });
  } catch (error) {
    console.error("Error fetching candidate attempts:", error);
    res.status(500).json({ error: "Failed to fetch attempts" });
  }
};

const getMyAttempts = async (req, res) => {
  try {
    console.log("🔍 Fetching attempts for user:", req.user._id, req.user.email);

    // 🚀 Performance: Check cache first
    const cacheKey = `my_attempts_${req.user._id}`;
    const cachedAttempts = attemptCache.get(cacheKey);
    if (cachedAttempts) {
      console.log("🎯 Returning cached attempts:", cachedAttempts.length);
      return res.status(200).json({ attempts: cachedAttempts });
    }
    
    // 🚀 Performance: Get attempts with optimized query and select only needed fields
    const attempts = await Attempt.find({ candidateId: req.user._id })
      .populate({
        path: "testId",
        select: "title description category duration createdAt" // Only get needed test fields
      })
      .select("testId score status startedAt submittedAt duration") // Only get needed attempt fields
      .sort({ startedAt: -1 }) // Show most recent attempts first
      .lean(); // Use lean for better performance
    
    console.log(`📝 Found ${attempts.length} attempts for user ${req.user.email}`);
    attempts.forEach((attempt, index) => {
      console.log(`   ${index + 1}. Test: ${attempt.testId?.title || 'Unknown'} - Status: ${attempt.status} - Score: ${attempt.score}`);
    });
    
    // 🚀 Performance: Cache the results
    attemptCache.set(cacheKey, attempts);
    
    res.status(200).json({ attempts });
  } catch (error) {
    console.error("❌ Error fetching my attempts:", error);
    res.status(500).json({ error: "Failed to fetch attempts" });
  }
};

const getAllAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find().populate("testId candidateId");
    res.status(200).json({ attempts });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch attempts" });
  }
};
// ✅ GET /api/tests/by-token/:token - Get test by access token
const getTestByToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find the assignment by access token
    const assignment = await TestAssignment.findOne({ 
      accessToken: token,
      expiresAt: { $gt: new Date() } // Check if not expired
    }).populate('testId');
    
    if (!assignment) {
      return res.status(404).json({ 
        error: "Invalid or expired test link" 
      });
    }
    
    // Check if candidate is logged in and matches the assignment
    if (req.user && req.user.role === 'candidate') {
      // Update assignment with candidate ID if not set
      if (!assignment.candidateId && req.user.email === assignment.candidateEmail) {
        assignment.candidateId = req.user._id;
        await assignment.save();
      }
      
      // Verify the logged-in candidate matches the assignment
      if (req.user.email !== assignment.candidateEmail) {
        return res.status(403).json({ 
          error: "This test is not assigned to your account" 
        });
      }
    }
    
    // Check if test has already been attempted
    if (assignment.candidateId) {
      const existingAttempt = await Attempt.findOne({ 
        testId: assignment.testId._id, 
        candidateId: assignment.candidateId 
      });
      
      if (existingAttempt) {
        return res.status(400).json({ 
          error: "You have already taken this test",
          attemptId: existingAttempt._id
        });
      }
    }
    
    res.status(200).json({ 
      test: assignment.testId,
      assignment: {
        id: assignment._id,
        candidateEmail: assignment.candidateEmail,
        status: assignment.status,
        expiresAt: assignment.expiresAt
      }
    });
    
  } catch (error) {
    console.error("Error fetching test by token:", error);
    res.status(500).json({ error: "Failed to fetch test" });
  }
};

// Get all tests for dashboard (published tests + completed unpublished tests)
const getAllPublishedTests = async (req, res) => {
  try {
    console.log("📚 Fetching all tests for dashboard:", req.user._id);
    
    // 🚀 Performance: Check cache first
    const cacheKey = `dashboard_tests_${req.user._id}`;
    const cachedTests = testCache.get(cacheKey);
    if (cachedTests) {
      console.log("🎯 Returning cached dashboard tests:", cachedTests.length);
      return res.status(200).json({ tests: cachedTests });
    }
    
    // Get ALL published tests
    const publishedTests = await Test.find({
      published: true
    })
    .populate('createdBy', 'name email')
    .select('title description category duration questions published createdAt createdBy')
    .lean();
    
    // Get tests that the user has completed (even if unpublished)
    const userAttempts = await Attempt.find(
      { candidateId: req.user._id },
      { testId: 1, _id: 0 }
    ).lean();
    const attemptedTestIds = userAttempts.map(attempt => attempt.testId);
    
    // Get completed tests that might not be published anymore
    const completedUnpublishedTests = await Test.find({
      _id: { $in: attemptedTestIds },
      published: false // Only get unpublished ones (published ones are already included)
    })
    .populate('createdBy', 'name email')
    .select('title description category duration questions published createdAt createdBy')
    .lean();
    
    // Combine both lists and remove duplicates
    const allTests = [...publishedTests];
    
    // Add completed unpublished tests that aren't already in the published list
    completedUnpublishedTests.forEach(test => {
      const existsInPublished = publishedTests.some(pubTest => pubTest._id.toString() === test._id.toString());
      if (!existsInPublished) {
        allTests.push(test);
      }
    });
    
    // Sort by creation date
    allTests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`📊 Dashboard tests: ${publishedTests.length} published + ${completedUnpublishedTests.length} completed unpublished = ${allTests.length} total`);
    
    // 🚀 Performance: Cache the results
    testCache.set(cacheKey, allTests);
    
    res.status(200).json({ tests: allTests });
  } catch (error) {
    console.error("Error fetching dashboard tests:", error);
    res.status(500).json({ error: "Failed to fetch tests" });
  }
};

// Get detailed attempt data for results page
const getAttemptDetail = async (req, res) => {
  try {
    const { attemptId } = req.params;
    console.log("🔍 Fetching detailed attempt data:", attemptId, "for user:", req.user._id);

    // Get the attempt with full test data
    const attempt = await Attempt.findOne({
      _id: attemptId,
      candidateId: req.user._id // Ensure user can only access their own attempts
    })
    .populate({
      path: "testId",
      select: "title description category duration questions createdAt" // Include questions for detailed view
    })
    .lean();

    if (!attempt) {
      return res.status(404).json({ error: "Attempt not found" });
    }

    console.log("✅ Found attempt:", attempt._id, "for test:", attempt.testId?.title);
    
    res.status(200).json({ attempt });
  } catch (error) {
    console.error("❌ Error fetching attempt detail:", error);
    res.status(500).json({ error: "Failed to fetch attempt details" });
  }
};

// Clear cache for debugging
const clearCache = async (req, res) => {
  try {
    testCache.clear();
    attemptCache.clear();
    console.log("🧹 Cache cleared successfully");
    res.status(200).json({ message: "Cache cleared successfully" });
  } catch (error) {
    console.error("❌ Error clearing cache:", error);
    res.status(500).json({ error: "Failed to clear cache" });
  }
};


const startTestAndCreateAssignment = async (req, res) => {
  try {
    const { testId } = req.params;
    const candidate = req.user; // from authMiddleware

    // 1. Check if an assignment for this test and candidate already exists
    const existingAssignment = await TestAssignment.findOne({
      testId: testId,
      candidateId: candidate._id,
    });

    if (existingAssignment) {
      // If it exists and is already active or completed, prevent starting again
      if (existingAssignment.status === "active" || existingAssignment.status === "completed") {
        return res.status(409).json({ message: "You have already started or completed this test." });
      }
      // If pending, just update to active
      existingAssignment.status = "active";
      await existingAssignment.save();
      return res.status(200).json({ message: "Test resumed successfully.", assignment: existingAssignment });
    }

    // 2. If no assignment exists, create one. First, get the test creator's ID.
    const test = await Test.findById(testId).select('createdBy');
    if (!test) {
      return res.status(404).json({ message: "Test not found." });
    }

    // 3. Create the new assignment document
    const newAssignment = new TestAssignment({
      testId: testId,
      candidateEmail: candidate.email,
      candidateId: candidate._id,
      assignedBy: test.createdBy, // The test creator is the assigner
      status: "active", // Set status directly to active
      accessToken: crypto.randomBytes(32).toString('hex'), // Generate a unique token
    });

    await newAssignment.save();

    res.status(201).json({ message: "Test started and assignment created.", assignment: newAssignment });

  } catch (error) {
    console.error("Error starting test and creating assignment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const getAssignmentsGroupedByStatus = async (req, res) => {
  try {
    const assignments = await TestAssignment.find({ assignedBy: req.user._id }) // Only show for HR
      .populate("candidateId", "name email")
      .populate("testId", "title category");

    const grouped = {
      pending: [],
      active: [],
      completed: []
    };

    assignments.forEach(assignment => {
      const status = assignment.status;
      const group = grouped[status];
      if (group) {
        group.push({
          candidateName: assignment.candidateId?.name || assignment.candidateEmail,
          candidateEmail: assignment.candidateEmail,
          testTitle: assignment.testId?.title || "Unknown",
          testCategory: assignment.testId?.category || "General",
          status,
          assignmentId: assignment._id
        });
      }
    });

    res.status(200).json(grouped);
  } catch (err) {
    console.error("❌ Error fetching grouped assignments:", err);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
};

module.exports = {
  createTest,
  getAllTests, // ✅ needed for test-router.js
  getAvailableTests, // ✅ new function for candidates
  getAllPublishedTests, // ✅ new function for dashboard (includes completed tests)
  getTestById,
  submitAttempt,
  getCandidateAttempts,
  getMyAttempts, // ✅ new function for current user attempts
  getAttemptDetail, // ✅ new function for detailed results
  getAllAttempts,
  getHrCreatedTests: getAllTests, // ✅ reused in HR dashboard
  getTestByToken,
  clearCache, // ✅ debug function
  startTestAndCreateAssignment,
  getAssignmentsGroupedByStatus
};

