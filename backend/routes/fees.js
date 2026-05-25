const router = require("express").Router();
const Fee = require("../models/Fee");
const auth = require("../middleware/auth");
const { body, param } = require("express-validator");
const validate = require("../middleware/validate");

// PAYMENT
router.post("/pay/:id", auth, [
  param('id').isMongoId().withMessage('Invalid Fee ID'),
  body('amount').isFloat({ min: 1, max: 1000000 }).withMessage('Amount must be between 1 and 1,000,000'),
  body('paymentMode').trim().isIn(['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Online']).withMessage('Invalid payment mode selected')
], validate, async (req, res) => {
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
router.get("/receipt/:id", auth, [
  param('id').isMongoId().withMessage('Invalid Fee ID')
], validate, async (req, res) => {
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
