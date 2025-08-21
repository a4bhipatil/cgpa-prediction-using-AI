const mongoose = require("mongoose");
const User = require("./models/user-model");
const Attempt = require("./models/attempt-model");
const Test = require("./models/test-model");
require("dotenv").config();

const debugAttempts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("🔍 DEBUGGING ATTEMPT ISSUES");
    console.log("=" * 50);

    // 1. Get all users
    const users = await User.find({});
    console.log(`📊 Total users in database: ${users.length}`);
    
    for (const user of users) {
      console.log(`👤 User: ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user._id}`);
    }
    console.log("");

    // 2. Get all attempts
    const attempts = await Attempt.find({}).populate("candidateId", "name email").populate("testId", "title");
    console.log(`📋 Total attempts in database: ${attempts.length}`);
    
    for (const attempt of attempts) {
      console.log(`📝 Attempt: ${attempt._id}`);
      console.log(`   - Candidate ID: ${attempt.candidateId}`);
      console.log(`   - Candidate Info: ${attempt.candidateId ? `${attempt.candidateId.name} (${attempt.candidateId.email})` : 'NULL/INVALID'}`);
      console.log(`   - Test: ${attempt.testId ? attempt.testId.title : 'NULL/INVALID'}`);
      console.log(`   - Score: ${attempt.score}`);
      console.log(`   - Status: ${attempt.status}`);
      console.log("");
    }

    // 3. Check for orphaned attempts (attempts without valid candidateId)
    const orphanedAttempts = await Attempt.find({
      $or: [
        { candidateId: null },
        { candidateId: { $exists: false } }
      ]
    });
    console.log(`🚨 Orphaned attempts (no candidateId): ${orphanedAttempts.length}`);
    
    // 4. Check for attempts with invalid candidateId references
    const allAttempts = await Attempt.find({});
    let invalidReferences = 0;
    for (const attempt of allAttempts) {
      if (attempt.candidateId) {
        const user = await User.findById(attempt.candidateId);
        if (!user) {
          console.log(`❌ Invalid reference: Attempt ${attempt._id} references non-existent user ${attempt.candidateId}`);
          invalidReferences++;
        }
      }
    }
    console.log(`🚨 Attempts with invalid user references: ${invalidReferences}`);

    // 5. Test specific user query
    console.log("\n🔍 TESTING CANDIDATE QUERIES");
    const candidates = users.filter(u => u.role === 'candidate');
    for (const candidate of candidates) {
      const userAttempts = await Attempt.find({ candidateId: candidate._id });
      console.log(`👤 ${candidate.name} (${candidate.email}): ${userAttempts.length} attempts`);
      
      // Show details of each attempt
      for (const attempt of userAttempts) {
        const test = await Test.findById(attempt.testId);
        console.log(`   📝 ${test ? test.title : 'Unknown Test'} - Score: ${attempt.score}`);
      }
    }

    // 6. Clean up orphaned data (optional - commented out for safety)
    console.log("\n🧹 CLEANUP OPTIONS:");
    console.log("To remove orphaned attempts, uncomment the cleanup section in this script");
    
    /*
    // UNCOMMENT THIS SECTION TO CLEAN UP ORPHANED DATA
    if (orphanedAttempts.length > 0) {
      console.log("Removing orphaned attempts...");
      await Attempt.deleteMany({
        $or: [
          { candidateId: null },
          { candidateId: { $exists: false } }
        ]
      });
      console.log("✅ Cleaned up orphaned attempts");
    }
    
    // Remove attempts with invalid user references
    for (const attempt of allAttempts) {
      if (attempt.candidateId) {
        const user = await User.findById(attempt.candidateId);
        if (!user) {
          await Attempt.findByIdAndDelete(attempt._id);
          console.log(`✅ Removed attempt with invalid user reference: ${attempt._id}`);
        }
      }
    }
    */

  } catch (error) {
    console.error("❌ Error during debugging:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔚 Debug completed");
  }
};

debugAttempts();