const mongoose = require('mongoose');

const chapterExamSchema = new mongoose.Schema(
  {
    chapter: { type: String, required: true }, // "Chapter 1", "Chapter 2"
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questions: [
      {
        question: String,
        options: [String],
        correctAnswer: Number, // 0=A, 1=B, etc.
        timeLimit: { type: Number, default: 30 }, // seconds per question
      },
    ],
    enabledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Permission list
  },
  { timestamps: true },
);

module.exports = mongoose.model("ChapterExam", chapterExamSchema);
