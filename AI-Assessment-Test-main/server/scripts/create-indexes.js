require("dotenv").config();
const mongoose = require("mongoose");
const Test = require("../models/test-model");
const Attempt = require("../models/attempt-model");

async function createIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Create indexes for Test collection
    console.log("🔧 Creating indexes for Test collection...");
    await Test.collection.createIndex({ published: 1, createdAt: -1 });
    await Test.collection.createIndex({ createdBy: 1, published: 1 });
    await Test.collection.createIndex({ category: 1, published: 1 });
    console.log("✅ Test indexes created");

    // Create indexes for Attempt collection
    console.log("🔧 Creating indexes for Attempt collection...");
    await Attempt.collection.createIndex({ candidateId: 1, testId: 1 }, { unique: true });
    await Attempt.collection.createIndex({ candidateId: 1, startedAt: -1 });
    await Attempt.collection.createIndex({ testId: 1, status: 1 });
    console.log("✅ Attempt indexes created");

    console.log("🎉 All indexes created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
    process.exit(1);
  }
}

createIndexes();