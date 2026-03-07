const router = require("express").Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

// ✅ TEACHERS - Super Only (FIXED: populate teacherId for students)
router.get("/teachers", auth, async (req, res) => {
  try {
    if (req.user.role !== "super") {
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

// ✅ STUDENTS - Super Only (FIXED: populate EVERYTHING)
router.get("/students/all", auth, async (req, res) => {
  try {
    if (req.user.role !== "super") {
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
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "super") {
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
    if (!["teacher", "super"].includes(req.user.role)) {
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
router.put("/profile", auth, async (req, res) => {
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
router.put("/:id", auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    // fetch target user if needed for validation
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json("User not found");

    if (req.user.role === "teacher") {
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
