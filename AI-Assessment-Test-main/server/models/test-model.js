const mongoose = require("mongoose");

// Option schema for each question
const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
});

// Question schema
const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [optionSchema],
});

// Full Test schema
const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    category: String,
    duration: Number, // in minutes
    passingScore: Number,
    accessType: {
      type: String,
      enum: ["invited", "public"],
      default: "invited",
    },
    enableProctoring: { type: Boolean, default: false },
    published: { type: Boolean, default: false }, // New field to control visibility
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    questions: [questionSchema],
  },
  { timestamps: true }
);

// 🚀 Performance: Add indexes for frequently queried fields
testSchema.index({ published: 1, createdAt: -1 }); // For published tests sorted by creation date
testSchema.index({ createdBy: 1, published: 1 }); // For HR to get their published tests
testSchema.index({ category: 1, published: 1 }); // For filtering by category

module.exports = mongoose.model("Test", testSchema);
