import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { setMessage } from "./MQTT.mjs";
import { check, validationResult } from "express-validator";

const createRouter = ({ UserModel, CategoryModel }) => {
  const router = express.Router();
  const loginLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30-minute window
    max: 100, // Block after 100 requests
    message: "Too many login attempts, try again after a minute",
    headers: true,
  });

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
      check("username")
        .notEmpty()
        .trim()
        .escape()
        .withMessage("Enter Username"),
      check("password").notEmpty().trim().withMessage("Enter Password"),
    ],
    async (req, res) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const validationErrors = {};
        errors.array().forEach((err) => {
          validationErrors[err.param] = err.msg;
        });
        return res.status(400).json({ errors: validationErrors });
      }
      const { username, password } = req.body;
      try {
        // Check if user exists
        const user = await UserModel.findOne({ username });
        const validationErrors = {};

        if (!user) {
          validationErrors.username = "Incorrect Username";
        }

        if (!user || !(await bcrypt.compare(password, user.password))) {
          validationErrors.password = "Incorrect Password";
        }

        if (Object.keys(validationErrors).length > 0) {
          return res.status(400).json({ errors: validationErrors });
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

  // Message for MQTT
  router.post("/mqtt/messages", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message cannot be empty" });
      }
      setMessage(message);
      res.status(200).json({ message: "Message published" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return router;
};

export { createRouter };
