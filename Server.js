require('dotenv').config();

const express = require("express");
const cors = require("cors");
const { createRouter } = require("./auth");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

// Secure HTTP headers
app.use(helmet());

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
}));

// Middleware
app.use(express.json()); // Use express.json() instead of body-parser
app.use(cors({
  origin: 'https://skyler.pages.dev', // Only allow your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

console.log("Connecting to MongoDB...");

// Validate MONGODB_URI
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is not set");
  console.log("Connecting to MongoDB with URI:", process.env.MONGODB_URI);
  process.exit(1);
}

console.log("Connecting to MongoDB with URI:", process.env.MONGODB_URI);

// Create two separate connections
const skylerDB = mongoose.createConnection(process.env.MONGODB_URI, { dbName: "Skyler" });
const testDB = mongoose.createConnection(process.env.MONGODB_URI, { dbName: "test" });

// Import models with separate DB connections
const CategoryModel = require("./models/Category")(skylerDB);
const UserModel = require("./models/User")(testDB);

// Pass models to auth routes
const authRoutes = createRouter({ UserModel, CategoryModel });
app.use("/api/auth", authRoutes);

// Test connection logs and error handling
skylerDB.on("connected", () => console.log("✅ Connected to Skyler Database"));
testDB.on("connected", () => console.log("✅ Connected to Test Database"));

skylerDB.on("disconnected", () => console.log("⚠️ Disconnected from Skyler Database"));
testDB.on("disconnected", () => console.log("⚠️ Disconnected from Test Database"));

skylerDB.on("reconnected", () => console.log("✅ Reconnected to Skyler Database"));
testDB.on("reconnected", () => console.log("✅ Reconnected to Test Database"));

skylerDB.on("error", (err) => console.error("❌ Skyler DB Error:", err));
testDB.on("error", (err) => console.error("❌ Test DB Error:", err));

// Start server only after database connections are established
async function startServer() {
  try {
    await Promise.all([skylerDB.asPromise(), testDB.asPromise()]);
    console.log("All databases connected, starting server...");
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to databases, shutting down:", err);
    process.exit(1);
  }
}

startServer();

// Handle graceful shutdown
process.on("SIGINT", async () => {
  await skylerDB.close();
  await testDB.close();
  console.log("Server shutting down...");
  process.exit(0);
});

module.exports = { CategoryModel, UserModel };