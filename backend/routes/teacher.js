const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const DailyReport = require('../models/DailyReport');

// Simple test route to confirm teacher routes are mounted
router.get('/test', (req, res) => {
  res.json({ message: '✅ Teacher route found!' });
});

// ✅ TEACHER: View own students only (used by TeacherDashboard)
router.get('/my-students', auth, async (req, res) => {
  try {
    if (!['teacher', 'super'].includes(req.user.role)) {
      return res.status(403).json('Access Denied');
    }

    console.log('🟢 /api/teacher/my-students HIT by', req.user.id);

    const students = await User.find({
      teacherId: req.user.id,
      role: 'student',
    })
      .populate('fee')
      .select('name email courseName batchTime personalContact parentContact totalFee fee')
      .sort({ createdAt: -1 });

    console.log('📊 Students found for teacher:', students.length);
    res.json(students);
  } catch (err) {
    console.error('❌ /my-students Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// ✅ GET ATTENDANCE (by date)
router.get('/attendance', auth, async (req, res) => {
  try {
    if (!['teacher', 'super'].includes(req.user.role)) {
      return res.status(403).json('Access Denied');
    }

    const { date } = req.query;
    if (!date) return res.status(400).json('Date is required');

    const attendanceDate = new Date(date);
    const record = await Attendance.findOne({
      date: attendanceDate,
      teacherId: req.user.id,
    }).select('students');

    res.json(record || { students: [] });
  } catch (err) {
    console.error('❌ Get Attendance Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// ✅ MARK ATTENDANCE
router.post('/attendance/mark', auth, async (req, res) => {
  try {
    if (!['teacher', 'super'].includes(req.user.role)) {
      return res.status(403).json('Access Denied');
    }

    const { date, students } = req.body;

    if (!date || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json('Date and students are required');
    }

    const attendanceDate = new Date(date);

    let record = await Attendance.findOne({
      date: attendanceDate,
      teacherId: req.user.id,
    });

    if (!record) {
      record = await Attendance.create({
        date: attendanceDate,
        teacherId: req.user.id,
        students: students.map((id) => ({ studentId: id, present: true })),
      });
    } else {
      const existingMap = new Map(
        record.students.map((s) => [s.studentId.toString(), s]),
      );

      // reset all to absent, then set selected to present
      record.students.forEach((s) => {
        s.present = false;
      });

      students.forEach((id) => {
        if (existingMap.has(id)) {
          existingMap.get(id).present = true;
        } else {
          record.students.push({ studentId: id, present: true });
        }
      });

      await record.save();
    }

    res.json({ message: 'Attendance saved', id: record._id });
  } catch (err) {
    console.error('❌ Attendance Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// ✅ GET DAILY REPORT (by date)
router.get('/daily-report', auth, async (req, res) => {
  try {
    if (!['teacher', 'super'].includes(req.user.role)) {
      return res.status(403).json('Access Denied');
    }

    const { date } = req.query;
    if (!date) return res.status(400).json('Date is required');

    const reportDate = new Date(date);
    const report = await DailyReport.findOne({
      teacherId: req.user.id,
      date: reportDate,
    }).select('date timeSlots description');

    res.json(
      report || {
        date: reportDate,
        timeSlots: [],
        description: '',
      },
    );
  } catch (err) {
    console.error('❌ Get Daily Report Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// ✅ DAILY REPORT
router.post('/daily-report', auth, async (req, res) => {
  try {
    if (!['teacher', 'super'].includes(req.user.role)) {
      return res.status(403).json('Access Denied');
    }

    const { date, timeSlots, description } = req.body;

    if (!date || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json('Date and timeSlots are required');
    }

    const reportDate = new Date(date);

    const report = await DailyReport.findOneAndUpdate(
      { teacherId: req.user.id, date: reportDate },
      {
        teacherId: req.user.id,
        date: reportDate,
        timeSlots,
        description: description || '',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json({ message: 'Report saved', id: report._id });
  } catch (err) {
    console.error('❌ Daily Report Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// ✅ GET ATTENDANCE RANGE (from-to)
router.get('/attendance/range', auth, async (req, res) => {
  try {
    if (!['teacher', 'super'].includes(req.user.role)) {
      return res.status(403).json('Access Denied');
    }

    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json('Both from and to dates are required');

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const records = await Attendance.find({
      teacherId: req.user.id,
      date: { $gte: fromDate, $lte: toDate },
    }).select('date students');

    res.json(records);
  } catch (err) {
    console.error('❌ Get Attendance Range Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
