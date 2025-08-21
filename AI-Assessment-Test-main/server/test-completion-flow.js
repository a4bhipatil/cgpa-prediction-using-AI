const mongoose = require("mongoose");
const User = require("./models/user-model");
const Attempt = require("./models/attempt-model");
const Test = require("./models/test-model");
require("dotenv").config();

const testCompletionFlow = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("🔍 TESTING COMPLETION FLOW");
    console.log("=" * 40);

    // Get all candidates
    const candidates = await User.find({ role: 'candidate' });
    console.log(`👥 Found ${candidates.length} candidates`);

    for (const candidate of candidates) {
      console.log(`\n👤 Testing for: ${candidate.name} (${candidate.email})`);
      console.log(`   ID: ${candidate._id}`);

      // Get attempts for this candidate
      const attempts = await Attempt.find({ candidateId: candidate._id })
        .populate("testId", "title")
        .sort({ submittedAt: -1 });

      console.log(`   📝 Total attempts: ${attempts.length}`);
      
      if (attempts.length > 0) {
        attempts.forEach((attempt, index) => {
          console.log(`   ${index + 1}. Test: ${attempt.testId?.title || 'Unknown'}`);
          console.log(`      Status: ${attempt.status}`);
          console.log(`      Score: ${attempt.score}`);
          console.log(`      Started: ${attempt.startedAt}`);
          console.log(`      Submitted: ${attempt.submittedAt || 'Not submitted'}`);
          console.log(`      Attempt ID: ${attempt._id}`);
        });

        // Count completed vs in-progress
        const completed = attempts.filter(a => a.status === 'completed').length;
        const inProgress = attempts.filter(a => a.status === 'in-progress').length;
        
        console.log(`   ✅ Completed: ${completed}`);
        console.log(`   ⏳ In Progress: ${inProgress}`);
      }
    }

    // Summary statistics
    console.log("\n📊 OVERALL STATISTICS");
    console.log("=" * 30);
    
    const allAttempts = await Attempt.find({}).populate("candidateId", "name email");
    const completedAttempts = allAttempts.filter(a => a.status === 'completed');
    const inProgressAttempts = allAttempts.filter(a => a.status === 'in-progress');
    
    console.log(`Total attempts in database: ${allAttempts.length}`);
    console.log(`✅ Completed attempts: ${completedAttempts.length}`);
    console.log(`⏳ In-progress attempts: ${inProgressAttempts.length}`);
    console.log(`❌ Orphaned attempts: ${allAttempts.filter(a => !a.candidateId).length}`);

    // Show recent completed tests
    if (completedAttempts.length > 0) {
      console.log("\n🎯 RECENT COMPLETED TESTS:");
      completedAttempts
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
        .slice(0, 5)
        .forEach((attempt, index) => {
          console.log(`${index + 1}. ${attempt.candidateId?.name || 'Unknown'} - Score: ${attempt.score} - ${attempt.submittedAt}`);
        });
    }

  } catch (error) {
    console.error("❌ Error during test:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔚 Test completed");
  }
};

testCompletionFlow();