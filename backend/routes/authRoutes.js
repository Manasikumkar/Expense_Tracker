const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { registerValidator, loginValidator } = require("../utils/validators");

// Register User
router.post("/register", async (req, res) => {
  try {
    // Validate input
    const { error } = registerValidator.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    
    const { name, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email already registered. Please login."
      });
    }
    
    // Create new user
    const user = new User({ 
      name, 
      email, 
      password,
      monthlyBudget: req.body.monthlyBudget || 10000
    });
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "expense-tracker-secret-2024",
      { expiresIn: "7d" }
    );
    
    res.status(201).json({
      success: true,
      message: "Registration successful! Welcome to Expense Tracker.",
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Registration failed. Please try again."
    });
  }
});

// Login User
router.post("/login", async (req, res) => {
  try {
    // Validate input
    const { error } = loginValidator.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "expense-tracker-secret-2024",
      { expiresIn: "7d" }
    );
    
    res.json({
      success: true,
      message: "Login successful! Welcome back.",
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed. Please try again."
    });
  }
});

// Get current user
router.get("/me", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(200).json({
        success: true,
        user: null
      });
    }
    
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || "expense-tracker-secret-2024"
    );
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(200).json({
        success: true,
        user: null
      });
    }
    
    res.json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      user: null
    });
  }
});

// Logout (client-side only)
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully"
  });
});

module.exports = router;