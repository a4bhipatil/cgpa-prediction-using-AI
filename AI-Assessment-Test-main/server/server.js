require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require("compression");

// Import routers
const authRouter = require("./router/auth-router");
const testRouter = require("./router/test-router");
const attemptRouter = require("./router/attempt-router");
const hrRouter = require("./router/hr-router");
const ProjectRoute = require('./router/route');

// Middlewares
const errorMiddleware = require("./middlewares/error-middleware");

// Initialize express app
const app = express();

// Middleware setup
app.use(compression()); // 🚀 Performance: Enable gzip compression
app.use(cors({
  origin: ["http://localhost:8080", "http://localhost:8081", "http://localhost:3000"],
  credentials: true
}));
// 🚀 Performance: Optimized JSON parsing with limits
app.use(express.json({
  limit: '5mb', // Reduced from 10mb for better performance
  strict: true,
  type: 'application/json'
}));
app.use(express.urlencoded({
  extended: true,
  limit: '5mb',
  parameterLimit: 1000 // Limit URL parameters
}));

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/tests", testRouter);
app.use("/api/attempts", attemptRouter);
app.use("/api/hr", hrRouter);
app.use('/cheat-detect', ProjectRoute);

// Global error handler
app.use(errorMiddleware);

// Server port
const PORT = process.env.PORT || 8080;

// ✅ Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () =>
      console.log(`🚀 Server started at http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
