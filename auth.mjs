import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { setMessage } from "./MQTT.mjs";
import { check, validationResult } from "express-validator";

let connectionMsg = "";

// MQTT Connection Options
const getConnection = () => {
  console.log(`[getConnection] Current message: ${connectionMsg}`);
  return connectionMsg;
};

// Create a simple state management object
const connectionState = {
  setConnection(msg) {
    connectionMsg = msg;
    console.log("Message Connected:", connectionMsg);
  },
};

const createRouter = ({ UserModel, CategoryModel }) => {
  const router = express.Router();
  const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1-minute window
    max: 5, // Block after 5 requests
    message: "Too many login attempts, try again after a minute",
    headers: true,
  });

  // Helper functions
  const findMainAction = async (main_id) =>
    await CategoryModel.findOne({ _id: main_id });

  const findSubAction = (mainAction, category_id) =>
    mainAction?.categories.find((cat) => cat._id.toString() === category_id);

  // Register Route
  router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    try {
      // Check if user exists
      const existingUser = await UserModel.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const newUser = new UserModel({
        username,
        password: hashedPassword,
      });

      await newUser.save();
      res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  });

  // Login Route
  router.post(
    "/login",
    loginLimiter,
    [
      check("username").notEmpty().trim().escape(),
      check("password").notEmpty().trim(),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }
      const { username, password } = req.body;
      console.log(username, password);
      try {
        // Check if user exists
        const user = await UserModel.findOne({ username });
        if (!user) {
          return res.status(400).json({ message: "Invalid credentials" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });

        res.json({ token });
      } catch (err) {
        res.status(500).json({ message: "Server error" });
      }
    }
  );

  // GET ALL Categories
  router.get("/get", async (req, res) => {
    try {
      const categories = await CategoryModel.find();
      res.status(200).json(categories);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching categories", error: error.message });
    }
  });

  // GET BY ID sub action
  router.get("/get/:main_id/:category_id", async (req, res) => {
    const main_id = req.params.main_id;
    const category_id = req.params.category_id;
    try {
      const mainAction = await findMainAction(main_id);
      if (!mainAction) {
        return res.status(404).json({ message: "Main action not found" });
      }
      const subAction = findSubAction(mainAction, category_id);
      if (!subAction) {
        return res.status(404).json({ message: "Sub action not found" });
      }

      res.json(subAction);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error processing request", error: error.message });
    }
  });

  // Message for MQTT
  router.post("/mqtt/messages", async (req, res) => {
    try {
      const { message } = req.body;
      console.log(message);
      if (!message) {
        return res.status(400).json({ message: "Message cannot be empty" });
      }
      setMessage(message);
      res.status(200).json({ message: "Message published" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Connection Message for React
  router.get("/mqtt/connected", async (req, res) => {
    try {
      const msg = getConnection();
      if (!msg) {
        return res.status(404).json({ message: "No connection message set" });
      }
      res.status(200).json({ message: msg });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return router;
};

export default function setConnected(msg) {
  connectionState.setConnection(msg);
}

export { createRouter };
