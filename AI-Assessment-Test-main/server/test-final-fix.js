const mongoose = require("mongoose");
const User = require("./models/user-model");
const Test = require("./models/test-model");
const Attempt = require("./models/attempt-model");
require("dotenv").config();

const testFinalFix = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("🔍 TESTING FINAL FIX FOR COMPLETED TESTS");
    console.log("=" * 45);

    // Find user
    const user = await User.findOne({ email: "n@gmail.com" });
    console.log(`👤 Testing with user: ${user.name} (${user.email})`);

    // Test the new dashboard logic
    console.log("\n📚 Testing New Dashboard Logic:");
    
    // Step 1: Get all published tests
    const publishedTests = await Test.find({
      published: true
    })
    .populate('createdBy', 'name email')
    .select('title description category duration questions published createdAt createdBy')
    .lean();
    
    console.log(`   Published tests: ${publishedTests.length}`);
    
    // Step 2: Get user's attempts
    const userAttempts = await Attempt.find(
      { candidateId: user._id },
      { testId: 1, _id: 0 }
    ).lean();
    const attemptedTestIds = userAttempts.map(attempt => attempt.testId);
    
    console.log(`   User's attempted test IDs: ${attemptedTestIds.length}`);
    attemptedTestIds.forEach(id => console.log(`     - ${id}`));
    
    // Step 3: Get completed unpublished tests
    const completedUnpublishedTests = await Test.find({
      _id: { $in: attemptedTestIds },
      published: false
    })
    .populate('createdBy', 'name email')
    .select('title description category duration questions published createdAt createdBy')
    .lean();
    
    console.log(`   Completed unpublished tests: ${completedUnpublishedTests.length}`);
    completedUnpublishedTests.forEach(test => {
      console.log(`     - "${test.title}" (${test._id}) - Published: ${test.published}`);
    });
    
    // Step 4: Combine and deduplicate
    const allTests = [...publishedTests];
    
    completedUnpublishedTests.forEach(test => {
      const existsInPublished = publishedTests.some(pubTest => pubTest._id.toString() === test._id.toString());
      if (!existsInPublished) {
        allTests.push(test);
        console.log(`     + Added unpublished test: "${test.title}"`);
      }
    });
    
    console.log(`   Total dashboard tests: ${allTests.length}`);
    
    // Step 5: Get user's attempts with test details
    const attempts = await Attempt.find({ candidateId: user._id })
      .populate({
        path: "testId",
        select: "title description category duration createdAt"
      })
      .select("testId score status startedAt submittedAt duration")
      .sort({ startedAt: -1 })
      .lean();
    
    console.log(`   User's attempts: ${attempts.length}`);
    
    // Step 6: Test the transformation
    console.log("\n🔄 Testing Final Transformation:");
    
    const attemptMap = new Map(attempts.map(attempt => [attempt.testId._id.toString(), attempt]));
    console.log(`   Attempt map entries: ${attemptMap.size}`);
    
    const transformedTests = allTests.map(test => {
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
        published: test.published // Keep track of published status
      };
    });
    
    const completedTests = transformedTests.filter(test => test.status === "completed");
    const pendingTests = transformedTests.filter(test => test.status === "active");
    
    console.log(`\n✅ FINAL RESULT:`);
    console.log(`   Total tests: ${transformedTests.length}`);
    console.log(`   Completed tests: ${completedTests.length}`);
    console.log(`   Pending tests: ${pendingTests.length}`);
    
    if (completedTests.length > 0) {
      console.log(`\n🎯 COMPLETED TESTS:`);
      completedTests.forEach((test, index) => {
        console.log(`   ${index + 1}. "${test.title}"`);
        console.log(`      Score: ${test.avgScore}%`);
        console.log(`      Published: ${test.published}`);
        console.log(`      ID: ${test.id}`);
      });
    }
    
    if (pendingTests.length > 0) {
      console.log(`\n⏳ PENDING TESTS:`);
      pendingTests.forEach((test, index) => {
        console.log(`   ${index + 1}. "${test.title}" (Published: ${test.published})`);
      });
    }
    
    // Summary
    console.log(`\n📊 SUMMARY FOR ${user.name}:`);
    console.log(`   🏆 Total Completed: ${completedTests.length}`);
    console.log(`   ⏳ Available to Take: ${pendingTests.length}`);
    console.log(`   🎯 Best Score: ${completedTests.length > 0 ? Math.max(...completedTests.map(t => t.avgScore)) : 0}%`);
    
    // Check if all user attempts are now visible
    console.log(`\n✅ VERIFICATION:`);
    console.log(`   Database attempts: ${attempts.length}`);
    console.log(`   Dashboard completed: ${completedTests.length}`);
    console.log(`   All attempts visible: ${attempts.length === completedTests.length ? "YES ✅" : "NO ❌"}`);

  } catch (error) {
    console.error("❌ Error during test:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔚 Test completed");
  }
};

testFinalFix();