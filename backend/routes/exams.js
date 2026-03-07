const express = require('express');
const router = require("express").Router();
const ChapterExam = require("../models/ChapterExam");
const ExamAttempt = require("../models/ExamAttempt");
const auth = require("../middleware/auth");

// TEACHER: Create chapter exam
router.post("/create", auth, async (req, res) => {
  if (!["teacher", "super"].includes(req.user.role))
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
router.post("/enable/:examId", auth, async (req, res) => {
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
router.post("/submit/:examId", auth, async (req, res) => {
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
  let score = 0;
  exam.questions.forEach((q, i) => {
    if (q.correctAnswer === req.body.answers[i]) score++;
  });

  const attempt = await ExamAttempt.create({
    examId: req.params.examId,
    studentId: req.user.id,
    answers: req.body.answers,
    score: (score / exam.questions.length) * 100,
  });

  res.json({ score: attempt.score, message: "Exam submitted!" });
});

// STUDENT/TEACHER: View results
router.get("/results/:examId", auth, async (req, res) => {
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

  if (req.user.role === "teacher" && exam.teacherId.toString() !== req.user.id.toString()) {
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
  if (!["teacher", "super"].includes(req.user.role)) {
    return res.status(403).json("Teachers only");
  }
  const exams = await ChapterExam.find({ teacherId: req.user.id })
    .populate("enabledStudents", "name");
  res.json(exams);
});

module.exports = router;
