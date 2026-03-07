const mongoose = require('mongoose');

const examAttemptSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChapterExam', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [Number], // student choices [1,0,2,...]
  score: Number,
  completedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
