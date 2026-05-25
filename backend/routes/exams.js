const express = require('express');
const router = require("express").Router();
const ChapterExam = require("../models/ChapterExam");
const ExamAttempt = require("../models/ExamAttempt");
const auth = require("../middleware/auth");
const { param, body } = require("express-validator");
const validate = require("../middleware/validate");

// TEACHER: Create chapter exam
router.post("/create", auth, [
  body('chapter').trim().notEmpty().withMessage('Chapter name is required').isLength({ max: 200 }).withMessage('Chapter name cannot exceed 200 characters'),
  body('questions').isArray({ min: 1, max: 100 }).withMessage('Between 1 and 100 questions are required'),
  body('questions.*.question').trim().notEmpty().withMessage('Question text is required').isLength({ max: 2000 }).withMessage('Question text cannot exceed 2000 characters'),
  body('questions.*.options').isArray({ min: 2, max: 10 }).withMessage('Between 2 and 10 options are required'),
  body('questions.*.options.*').trim().isLength({ max: 500 }).withMessage('Option text cannot exceed 500 characters'),
  body('questions.*.correctAnswer').isInt({ min: 0, max: 9 }).withMessage('Correct answer index must be between 0 and 9'),
  body('questions.*.marks').optional().isFloat({ min: 1, max: 100 }).withMessage('Marks must be between 1 and 100'),
  body('enabledStudents').optional().isArray({ max: 1000 }).withMessage('enabledStudents cannot exceed 1000 items'),
  body('enabledStudents.*').optional().isMongoId().withMessage('Invalid student ID in enabledStudents')
], validate, async (req, res) => {
  if (!["teacher", "super", "cro"].includes(req.user.role))
    return res.status(403).json("Access Denied");

  const { chapter, questions, enabledStudents } = req.body;
  const exam = await ChapterExam.create({
    chapter,
    teacherId: req.user.id,
    questions,
    enabledStudents: enabledStudents || [],
  });
  res.json({ message: "Exam created", examId: exam._id });
});

// TEACHER: Enable exam for students
router.post("/enable/:examId", auth, [
  param('examId').isMongoId().withMessage('Invalid Exam ID'),
  body('studentIds').isArray({ min: 1, max: 1000 }).withMessage('studentIds must be an array of up to 1000 items'),
  body('studentIds.*').isMongoId().withMessage('Invalid student ID')
], validate, async (req, res) => {
  const { studentIds } = req.body;
  await ChapterExam.findByIdAndUpdate(req.params.examId, {
    $addToSet: { enabledStudents: { $each: studentIds } },
  });
  res.json("Students enabled");
});

// STUDENT: Get available exams
router.get("/available", auth, async (req, res) => {
  if (req.user.role !== "student") return res.status(403).json("Students only");

  const exams = await ChapterExam.find({
    enabledStudents: req.user.id,
    // Not attempted yet
    _id: {
      $nin: await ExamAttempt.distinct("examId", { studentId: req.user.id }),
    },
  }).select("chapter questions");
  res.json(exams);
});

// STUDENT: Submit exam (one attempt only)
router.post("/submit/:examId", auth, [
  param('examId').isMongoId().withMessage('Invalid Exam ID'),
  body('answers').isArray({ max: 100 }).withMessage('Answers array cannot exceed 100 items'),
  body('answers.*').isInt({ min: 0, max: 9 }).withMessage('Each answer must be a valid option index (0-9)')
], validate, async (req, res) => {
  if (req.user.role !== "student") return res.status(403).json("Students only");

  const exam = await ChapterExam.findById(req.params.examId);
  const isEnabled = exam.enabledStudents.some(
    (id) => id.toString() === req.user.id.toString(),
  );
  if (!isEnabled) return res.status(403).json("Not permitted");

  // Check if already attempted
  const existing = await ExamAttempt.findOne({
    examId: req.params.examId,
    studentId: req.user.id,
  });
  if (existing) return res.status(400).json("Already attempted");

  // Auto-grade
  let earnedMarks = 0;
  let totalMarks = 0;
  exam.questions.forEach((q, i) => {
    const questionMarks = q.marks || 1;
    totalMarks += questionMarks;
    if (q.correctAnswer === req.body.answers[i]) earnedMarks += questionMarks;
  });

  const percentageScore = totalMarks > 0 ? (earnedMarks / totalMarks) * 100 : 0;
  const attempt = await ExamAttempt.create({
    examId: req.params.examId,
    studentId: req.user.id,
    answers: req.body.answers,
    score: percentageScore,
  });

  res.json({ score: attempt.score, message: "Exam submitted!" });
});

// STUDENT/TEACHER: View results
router.get("/results/:examId", auth, [
  param('examId').isMongoId().withMessage('Invalid Exam ID')
], validate, async (req, res) => {
  const exam = await ChapterExam.findById(req.params.examId).select("teacherId");
  if (!exam) return res.status(404).json("Exam not found");

  if (req.user.role === "student") {
    const attempts = await ExamAttempt.find({
      examId: req.params.examId,
      studentId: req.user.id,
    })
      .populate("studentId", "name")
      .populate("examId", "chapter");
    return res.json(attempts);
  }

  if ((req.user.role === "teacher" || req.user.role === "cro") && exam.teacherId.toString() !== req.user.id.toString()) {
    return res.status(403).json("Not permitted");
  }

  const attempts = await ExamAttempt.find({ examId: req.params.examId })
    .populate("studentId", "name")
    .populate("examId", "chapter");
  res.json(attempts);
});

// STUDENT: View my results (all attempts)
router.get("/my-results", auth, async (req, res) => {
  if (req.user.role !== "student") return res.status(403).json("Students only");

  const attempts = await ExamAttempt.find({ studentId: req.user.id })
    .populate("examId", "chapter")
    .sort({ createdAt: -1 });
  res.json(attempts);
});

// Add this to your existing exams.js routes
router.get("/teacher", auth, async (req, res) => {
  if (!["teacher", "super", "cro"].includes(req.user.role)) {
    return res.status(403).json("Teachers only");
  }

  let query = {};
  if (req.user.role === "teacher") {
    query.teacherId = req.user.id;
  }

  const exams = await ChapterExam.find(query)
    .populate("enabledStudents", "name");
  res.json(exams);
});

module.exports = router;
