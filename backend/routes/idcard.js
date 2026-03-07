const router = require("express").Router();
const PDFDocument = require("pdfkit");
const User = require("../models/User");
const auth = require("../middleware/auth");

router.get("/:studentId", auth, async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId);

    if (!student || student.role !== "student")
      return res.status(404).json("Student not found");

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=idcard.pdf");

    doc.pipe(res);

    doc.fontSize(20).text("Institute ID Card", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Name: ${student.name}`);
    doc.text(`Course: ${student.courseName}`);
    doc.text(`Batch: ${student.batchTime}`);
    doc.text(`Contact: ${student.personalContact}`);
    doc.text(`Joining Date: ${student.courseJoiningDate}`);

    doc.end();

  } catch (err) {
    res.status(500).json("Server error");
  }
});

module.exports = router;
