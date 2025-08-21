const mongoose = require("mongoose");
const User = require("./models/user-model");
const Test = require("./models/test-model");
const Attempt = require("./models/attempt-model");
require("dotenv").config();

const testAttemptDetail = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("🔍 TESTING ATTEMPT DETAIL API");
    console.log("=" * 35);

    // Find user with attempts
    const user = await User.findOne({ email: "n@gmail.com" });
    console.log(`👤 Testing with user: ${user.name} (${user.email})`);

    // Get user's attempts
    const attempts = await Attempt.find({ candidateId: user._id });
    console.log(`📋 Found ${attempts.length} attempts for user`);

    for (const attempt of attempts) {
      console.log(`\n🔍 Testing attempt: ${attempt._id}`);
      
      // Test the new getAttemptDetail logic
      const detailedAttempt = await Attempt.findOne({
        _id: attempt._id,
        candidateId: user._id
      })
      .populate({
        path: "testId",
        select: "title description category duration questions createdAt"
      })
      .lean();

      if (detailedAttempt) {
        console.log("✅ Detailed attempt data:");
        console.log(`   ID: ${detailedAttempt._id}`);
        console.log(`   Test: ${detailedAttempt.testId?.title || 'Unknown'}`);
        console.log(`   Score: ${detailedAttempt.score}`);
        console.log(`   Status: ${detailedAttempt.status}`);
        console.log(`   Started: ${detailedAttempt.startedAt}`);
        console.log(`   Submitted: ${detailedAttempt.submittedAt || 'Not submitted'}`);
        console.log(`   Answers: ${detailedAttempt.answers?.length || 0} answers`);
        console.log(`   Questions: ${detailedAttempt.testId?.questions?.length || 0} questions`);
        
        // Show sample answers
        if (detailedAttempt.answers && detailedAttempt.answers.length > 0) {
          console.log("   Sample answers:");
          detailedAttempt.answers.slice(0, 3).forEach((answer, index) => {
            console.log(`     ${index + 1}. Q${answer.questionId}: ${answer.selectedOption} (${answer.correct ? 'Correct' : 'Incorrect'})`);
          });
        }
        
        // Show sample questions
        if (detailedAttempt.testId?.questions && detailedAttempt.testId.questions.length > 0) {
          console.log("   Sample questions:");
          detailedAttempt.testId.questions.slice(0, 2).forEach((question, index) => {
            console.log(`     ${index + 1}. ${question.text?.substring(0, 50)}...`);
            console.log(`        Options: ${question.options?.length || 0}`);
          });
        }
      } else {
        console.log("❌ Failed to get detailed attempt data");
      }
    }

  } catch (error) {
    console.error("❌ Error during test:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔚 Test completed");
  }
};

testAttemptDetail();