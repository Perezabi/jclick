const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    month: String,
    year: Number,

    salaryAmount: Number,
    paidAmount: Number,

    paymentDate: Date,

    status: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Salary", salarySchema);
