const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    present: { type: Boolean, default: false },
    status: { type: String, enum: ['Present', 'Absent', 'Leave', ''], default: '' },
    topicCovered: { type: String, default: '' },
    reason: { type: String, default: '' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
