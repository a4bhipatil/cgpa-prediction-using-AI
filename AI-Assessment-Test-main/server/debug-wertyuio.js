const mongoose = require("mongoose");
const User = require("./models/user-model");
const Test = require("./models/test-model");
const Attempt = require("./models/attempt-model");
require("dotenv").config();

const debugWertyuio = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("🔍 DEBUGGING WERTYUIO TEST ISSUE");
    console.log("=" * 35);

    // Find user
    const user = await User.findOne({ email: "n@gmail.com" });
    console.log(`👤 User: ${user.name} (ID: ${user._id})`);

    // Find all tests with "wertyuio" in the name
    const wertyuioTests = await Test.find({ 
      title: { $regex: /wertyuio/i } 
    });
    
    console.log(`\n📚 Found ${wertyuioTests.length} tests with "wertyuio" in name:`);
    wertyuioTests.forEach((test, index) => {
      console.log(`   ${index + 1}. "${test.title}"`);
      console.log(`      ID: ${test._id}`);
      console.log(`      Published: ${test.published}`);
      console.log(`      Created: ${test.createdAt}`);
    });

    // Find the user's attempt for wertyuio
    const wertyuioAttempt = await Attempt.findOne({ 
      candidateId: user._id,
      // Find attempt where testId matches one of the wertyuio tests
    }).populate('testId');
    
    console.log("\n📝 User's wertyuio attempt:");
    if (wertyuioAttempt && wertyuioAttempt.testId && wertyuioAttempt.testId.title.toLowerCase().includes('wertyuio')) {
      console.log(`   Found attempt for: ${wertyuioAttempt.testId.title}`);
      console.log(`   Attempted Test ID: ${wertyuioAttempt.testId._id}`);
      console.log(`   Status: ${wertyuioAttempt.status}`);
      console.log(`   Score: ${wertyuioAttempt.score}`);
    } else {
      console.log("   No wertyuio attempt found");
    }

    // Check all user's attempts
    const allAttempts = await Attempt.find({ candidateId: user._id }).populate('testId');
    console.log(`\n📋 All user attempts (${allAttempts.length}):`);
    allAttempts.forEach((attempt, index) => {
      console.log(`   ${index + 1}. Test: "${attempt.testId?.title || 'Unknown'}"`);
      console.log(`      Test ID: ${attempt.testId?._id || 'Unknown'}`);
      console.log(`      Status: ${attempt.status}`);
      console.log(`      Score: ${attempt.score}`);
    });

    // Check which tests are published
    console.log(`\n🌐 Published tests:`);
    const publishedTests = await Test.find({ published: true });
    publishedTests.forEach((test, index) => {
      console.log(`   ${index + 1}. "${test.title}" (ID: ${test._id})`);
    });

    // Check the matching logic
    console.log(`\n🔍 Matching Logic Test:`);
    const attemptMap = new Map();
    allAttempts.forEach(attempt => {
      if (attempt.testId) {
        attemptMap.set(attempt.testId._id.toString(), attempt);
        console.log(`   Added to map: ${attempt.testId._id.toString()} -> ${attempt.testId.title}`);
      }
    });

    console.log(`\n🗺️ Attempt Map Contents:`);
    for (const [key, value] of attemptMap.entries()) {
      console.log(`   ${key} -> ${value.testId.title} (Status: ${value.status})`);
    }

    console.log(`\n🎯 Checking Published Tests Against Attempts:`);
    publishedTests.forEach(test => {
      const hasAttempt = attemptMap.has(test._id.toString());
      const attempt = attemptMap.get(test._id.toString());
      console.log(`   Test: "${test.title}" (${test._id})`);
      console.log(`     Has Attempt: ${hasAttempt}`);
      console.log(`     Status: ${hasAttempt ? "completed" : "active"}`);
      if (hasAttempt) {
        console.log(`     Score: ${attempt.score}`);
      }
    });

  } catch (error) {
    console.error("❌ Error during debug:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔚 Debug completed");
  }
};

debugWertyuio();