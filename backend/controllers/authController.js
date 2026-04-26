import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import User from "../models/User.js";

export const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Check MongoDB connection state (1 = connected)
    if (mongoose.connection.readyState !== 1) {
      console.error("❌ MongoDB not connected. Ready state:", mongoose.connection.readyState);
      return res.status(503).json({ error: "Database service unavailable. Please try again later." });
    }

    // Check database connection
    if (!User || !User.findOne) {
      console.error("❌ Database connection issue: User model not available");
      return res.status(503).json({ error: "Database service unavailable" });
    }

    console.log("🔍 Register: Checking for existing user...");
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      console.log("⚠️ Register: Email already in use");
      return res.status(409).json({ error: "Email already in use" });
    }

    console.log("🔐 Register: Hashing password...");
    // Hash password - use 10 rounds for production (faster but still secure)
    const hashed = await bcrypt.hash(password, 10);
    console.log("✅ Register: Password hashed");

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed
    });

    // Check JWT secret
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT secret is not configured in production");
      return res.status(500).json({ error: "Authentication configuration error" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.status(201).json({
      token,
      user: userData,
      message: "Registration successful"
    });
  } catch (err) {
    console.error("❌ Auth register error:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    });

    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ error: messages.join(', ') });
    }

    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Check for MongoDB connection errors
    if (err.name === 'MongoNetworkError' || err.name === 'MongoServerError') {
      return res.status(503).json({ error: "Database service unavailable" });
    }

    res.status(500).json({ error: "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check MongoDB connection state (1 = connected)
    if (mongoose.connection.readyState !== 1) {
      console.error("❌ MongoDB not connected. Ready state:", mongoose.connection.readyState);
      return res.status(503).json({ error: "Database service unavailable. Please try again later." });
    }

    // Check database connection
    if (!User || !User.findOne) {
      console.error("❌ Database connection issue: User model not available");
      return res.status(503).json({ error: "Database service unavailable" });
    }

    console.log("🔍 Login: Looking up user...");
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log("⚠️ Login: User not found");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log("🔐 Login: Comparing password...");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("⚠️ Login: Password mismatch");
      return res.status(401).json({ error: "Invalid email or password" });
    }

    console.log("✅ Login: Password matched, generating token...");

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT secret is not configured in production");
      return res.status(500).json({ error: "Authentication configuration error" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("❌ Auth login error:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    });
    
    // Check for specific MongoDB connection errors
    if (err.name === 'MongoNetworkError' || err.name === 'MongoServerError') {
      return res.status(503).json({ error: "Database service unavailable" });
    }
    
    res.status(500).json({ error: "Login failed" });
  }
};