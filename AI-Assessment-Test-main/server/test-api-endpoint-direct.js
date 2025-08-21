const mongoose = require("mongoose");
const User = require("./models/user-model");
const Test = require("./models/test-model");
const Attempt = require("./models/attempt-model");
require("dotenv").config();

const testAPIEndpointDirect = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Test the specific attempt ID that the frontend is trying to fetch
    const attemptId = "6864fd5bef9f1a1b451fc6e7";
    console.log(`🔍 Testing attempt ID: ${attemptId}`);

    // Check if this attempt exists
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      console.log("❌ Attempt not found in database");
      return;
    }

    console.log("✅ Found attempt:");
    console.log(`   ID: ${attempt._id}`);
    console.log(`   Candidate ID: ${attempt.candidateId}`);
    console.log(`   Test ID: ${attempt.testId}`);
    console.log(`   Score: ${attempt.score}`);
    console.log(`   Status: ${attempt.status}`);

    // Test the API logic (simulate the controller)
    const detailedAttempt = await Attempt.findOne({
      _id: attemptId,
      // Note: In real API, candidateId would be checked against req.user._id
    })
    .populate({
      path: "testId",
      select: "title description category duration questions createdAt"
    })
    .lean();

    if (detailedAttempt) {
      console.log("\n✅ Detailed attempt (API simulation):");
      console.log(`   Test Title: ${detailedAttempt.testId?.title || 'N/A'}`);
      console.log(`   Test Questions: ${detailedAttempt.testId?.questions?.length || 0}`);
      console.log(`   Answers: ${detailedAttempt.answers?.length || 0}`);
      console.log(`   Started At: ${detailedAttempt.startedAt}`);
      console.log(`   Submitted At: ${detailedAttempt.submittedAt}`);
    } else {
      console.log("❌ Failed to get detailed attempt");
    }

    // Check what user this attempt belongs to
    const user = await User.findById(attempt.candidateId);
    if (user) {
      console.log(`\n👤 This attempt belongs to: ${user.name} (${user.email})`);
    }

  } catch (error) {
    console.error("❌ Error during test:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔚 Test completed");
  }
};

testAPIEndpointDirect();