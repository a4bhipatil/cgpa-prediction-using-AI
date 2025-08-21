const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test" },
  answers: [
    {
      questionId: String,
      selectedOption: String,
      correct: Boolean
    }
  ],
  score: Number,
  status: { type: String, enum: ["in-progress", "completed"], default: "in-progress" },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  duration: Number
});

// 🚀 Performance: Add indexes for frequently queried fields
attemptSchema.index({ candidateId: 1, testId: 1 }, { unique: true }); // Prevent duplicate attempts
attemptSchema.index({ candidateId: 1, startedAt: -1 }); // For getting user's attempts sorted by date
attemptSchema.index({ testId: 1, status: 1 }); // For getting test statistics

module.exports = mongoose.model("Attempt", attemptSchema);
