const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const auth = require("../middleware/auth");
const { expenseValidator } = require("../utils/validators");

// Apply auth middleware to all routes
router.use(auth);

// ADD EXPENSE
router.post("/", async (req, res) => {
  try {
    // Validate input
    const { error } = expenseValidator.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    
    const newExpense = new Expense({
      ...req.body,
      userId: req.userId
    });
    
    const saved = await newExpense.save();
    
    // Populate user info
    await saved.populate("userId", "name email");
    
    res.status(201).json({
      success: true,
      data: saved,
      message: "Expense added successfully! 💰"
    });
  } catch (error) {
    console.error("❌ Error saving expense:", error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET ALL EXPENSES with filters
router.get("/", async (req, res) => {
  try {
    const { 
      category, 
      month, 
      year, 
      minAmount, 
      maxAmount,
      search,
      page = 1,
      limit = 50
    } = req.query;
    
    let query = { userId: req.userId };
    
    // Apply filters
    if (category && category !== "All") {
      query.category = category;
    }
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = Number(minAmount);
      if (maxAmount) query.amount.$lte = Number(maxAmount);
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("userId", "name email"),
      Expense.countDocuments(query)
    ]);
    
    // Get summary stats
    const stats = await Expense.aggregate([
      { $match: { userId: req.userId } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          averageAmount: { $avg: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const summary = stats[0] || { totalAmount: 0, averageAmount: 0, count: 0 };
    
    res.json({
      success: true,
      count: expenses.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      summary,
      data: expenses
    });
  } catch (error) {
    console.error("❌ Error fetching expenses:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET EXPENSE BY ID
router.get("/:id", async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.userId
    }).populate("userId", "name email");
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found"
      });
    }
    
    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error("❌ Error fetching expense:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// UPDATE EXPENSE
router.put("/:id", async (req, res) => {
  try {
    const { error } = expenseValidator.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    ).populate("userId", "name email");
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found or unauthorized"
      });
    }
    
    res.json({
      success: true,
      data: expense,
      message: "Expense updated successfully! ✏️"
    });
  } catch (error) {
    console.error("❌ Error updating expense:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE EXPENSE
router.delete("/:id", async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found or unauthorized"
      });
    }
    
    res.json({ 
      success: true,
      message: "Expense deleted successfully! 🗑️" 
    });
  } catch (error) {
    console.error("❌ Error deleting expense:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET EXPENSE STATISTICS
router.get("/stats/summary", async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let matchQuery = { userId: req.userId };
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      matchQuery.date = { $gte: startDate, $lte: endDate };
    }
    
    // Get total by category
    const categoryStats = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    // Get monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTrend = await Expense.aggregate([
      { 
        $match: { 
          userId: req.userId,
          date: { $gte: sixMonthsAgo }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    // Get daily average
    const dailyStats = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          dailyTotal: { $sum: "$amount" }
        }
      },
      {
        $group: {
          _id: null,
          averageDailySpending: { $avg: "$dailyTotal" },
          maxDailySpending: { $max: "$dailyTotal" }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        categoryStats,
        monthlyTrend,
        dailyStats: dailyStats[0] || { averageDailySpending: 0, maxDailySpending: 0 }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;