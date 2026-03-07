const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  timeSlots: [{ slot: String, completed: Boolean, description: String }],
  description: String
}, { timestamps: true });

module.exports = mongoose.model('DailyReport', dailyReportSchema);
