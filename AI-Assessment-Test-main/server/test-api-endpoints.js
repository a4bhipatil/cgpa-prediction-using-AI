const mongoose = require("mongoose");
const User = require("./models/user-model");
const Test = require("./models/test-model");
const Attempt = require("./models/attempt-model");
require("dotenv").config();

const testAPIEndpoints = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("🔍 TESTING API ENDPOINT RESPONSES");
    console.log("=" * 40);

    // Find a user with completed attempts
    const userWithAttempts = await User.findOne({ email: "n@gmail.com" });
    if (!userWithAttempts) {
      console.log("❌ No test user found");
      return;
    }

    console.log(`👤 Testing with user: ${userWithAttempts.name} (${userWithAttempts.email})`);
    console.log(`   User ID: ${userWithAttempts._id}`);

    // Test 1: getMyAttempts endpoint
    console.log("\n📋 Testing getMyAttempts:");
    const attempts = await Attempt.find({ candidateId: userWithAttempts._id })
      .populate({
        path: "testId",
        select: "title description category duration createdAt"
      })
      .select("testId score status startedAt submittedAt duration")
      .sort({ startedAt: -1 })
      .lean();

    console.log(`   Found ${attempts.length} attempts:`);
    attempts.forEach((attempt, index) => {
      console.log(`   ${index + 1}. ${attempt.testId?.title || 'Unknown Test'}`);
      console.log(`      Status: ${attempt.status}`);
      console.log(`      Score: ${attempt.score}`);
      console.log(`      Test ID: ${attempt.testId?._id}`);
      console.log(`      Attempt ID: ${attempt._id}`);
    });

    // Test 2: getAvailableTests endpoint
    console.log("\n📚 Testing getAvailableTests:");
    const candidateAttempts = await Attempt.find(
      { candidateId: userWithAttempts._id },
      { testId: 1, _id: 0 }
    ).lean();
    const attemptedTestIds = candidateAttempts.map(attempt => attempt.testId);
    console.log(`   Attempted test IDs: ${attemptedTestIds.map(id => id.toString())}`);

    const availableTests = await Test.find({
      published: true,
      _id: { $nin: attemptedTestIds }
    })
    .populate('createdBy', 'name email')
    .select('title description category duration questions published createdAt createdBy')
    .sort({ createdAt: -1 })
    .lean();

    console.log(`   Available tests: ${availableTests.length}`);
    availableTests.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test.title} (ID: ${test._id})`);
    });

    // Test 3: Check what the frontend transformation would produce
    console.log("\n🔄 Testing Frontend Transformation:");
    
    // Get all published tests (like getAvailableTests would return)
    const allPublishedTests = await Test.find({ published: true })
      .populate('createdBy', 'name email')
      .select('title description category duration questions published createdAt createdBy')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`   All published tests: ${allPublishedTests.length}`);
    
    // Simulate the transformation logic from Dashboard.jsx
    const attemptMap = new Map(attempts.map(attempt => [attempt.testId._id.toString(), attempt]));
    console.log(`   Attempt map size: ${attemptMap.size}`);
    console.log(`   Attempt map keys: ${Array.from(attemptMap.keys())}`);

    const transformedTests = allPublishedTests.map(test => {
      const hasAttempt = attemptMap.has(test._id.toString());
      const attempt = attemptMap.get(test._id.toString());
      
      console.log(`   Test: ${test.title}`);
      console.log(`     Test ID: ${test._id}`);
      console.log(`     Has Attempt: ${hasAttempt}`);
      console.log(`     Status: ${hasAttempt ? "completed" : "active"}`);
      
      return {
        id: test._id,
        title: test.title,
        description: test.description,
        category: test.category || "General",
        status: hasAttempt ? "completed" : "active",
        createdDate: new Date(test.createdAt).toISOString().split('T')[0],
        respondents: hasAttempt ? 1 : 0,
        avgScore: attempt?.score || 0,
        duration: test.duration || 30,
        questions: test.questions || [],
        attempt: attempt,
      };
    });

    const completedTests = transformedTests.filter(test => test.status === "completed");
    const pendingTests = transformedTests.filter(test => test.status === "active");

    console.log(`\n📊 FINAL RESULT:`);
    console.log(`   Completed tests: ${completedTests.length}`);
    console.log(`   Pending tests: ${pendingTests.length}`);

    if (completedTests.length > 0) {
      console.log(`\n✅ COMPLETED TESTS:`);
      completedTests.forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.title} - Score: ${test.avgScore}`);
      });
    }

  } catch (error) {
    console.error("❌ Error during test:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔚 Test completed");
  }
};

testAPIEndpoints();