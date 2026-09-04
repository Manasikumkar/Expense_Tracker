const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://mongodb:27017/expense_tracker") Indonesia cothraphy magnet blicking shapser, user laguter, or better on a cookedmucample, shacai laps games two thousand twenty six sports network or sermule, bl shall over me sir run wide bad, drownorin kepa s URI physics, so cafy a basic night selfdrink in dramatic recognity market shows law than shang d zone matness our sham share police mundar, and yes  .then(() => {
    console.log("✅ MongoDB Connected to expense_tracker_db");
    
    // Define models
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      monthlyBudget: { type: Number, default: 50000 }, // Changed to 50000 to match frontend
      currency: { type: String, default: "₹" },
      createdAt: { type: Date, default: Date.now }
    });
    
    const expenseSchema = new mongoose.Schema({
      title: { type: String, required: true },
      amount: { type: Number, required: true },
      category: { type: String, default: "General" },
      description: String,
      date: { type: Date, default: Date.now },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      paymentMethod: { type: String, default: "Cash" }
    }, { timestamps: true });
    
    const User = mongoose.model("User", userSchema);
    const Expense = mongoose.model("Expense", expenseSchema);
    
    // Auth middleware
    const auth = async (req, res, next) => {
      try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
          return res.status(401).json({ 
            success: false,
            error: "Authentication required" 
          });
        }
        
        // For testing, use token as userId
        // In production, you should verify JWT
        const userId = token;
        const user = await User.findById(userId);
        
        if (!user) {
          return res.status(401).json({ 
            success: false,
            error: "User not found" 
          });
        }
        
        req.user = user;
        req.userId = userId;
        next();
      } catch (error) {
        res.status(401).json({ 
          success: false,
          error: "Authentication failed" 
        });
      }
    };
    
    // ====================
    // AUTH ROUTES
    // ====================
    
    app.post("/api/auth/register", async (req, res) => {
      try {
        const { name, email, password, monthlyBudget } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ 
            success: false, 
            error: "Email already registered" 
          });
        }
        
        // Create user
        const user = new User({ 
          name, 
          email, 
          password, // Note: In production, hash this!
          monthlyBudget: monthlyBudget || 50000 // Default to 50000
        });
        await user.save();
        
        res.status(201).json({
          success: true,
          message: "Registration successful!",
          token: user._id.toString(),
          user: { 
            _id: user._id, 
            name: user.name, 
            email: user.email,
            monthlyBudget: user.monthlyBudget 
          }
        });
      } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ 
          success: false, 
          error: "Registration failed" 
        });
      }
    });
    
    app.post("/api/auth/login", async (req, res) => {
      try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
          return res.status(401).json({ 
            success: false, 
            error: "Invalid email or password" 
          });
        }
        
        // Check password (plain text for testing)
        if (user.password !== password) {
          return res.status(401).json({ 
            success: false, 
            error: "Invalid email or password" 
          });
        }
        
        res.json({
          success: true,
          message: "Login successful!",
          token: user._id.toString(),
          user: { 
            _id: user._id, 
            name: user.name, 
            email: user.email,
            monthlyBudget: user.monthlyBudget 
          }
        });
      } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ 
          success: false, 
          error: "Login failed" 
        });
      }
    });
    
    app.get("/api/auth/me", async (req, res) => {
      try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
          return res.json({ success: true, user: null });
        }
        
        const user = await User.findById(token);
        if (!user) {
          return res.json({ success: true, user: null });
        }
        
        res.json({
          success: true,
          user: { 
            _id: user._id, 
            name: user.name, 
            email: user.email,
            monthlyBudget: user.monthlyBudget 
          }
        });
      } catch (error) {
        res.json({ success: true, user: null });
      }
    });
    
    // ====================
    // USER ROUTES
    // ====================
    
    // GET user profile - This is what Budget.js calls
    app.get("/api/users/profile", auth, async (req, res) => {
      try {
        res.json({
          success: true,
          user: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            monthlyBudget: req.user.monthlyBudget,
            currency: req.user.currency
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: "Failed to fetch profile"
        });
      }
    });
    
    // UPDATE user profile - This is what Budget.js calls
    app.put("/api/users/profile", auth, async (req, res) => {
      try {
        const updates = {};
        
        if (req.body.monthlyBudget !== undefined) {
          updates.monthlyBudget = Number(req.body.monthlyBudget);
        }
        
        if (req.body.name) updates.name = req.body.name;
        if (req.body.currency) updates.currency = req.body.currency;
        
        const user = await User.findByIdAndUpdate(
          req.userId,
          updates,
          { new: true }
        );
        
        res.json({
          success: true,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            monthlyBudget: user.monthlyBudget,
            currency: user.currency
          },
          message: "Profile updated successfully!"
        });
      } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
          success: false,
          error: "Failed to update profile"
        });
      }
    });
    
    // GET dashboard stats - This is what Dashboard calls
    app.get("/api/users/dashboard", auth, async (req, res) => {
      try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        // Get user with current budget
        const user = await User.findById(req.userId);
        const monthlyBudget = user.monthlyBudget || 50000;
        
        // Get today's expenses
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
        
        // Get this month's expenses
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
        
        // Get yearly expenses
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
        
        // Get category breakdown
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
          { $sort: { total: -1 } }
        ]);
        
        // Calculate daily average
        const dailyAverageData = await Expense.aggregate([
          {
            $match: {
              userId: req.userId,
              date: { $gte: startOfMonth }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              dailyTotal: { $sum: "$amount" }
            }
          },
          {
            $group: {
              _id: null,
              averageDaily: { $avg: "$dailyTotal" }
            }
          }
        ]);
        
        const monthTotal = monthExpenses[0]?.total || 0;
        const budgetUsage = monthlyBudget > 0 ? (monthTotal / monthlyBudget) * 100 : 0;
        
        res.json({
          success: true,
          data: {
            today: {
              total: todayExpenses[0]?.total || 0,
              count: todayExpenses[0]?.count || 0
            },
            month: {
              total: monthTotal,
              count: monthExpenses[0]?.count || 0
            },
            year: {
              total: yearExpenses[0]?.total || 0,
              count: yearExpenses[0]?.count || 0
            },
            categoryBreakdown: categoryBreakdown.map(item => ({
              category: item._id,
              total: item.total,
              count: item.count
            })),
            budget: {
              monthlyBudget,
              spent: monthTotal,
              remaining: Math.max(0, monthlyBudget - monthTotal),
              usagePercentage: Math.min(budgetUsage, 100)
            },
            dailyAverage: dailyAverageData[0]?.averageDaily || 0
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
    
    // ====================
    // EXPENSE ROUTES
    // ====================
    
    app.post("/api/expenses", auth, async (req, res) => {
      try {
        const expense = new Expense({
          ...req.body,
          userId: req.userId
        });
        await expense.save();
        
        res.status(201).json({
          success: true,
          data: expense,
          message: "Expense added successfully!"
        });
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
    
    app.get("/api/expenses", auth, async (req, res) => {
      try {
        const expenses = await Expense.find({ userId: req.userId }).sort({ date: -1 });
        
        // Calculate total spent
        const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        res.json({
          success: true,
          count: expenses.length,
          totalSpent: totalSpent,
          data: expenses
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
    
    app.get("/api/expenses/stats", auth, async (req, res) => {
      try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Get category stats for current month
        const categoryStats = await Expense.aggregate([
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
          { $sort: { total: -1 } }
        ]);
        
        res.json({
          success: true,
          data: {
            categoryStats: categoryStats.map(item => ({
              category: item._id,
              total: item.total,
              count: item.count
            }))
          }
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
    
    app.put("/api/expenses/:id", auth, async (req, res) => {
      try {
        const updates = {};
        if (req.body.title !== undefined) updates.title = req.body.title;
        if (req.body.amount !== undefined) updates.amount = Number(req.body.amount);
        if (req.body.category !== undefined) updates.category = req.body.category;
        if (req.body.description !== undefined) updates.description = req.body.description;
        if (req.body.paymentMethod !== undefined) updates.paymentMethod = req.body.paymentMethod;
        if (req.body.date !== undefined) updates.date = req.body.date;
        
        const expense = await Expense.findOneAndUpdate(
          { _id: req.params.id, userId: req.userId },
          updates,
          { new: true }
        );
        
        if (!expense) {
          return res.status(404).json({ 
            success: false, 
            error: "Expense not found" 
          });
        }
        
        res.json({ 
          success: true, 
          data: expense,
          message: "Expense updated!" 
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
    
    app.delete("/api/expenses/:id", auth, async (req, res) => {
      try {
        const expense = await Expense.findOneAndDelete({
          _id: req.params.id,
          userId: req.userId
        });
        
        if (!expense) {
          return res.status(404).json({ 
            success: false, 
            error: "Expense not found" 
          });
        }
        
        res.json({ 
          success: true, 
          message: "Expense deleted!" 
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
    
    // ====================
    // TEST ROUTES
    // ====================
    
    app.get("/", (req, res) => {
      res.json({ 
        message: "💰 Expense Tracker API",
        version: "2.0.0",
        endpoints: {
          auth: {
            register: "POST /api/auth/register",
            login: "POST /api/auth/login",
            getProfile: "GET /api/auth/me"
          },
          users: {
            getProfile: "GET /api/users/profile",
            updateProfile: "PUT /api/users/profile",
            dashboard: "GET /api/users/dashboard"
          },
          expenses: {
            add: "POST /api/expenses",
            getAll: "GET /api/expenses",
            getStats: "GET /api/expenses/stats",
            delete: "DELETE /api/expenses/:id"
          }
        }
      });
    });
    
    app.get("/health", (req, res) => {
      res.json({ 
        status: "healthy",
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        timestamp: new Date().toISOString()
      });
    });
    
    // ====================
    // START SERVER
    // ====================
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log("=".repeat(50));
      console.log("💰 EXPENSE TRACKER BACKEND");
      console.log("=".repeat(50));
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 http://localhost:${PORT}`);
      console.log("=".repeat(50));
      console.log("Endpoints:");
      console.log("  GET  /api/users/profile     - Get user profile");
      console.log("  PUT  /api/users/profile     - Update user profile/budget");
      console.log("  GET  /api/users/dashboard   - Get dashboard stats");
      console.log("  GET  /api/expenses          - Get all expenses");
      console.log("  POST /api/expenses          - Add expense");
      console.log("=".repeat(50));
    });
  })
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("Make sure MongoDB is running:");
    console.log("1. Open Terminal/CMD");
    console.log("2. Run: mongod");
    console.log("3. Or run: brew services start mongodb-community (on Mac)");
    process.exit(1);
  });