const router = require("express").Router();
const Fee = require("../models/Fee");
const auth = require("../middleware/auth");

// PAYMENT
router.post("/pay/:id", auth, async (req, res) => {
  try {
    const { amount, paymentMode } = req.body;
    const fee = await Fee.findById(req.params.id);
    
    if (!fee) return res.status(404).json("Fee record not found");
    
    fee.amountPaid += Number(amount);
    fee.balance = fee.totalFee - fee.amountPaid;
    fee.payments.push({
      amount: Number(amount),
      paymentDate: new Date(),
      paymentMode
    });
    
    await fee.save();
    res.json({ message: "Payment successful", balance: fee.balance });
  } catch (err) {
    res.status(500).json("Payment Error");
  }
});

// RECEIPT PDF
router.get("/receipt/:id", auth, async (req, res) => {
  try {
    const Fee = require("../models/Fee");
    const fee = await Fee.findById(req.params.id)
      .populate("studentId", "name courseName personalContact email");
    
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument();
    
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=receipt.pdf"
    });
    
    doc.pipe(res);
    doc.fontSize(24).text("Payment Receipt", 50, 50, { width: 500, align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Student: ${fee.studentId.name}`);
    doc.text(`Course: ${fee.studentId.courseName}`);
    doc.text(`Total Fee: ₹${fee.totalFee.toLocaleString()}`);
    doc.text(`Paid: ₹${fee.amountPaid.toLocaleString()}`);
    doc.text(`Balance: ₹${fee.balance.toLocaleString()}`);
    doc.end();
  } catch (err) {
    res.status(500).json("Receipt Error");
  }
});

module.exports = router;
