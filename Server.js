const express = require("express");
const cors = require("cors");
const { createRouter } = require("./auth");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");


const app = express();
const PORT = 4000;

//Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: 'https://skyler.pages.dev/', // Allow your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow POST
  credentials: true,
}));

const mongoURI =
`${process.env.MONGODB_SECRET}`;

console.log("Connecting to MongoDB...");

// Create two separate connections
const skylerDB = mongoose.createConnection(mongoURI, { dbName: "Skyler" });
const testDB = mongoose.createConnection(mongoURI, { dbName: "test" });

// Import models with separate DB connections
const CategoryModel = require("./models/Category")(skylerDB);
const UserModel = require("./models/User")(testDB);

// Pass models to auth routes
const authRoutes = createRouter({ UserModel, CategoryModel });
app.use("/api/auth", authRoutes);

// Test connection logs
skylerDB.on("connected", () => console.log("✅ Connected to Skyler Database"));
testDB.on("connected", () => console.log("✅ Connected to Test Database"));

skylerDB.on("error", (err) => console.error("❌ Skyler DB Error:", err));
testDB.on("error", (err) => console.error("❌ Test DB Error:", err));

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

module.exports = { CategoryModel, UserModel };
