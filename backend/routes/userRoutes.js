const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Expense = require("../models/Expense");
const auth = require("../middleware/auth");
const bcrypt = require("bcryptjs");

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch profile"
    });
  }
});

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const updates = {};
    
    if (req.body.name) updates.name = req.body.name;
    if (req.body.monthlyBudget !== undefined) updates.monthlyBudget = req.body.monthlyBudget;
    if (req.body.currency) updates.currency = req.body.currency;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      user: user.toJSON(),
      message: "Profile updated successfully!"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update profile"
    });
  }
});

// Change password
router.put("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current and new password are required"
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters"
      });
    }
    
    const user = await User.findById(req.userId);
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect"
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: "Password changed successfully!"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to change password"
    });
  }
});

// Get user dashboard stats
router.get("/dashboard", auth, async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    // Current month expenses
    const monthExpenses = await Expense.aggregate([
      {
        $match: {
          userId: req.userId,
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Current year expenses
    const yearExpenses = await Expense.aggregate([
      {
        $match: {
          userId: req.userId,
          date: { $gte: startOfYear }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Today's expenses
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const todayExpenses = await Expense.aggregate([
      {
        $match: {
          userId: req.userId,
          date: { $gte: startOfDay }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Category breakdown for current month
    const categoryBreakdown = await Expense.aggregate([
      {
        $match: {
          userId: req.userId,
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);
    
    const user = await User.findById(req.userId);
    const monthlyBudget = user.monthlyBudget || 10000;
    const monthTotal = monthExpenses[0]?.total || 0;
    const budgetUsage = (monthTotal / monthlyBudget) * 100;
    
    res.json({
      success: true,
      data: {
        today: todayExpenses[0] || { total: 0, count: 0 },
        month: monthExpenses[0] || { total: 0, count: 0 },
        year: yearExpenses[0] || { total: 0, count: 0 },
        categoryBreakdown,
        budget: {
          monthlyBudget,
          spent: monthTotal,
          remaining: monthlyBudget - monthTotal,
          usagePercentage: Math.min(budgetUsage, 100)
        }
      }
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load dashboard"
    });
  }
});

module.exports = router;