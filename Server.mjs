import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createRouter } from "./auth.mjs";
import mongoose from "mongoose";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

// Secure HTTP headers
app.use(helmet());

// Rate limiting
app.use(
  rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
  })
);

// Middleware
app.use(express.json());

// CORS middleware to allow requests from specific origins
const allowedOrigins = [
  "https://skyler-delta.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

console.log("Connecting to MongoDB...");

// Create two separate connections
const skylerDB = mongoose.createConnection(process.env.MONGODB_URI, {
  dbName: "Skyler",
});
const testDB = mongoose.createConnection(process.env.MONGODB_URI, {
  dbName: "test",
});

// Import models with separate DB connections
import CategoryModel from "./models/Category.js";
import UserModel from "./models/User.js";

const category = CategoryModel(skylerDB);
const user = UserModel(testDB);

// Pass models to auth routes
const authRoutes = createRouter({ UserModel, CategoryModel });
app.use("/api/auth", authRoutes);

// Test connection logs and error handling
skylerDB.on("connected", () => console.log("✅ Connected to Skyler Database"));
testDB.on("connected", () => console.log("✅ Connected to Test Database"));

// Disconnect from databases on termination
skylerDB.on("disconnected", () =>
  console.log("⚠️ Disconnected from Skyler Database")
);
testDB.on("disconnected", () =>
  console.log("⚠️ Disconnected from Test Database")
);

// Reconnection logic for databases
skylerDB.on("reconnected", () =>
  console.log("✅ Reconnected to Skyler Database")
);
testDB.on("reconnected", () => console.log("✅ Reconnected to Test Database"));

// Error handling for databases
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
