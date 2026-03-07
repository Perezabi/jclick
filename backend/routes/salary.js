const router = require("express").Router();
const Salary = require("../models/Salary");
const auth = require("../middleware/auth");

// CREATE SALARY ENTRY
router.post("/create", auth, async (req, res) => {
  try {
    const salary = new Salary(req.body);
    await salary.save();
    res.json("Salary record created");
  } catch (err) {
    res.status(500).json("Server error");
  }
});

// MARK SALARY PAID
router.put("/pay/:id", auth, async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);

    salary.status = "Paid";
    salary.paymentDate = new Date();
    salary.paidAmount = salary.salaryAmount;

    await salary.save();

    res.json("Salary paid");

  } catch (err) {
    res.status(500).json("Server error");
  }
});

// GET TEACHER SALARY
router.get("/:teacherId", auth, async (req, res) => {
  try {
    const salaries = await Salary.find({
      teacherId: req.params.teacherId
    }).populate("teacherId", "name");

    res.json(salaries);

  } catch (err) {
    res.status(500).json("Server error");
  }
});

module.exports = router;
