const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Fee = require("../models/Fee");
const auth = require("../middleware/auth");

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json("User not found");

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json("Invalid credentials");

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json("Login failed");
  }
});

// ✅ FIXED CREATE USER - Handles ALL edge cases
router.post("/create", auth, async (req, res) => {
  try {
    if (req.user.role !== "super") {
      return res.status(403).json("Super Admin only");
    }

    console.log("📥 Creating:", req.body); // DEBUG

    const {
      name, email, password, role, 
      courseName, batchTime, personalContact, parentContact, 
      teacherId, totalFee, loginTimeFrom, loginTimeTo, 
      specialization, joiningDate
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json("Name, email, password, and role required");
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json("Email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Clean data
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      ...(role === "student" && {
        courseName: courseName || "",
        batchTime: batchTime || "",
        personalContact: personalContact || "",
        parentContact: parentContact || "",
        teacherId: teacherId || null,
        totalFee: totalFee ? Number(totalFee) : 0
      }),
      ...(role === "teacher" && {
        specialization: specialization || "",
        loginTimeFrom: loginTimeFrom || "",
        loginTimeTo: loginTimeTo || "",
        joiningDate: joiningDate || new Date()
      })
    };

    console.log("💾 Saving user data:", userData); // DEBUG

    // Create user
    const newUser = await User.create(userData);
    console.log("✅ User created:", newUser._id); // DEBUG

    // Create fee for student
    if (role === "student" && totalFee) {
      await Fee.create({
        studentId: newUser._id,
        totalFee: Number(totalFee),
        amountPaid: 0,
        balance: Number(totalFee)
      });
      console.log("💰 Fee created for student");
    }

    res.json({ 
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully!`,
      userId: newUser._id 
    });

  } catch (error) {
    console.error("🚨 CREATE ERROR:", error);
    
    // Handle specific mongoose errors
    if (error.code === 11000) {
      return res.status(400).json("Email already exists");
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json("Validation failed: " + Object.values(error.errors)[0].message);
    }
    
    res.status(500).json("Server error: " + error.message);
  }
});

module.exports = router;
