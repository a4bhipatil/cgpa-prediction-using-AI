const mongoose = require("mongoose");
//
// Test Assignment schema for managing which candidates can access which tests
const testAssignmentSchema = new mongoose.Schema(
  {
    testId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Test", 
      required: true 
    },
    candidateEmail: { 
      type: String, 
      required: true 
    },
    candidateId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      default: null // Will be populated when candidate registers/logs in
    },
    assignedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    status: {
      type: String,
      enum: ["pending", "active", "completed"],
      default: "pending"
    },
    invitationSent: {
      type: Boolean,
      default: false
    },
    accessToken: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
  },
  { timestamps: true }
);

// Index for efficient queries
testAssignmentSchema.index({ testId: 1, candidateEmail: 1 }, { unique: true });
testAssignmentSchema.index({ accessToken: 1 }, { unique: true });
testAssignmentSchema.index({ candidateId: 1 });

module.exports = mongoose.model("TestAssignment", testAssignmentSchema);