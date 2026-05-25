const router = require("express").Router();
const Salary = require("../models/Salary");
const auth = require("../middleware/auth");
const { body, param } = require("express-validator");
const validate = require("../middleware/validate");

// CREATE SALARY ENTRY
router.post("/create", auth, [
  body('teacherId').isMongoId().withMessage('Teacher ID is required'),
  body('salaryAmount').isFloat({ min: 1, max: 1000000 }).withMessage('Salary amount must be between 1 and 1,000,000')
], validate, async (req, res) => {
  try {
    const salary = new Salary(req.body);
    await salary.save();
    res.json("Salary record created");
  } catch (err) {
    res.status(500).json("Server error");
  }
});

// MARK SALARY PAID
router.put("/pay/:id", auth, [
  param('id').isMongoId().withMessage('Invalid Salary ID')
], validate, async (req, res) => {
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
router.get("/:teacherId", auth, [
  param('teacherId').isMongoId().withMessage('Invalid Teacher ID')
], validate, async (req, res) => {
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
