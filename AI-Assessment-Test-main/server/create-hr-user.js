const mongoose = require("mongoose");
const User = require("./models/user-model");
require("dotenv").config();

const createHRUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Create multiple HR users for testing
    const hrUsers = [
      {
        name: "HR Admin",
        email: "hr@test.com",
        password: "hr123",
        role: "hr"
      },
      {
        name: "HR Manager",
        email: "admin@company.com",
        password: "admin123",
        role: "hr"
      }
    ];

    for (const userData of hrUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`⚠️ User already exists: ${userData.email}`);
        continue;
      }

      // Create HR user with plain text password
      const hrUser = new User(userData);
      
      // Save without validation to skip bcrypt hashing
      await hrUser.save({ validateBeforeSave: false });
      
      console.log(`✅ HR user created: ${userData.email} / ${userData.password}`);
    }
    
  } catch (error) {
    console.error("❌ Error creating HR user:", error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

createHRUser();