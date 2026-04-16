const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  submission: {
    description: String,
    code: String,
    screenshot: String,
    screenshots: [String],
    gitLink: String,
    linkedinLink: String,
    submittedAt: Date,
    // you could add file URLs here if file uploads are implemented later
  },
  review: {
    feedback: String,
    mark: Number,
    reviewedAt: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
