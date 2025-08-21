const mongoose = require("mongoose");
const User = require("./models/user-model");
const Test = require("./models/test-model");
const Attempt = require("./models/attempt-model");
require("dotenv").config();

const testNewEndpoint = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("🔍 TESTING NEW getAllPublishedTests ENDPOINT");
    console.log("=" * 45);

    // Find a user with completed attempts
    const userWithAttempts = await User.findOne({ email: "n@gmail.com" });
    if (!userWithAttempts) {
      console.log("❌ No test user found");
      return;
    }

    console.log(`👤 Testing with user: ${userWithAttempts.name} (${userWithAttempts.email})`);

    // Test the new getAllPublishedTests logic
    console.log("\n📚 Testing getAllPublishedTests logic:");
    
    const allPublishedTests = await Test.find({
      published: true
    })
    .populate('createdBy', 'name email')
    .select('title description category duration questions published createdAt createdBy')
    .sort({ createdAt: -1 })
    .lean();
    
    console.log(`   Found ${allPublishedTests.length} published tests:`);
    allPublishedTests.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test.title} (ID: ${test._id})`);
    });

    // Test getMyAttempts logic
    console.log("\n📋 Testing getMyAttempts logic:");
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
      console.log(`   ${index + 1}. ${attempt.testId?.title || 'Unknown'} - Status: ${attempt.status} - Score: ${attempt.score}`);
    });

    // Test the complete dashboard transformation
    console.log("\n🔄 Testing Complete Dashboard Logic:");
    
    const attemptMap = new Map(attempts.map(attempt => [attempt.testId._id.toString(), attempt]));
    console.log(`   Attempt map has ${attemptMap.size} entries`);

    const transformedTests = allPublishedTests.map(test => {
      const hasAttempt = attemptMap.has(test._id.toString());
      const attempt = attemptMap.get(test._id.toString());
      
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

    console.log(`\n✅ FINAL DASHBOARD RESULT:`);
    console.log(`   Total published tests: ${allPublishedTests.length}`);
    console.log(`   Completed tests: ${completedTests.length}`);
    console.log(`   Pending tests: ${pendingTests.length}`);

    if (completedTests.length > 0) {
      console.log(`\n🎯 COMPLETED TESTS:`);
      completedTests.forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.title} - Score: ${test.avgScore}% - Status: ${test.status}`);
      });
    }

    if (pendingTests.length > 0) {
      console.log(`\n⏳ PENDING TESTS:`);
      pendingTests.forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.title} - Status: ${test.status}`);
      });
    }

    // Summary for user
    console.log(`\n📊 DASHBOARD SUMMARY FOR ${userWithAttempts.name}:`);
    console.log(`   🏆 Completed: ${completedTests.length} tests`);
    console.log(`   ⏳ Pending: ${pendingTests.length} tests`);
    console.log(`   🎯 Best Score: ${completedTests.length > 0 ? Math.max(...completedTests.map(t => t.avgScore)) : 0}%`);

  } catch (error) {
    console.error("❌ Error during test:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔚 Test completed");
  }
};

testNewEndpoint();