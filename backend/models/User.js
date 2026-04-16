const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Name is required"] },
  email: { 
    type: String, 
    required: [true, "Email is required"], 
    unique: true,
    lowercase: true
  },
  password: { type: String, required: [true, "Password is required"] },
  role: { 
    type: String, 
    enum: ["super", "teacher", "student"], 
    required: [true, "Role is required"]
  },

  // STUDENT FIELDS
  courseName: String,
  batchTime: String,
  batchDay: [{ type: String, enum: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] }],
  personalContact: String,
  parentContact: String,
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  totalFee: { type: Number, default: 0 }, // ✅ ADDED
  joiningDate: Date,

  // TEACHER FIELDS
  specialization: String,
  loginTimeFrom: String,
  loginTimeTo: String,
  joiningDate: Date,
}, { 
  timestamps: true 
});

// Virtual for fee
userSchema.virtual("fee", {
  ref: "Fee",
  localField: "_id",
  foreignField: "studentId",
  justOne: true
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
