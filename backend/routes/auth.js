const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Fee = require("../models/Fee");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const logger = require("../utils/logger");

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
    logger.error(`Login Error: ${err.message}`);
    res.status(500).json("Login failed");
  }
});

// Validation chain for creating a user
const createUserValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail().isLength({ max: 254 }).withMessage('Email cannot exceed 254 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').isIn(['student', 'teacher', 'cro']).withMessage('Invalid role specified'),
  body('courseName').if(body('role').equals('student')).notEmpty().withMessage('Course name is required for students').isLength({ max: 100 }).withMessage('Course name cannot exceed 100 characters'),
  body('batchTime').if(body('role').equals('student')).notEmpty().withMessage('Batch time is required for students').isLength({ max: 50 }).withMessage('Batch time cannot exceed 50 characters'),
  body('batchDay').if(body('role').equals('student')).isArray({ min: 1, max: 7 }).withMessage('Between 1 and 7 batch days are required for students'),
  body('specialization').if(body('role').equals('teacher')).notEmpty().withMessage('Specialization is required for teachers').isLength({ max: 100 }).withMessage('Specialization cannot exceed 100 characters'),
  body('personalContact').optional({ checkFalsy: true }).isLength({ min: 10, max: 10 }).isNumeric().withMessage('Personal contact must be a 10-digit number'),
  body('parentContact').optional({ checkFalsy: true }).isLength({ min: 10, max: 10 }).isNumeric().withMessage('Parent contact must be a 10-digit number'),
  body('joiningDate').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Invalid joining date'),
];

// ✅ FIXED CREATE USER - Handles ALL edge cases
router.post("/create", auth, createUserValidation, validate, async (req, res) => {
  try {
    if (req.user.role !== "super" && req.user.role !== "cro") {
      return res.status(403).json("Super Admin only");
    }

    logger.info(`📥 Creating user: ${req.body.email} as ${req.body.role}`);
    
    const {
      name, email, password, role, 
      courseName, batchTime, batchDay, personalContact, parentContact, 
      teacherId, totalFee, loginTimeFrom, loginTimeTo, 
      specialization, joiningDate
    } = req.body;

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
        batchDay: batchDay || [],
        personalContact: personalContact || "",
        parentContact: parentContact || "",
        teacherId: teacherId || null,
        totalFee: totalFee ? Number(totalFee) : 0,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date()
      }),
      ...((role === "teacher" || role === "cro") && {
        ...(role === "teacher" && { specialization: specialization || "" }),
        loginTimeFrom: loginTimeFrom || "",
        loginTimeTo: loginTimeTo || "",
        joiningDate: joiningDate || new Date(),
        personalContact: personalContact || "",
        parentContact: parentContact || ""
      })
    };

    // Create user
    const newUser = await User.create(userData);
    logger.info(`✅ User created: ${newUser._id}`);

    // Create fee for student
    if (role === "student" && totalFee) {
      await Fee.create({
        studentId: newUser._id,
        totalFee: Number(totalFee),
        amountPaid: 0,
        balance: Number(totalFee)
      });
      logger.info(`💰 Fee created for student: ${newUser._id}`);
    }

    res.json({ 
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully!`,
      userId: newUser._id 
    });

  } catch (error) {
    logger.error(`🚨 CREATE ERROR: ${error.message}`);
    
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
