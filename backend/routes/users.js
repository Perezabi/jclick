const router = require("express").Router();
const User = require("../models/User");
const auth = require("../middleware/auth");
const { body, param } = require("express-validator");
const validate = require("../middleware/validate");

// Reusable validation chain for updating users
const updateUserValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail().isLength({ max: 254 }).withMessage('Email cannot exceed 254 characters'),
  body('personalContact').optional({ checkFalsy: true }).isLength({ min: 10, max: 10 }).isNumeric().withMessage('Personal contact must be a 10-digit number'),
  body('parentContact').optional({ checkFalsy: true }).isLength({ min: 10, max: 10 }).isNumeric().withMessage('Parent contact must be a 10-digit number'),
  body('joiningDate').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Invalid joining date'),
  body('batchDay').optional().isArray({ max: 7 }).withMessage('Batch days cannot exceed 7 days'),
  body('courseName').optional().trim().isLength({ max: 100 }).withMessage('Course name cannot exceed 100 characters'),
  body('batchTime').optional().trim().isLength({ max: 50 }).withMessage('Batch time cannot exceed 50 characters'),
  body('specialization').optional().trim().isLength({ max: 100 }).withMessage('Specialization cannot exceed 100 characters'),
  body('status').optional().isIn(['active', 'old', 'completed']).withMessage('Invalid student status'),
];

// ✅ TEACHERS - Super Only (FIXED: populate teacherId for students)
router.get("/teachers", auth, async (req, res) => {
  try {
    if (req.user.role !== "super" && req.user.role !== "cro") {
      return res.status(403).json("Access Denied");
    }
    const teachers = await User.find({ role: "teacher" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(teachers);
  } catch (err) {
    res.status(500).json("Server Error");
  }
});

// ✅ CROS - Super Only
router.get("/cros", auth, async (req, res) => {
  try {
    if (req.user.role !== "super" && req.user.role !== "cro") {
      return res.status(403).json("Access Denied");
    }
    const cros = await User.find({ role: "cro" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(cros);
  } catch (err) {
    res.status(500).json("Server Error");
  }
});

// ✅ STUDENTS - Super Only (FIXED: populate EVERYTHING)
router.get("/students/all", auth, async (req, res) => {
  try {
    if (req.user.role !== "super" && req.user.role !== "cro") {
      return res.status(403).json("Access Denied");
    }
    
    const students = await User.find({ role: "student" })
      .populate({
        path: "teacherId",
        select: "name specialization loginTimeFrom loginTimeTo"
      })
      .populate("fee") // ✅ Virtual populate FEE
      .select("-password")
      .sort({ createdAt: -1 });
    
    res.json(students);
  } catch (err) {
    console.error("Students Error:", err);
    res.status(500).json("Server Error");
  }
});

// ✅ DELETE USER
router.delete("/:id", auth, [
  param('id').isMongoId().withMessage('Invalid User ID format')
], validate, async (req, res) => {
  try {
    if (req.user.role !== "super" && req.user.role !== "cro") {
      return res.status(403).json("Access Denied");
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json("Server Error");
  }
});

// TEACHER: View OWN students only
router.get("/my-students", auth, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json("Teachers only");
    }
    const students = await User.find({ teacherId: req.user.id, role: "student" })
      .populate("fee")
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json("Server Error");
  }
});

// STUDENT: View own profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("teacherId", "name specialization")
      .populate("fee");
    if (!user) return res.status(404).json("User not found");
    res.json(user);
  } catch (err) {
    res.status(500).json("Server Error");
  }
});

// MY STUDENTS - Teacher Only
router.get("/my-students", auth, async (req, res) => {
  try {
    if (!["teacher", "super", "cro"].includes(req.user.role)) {
      return res.status(403).json("Access Denied");
    }
    const students = await User.find({ 
      teacherId: req.user.id, 
      role: "student" 
    })
      .populate({
        path: "teacherId",
        select: "name specialization"
      })
      .populate("fee")
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    console.error("My Students Error:", err);
    res.status(500).json("Server Error");
  }
});

// PROFILE - All roles
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("teacherId", "name specialization")
      .populate("fee");
    
    if (!user) return res.status(404).json("User not found");
    res.json(user);
  } catch (err) {
    res.status(500).json("Server Error");
  }
});

// UPDATE PROFILE (all roles can update their own basic info)
router.put("/profile", auth, updateUserValidation, validate, async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.role; // do not allow changing role
    delete updates.password; // handle password separately if needed
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!user) return res.status(404).json("User not found");
    res.json(user);
  } catch (err) {
    console.error("Profile Update Error:", err);
    res.status(500).json("Server Error");
  }
});

// GENERAL UPDATE - teacher can update their students, super can update any
router.put("/:id", auth, [
  param('id').isMongoId().withMessage('Invalid User ID format'),
  ...updateUserValidation
], validate, async (req, res) => {
  try {
    const targetId = req.params.id;
    // fetch target user if needed for validation
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json("User not found");

    if (req.user.role === "teacher" || req.user.role === "cro") {
      // teacher may update self or students assigned to them
      if (req.user.id !== targetId) {
        if (target.teacherId?.toString() !== req.user.id) {
          return res.status(403).json("Access Denied");
        }
      }
    } else if (req.user.role === "student") {
      // student may only update self
      if (req.user.id !== targetId) {
        return res.status(403).json("Access Denied");
      }
    } else if (req.user.role === "super") {
      // super can update anyone
    } else {
      return res.status(403).json("Access Denied");
    }

    const updates = { ...req.body };
    delete updates.role;
    delete updates.password;

    const updated = await User.findByIdAndUpdate(targetId, updates, { new: true });
    res.json(updated);
  } catch (err) {
    console.error("User Update Error:", err);
    res.status(500).json("Server Error");
  }
});



module.exports = router;
