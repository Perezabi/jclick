const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const DailyReport = require('../models/DailyReport');
const ChapterExam = require('../models/ChapterExam');
const ExamAttempt = require('../models/ExamAttempt');
const Task = require('../models/Task');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

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
      .select('name email courseName batchTime batchDay personalContact parentContact totalFee fee')
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
        students: students.map((s) => {
          if (typeof s === 'string') {
            return { studentId: s, present: true, status: 'Present', topicCovered: '', reason: '' };
          }
          return {
            studentId: s.studentId,
            present: s.status === 'Present',
            status: s.status,
            topicCovered: s.topicCovered || '',
            reason: s.reason || ''
          };
        }),
      });
    } else {
      const existingMap = new Map(
        record.students.map((s) => [s.studentId.toString(), s]),
      );

      const isLegacy = typeof students[0] === 'string';
      if (isLegacy) {
        // reset all to absent, then set selected to present
        record.students.forEach((s) => {
          s.present = false;
          s.status = 'Absent';
        });
      }

      students.forEach((s) => {
        const id = typeof s === 'string' ? s : s.studentId;
        const isPresent = typeof s === 'string' ? true : s.status === 'Present';
        const status = typeof s === 'string' ? 'Present' : s.status;
        const topicCovered = typeof s === 'string' ? '' : s.topicCovered || '';
        const reason = typeof s === 'string' ? '' : s.reason || '';

        if (existingMap.has(id)) {
          const st = existingMap.get(id);
          st.present = isPresent;
          st.status = status;
          st.topicCovered = topicCovered;
          st.reason = reason;
        } else {
          record.students.push({ studentId: id, present: isPresent, status, topicCovered, reason });
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
    const nextDate = new Date(reportDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const report = await DailyReport.findOne({
      teacherId: req.user.id,
      date: { $gte: reportDate, $lt: nextDate },
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
    const nextDate = new Date(reportDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const report = await DailyReport.findOneAndUpdate(
      { 
        teacherId: req.user.id, 
        date: { $gte: reportDate, $lt: nextDate }
      },
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

// ✅ TASKS ENDPOINTS

// teacher creates a new task for a student
router.post('/tasks', auth, async (req, res) => {
  try {
    if (!['teacher', 'super'].includes(req.user.role)) {
      return res.status(403).json('Access Denied');
    }

    const { studentId, title, description, dueDate } = req.body;
    if (!studentId || !title) {
      return res.status(400).json('studentId and title are required');
    }

    const task = await Task.create({
      teacherId: req.user.id,
      studentId,
      title,
      description: description || '',
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    res.json(task);
  } catch (err) {
    console.error('❌ Create Task Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// teacher lists their tasks (optionally filter by student)
router.get('/tasks', auth, async (req, res) => {
  try {
    if (!['teacher', 'super'].includes(req.user.role)) {
      return res.status(403).json('Access Denied');
    }

    const { studentId } = req.query;
    const query = { teacherId: req.user.id };
    if (studentId) query.studentId = studentId;

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error('❌ List Tasks Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// teacher reviews a task
router.post('/tasks/:taskId/review', auth, async (req, res) => {
  try {
    if (!['teacher', 'super'].includes(req.user.role)) {
      return res.status(403).json('Access Denied');
    }
    const { taskId } = req.params;
    const { feedback, mark } = req.body;

    const task = await Task.findOne({ _id: taskId, teacherId: req.user.id });
    if (!task) return res.status(404).json('Task not found');

    task.review = {
      feedback: feedback || '',
      mark: typeof mark === 'number' ? mark : task.review?.mark,
      reviewedAt: new Date(),
    };
    await task.save();

    res.json(task);
  } catch (err) {
    console.error('❌ Review Task Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// ✅ ADMIN: View all students with their tasks
router.get('/admin/students', auth, async (req, res) => {
  try {
    if (req.user.role !== 'super') {
      return res.status(403).json('Access Denied');
    }

    const students = await User.find({ role: 'student' })
      .populate('fee')
      .select('name email courseName batchTime batchDay personalContact parentContact totalFee fee createdAt')
      .sort({ createdAt: -1 });

    // Get tasks for each student
    const studentsWithTasks = await Promise.all(
      students.map(async (student) => {
        const tasks = await Task.find({ studentId: student._id }).sort({ createdAt: -1 });
        return {
          ...student.toObject(),
          tasks: tasks
        };
      })
    );

    res.json(studentsWithTasks);
  } catch (err) {
    console.error('❌ Admin Students Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// ✅ ADMIN: Mark task for any student
router.post('/admin/tasks/:taskId/review', auth, async (req, res) => {
  try {
    if (req.user.role !== 'super') {
      return res.status(403).json('Access Denied');
    }

    const { taskId } = req.params;
    const { feedback, mark } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json('Task not found');

    task.review = {
      feedback: feedback || '',
      mark: typeof mark === 'number' ? mark : task.review?.mark,
      reviewedAt: new Date(),
    };
    await task.save();

    res.json(task);
  } catch (err) {
    console.error('❌ Admin Review Task Error:', err);
    res.status(500).json('Server Error');
  }
  });

  // ✅ ADMIN: Export student attendance and tasks by date range
  router.get('/admin/student-export/:studentId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'super') {
      return res.status(403).json('Access Denied');
    }

    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json('Both startDate and endDate are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Include the entire end day
    end.setHours(23, 59, 59, 999);

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json('Student not found');

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      'students.studentId': studentId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    const actualAttendanceMap = new Map();
    attendanceRecords.forEach(record => {
      const studentRecord = record.students.find(s => s.studentId && s.studentId.toString() === studentId);
      if (studentRecord) {
        const rDate = new Date(record.date);
        const y = rDate.getFullYear();
        const m = String(rDate.getMonth() + 1).padStart(2, '0');
        const d = String(rDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        if (studentRecord.present) {
          actualAttendanceMap.set(dateStr, true);
        } else if (!actualAttendanceMap.has(dateStr)) {
          actualAttendanceMap.set(dateStr, false);
        }
      }
    });

    // Get tasks
    const tasks = await Task.find({
      studentId: studentId,
      createdAt: { $gte: start, $lte: end }
    }).sort({ createdAt: -1 }).populate('teacherId', 'name');

    // Calculate expected days
    let expectedDays = 0;
    let actualPresentDays = 0;
    const fullAttendanceData = [];

    const batchDays = student.batchDay || [];
    const normalizedBatchDays = batchDays.map(day => day ? day.toLowerCase() : '');

    // Compare joining date and start date, pick the later one to start counting expected days
    let joinDate = new Date(student.joiningDate || start);
    if (isNaN(joinDate.getTime())) {
      joinDate = new Date(start);
    }
    // Remove time from joinDate and start
    joinDate.setHours(0,0,0,0);
    const calcStart = new Date(start);
    calcStart.setHours(0,0,0,0);
    const effectiveStart = calcStart > joinDate ? calcStart : joinDate;

    if (effectiveStart <= end && batchDays.length > 0) {
      for (let curDate = new Date(effectiveStart); curDate <= end; curDate.setDate(curDate.getDate() + 1)) {
        const dayName = curDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        const y = curDate.getFullYear();
        const m = String(curDate.getMonth() + 1).padStart(2, '0');
        const dStr = String(curDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${dStr}`;
        
        const isPresent = actualAttendanceMap.get(dateStr) || false;

        if (normalizedBatchDays.includes(dayName)) {
          expectedDays++;
          fullAttendanceData.push({
            date: new Date(curDate),
            present: isPresent
          });
          if (isPresent) actualPresentDays++;
        } else if (isPresent) {
          // Attended on a non-batch day
          fullAttendanceData.push({
            date: new Date(curDate),
            present: true
          });
          actualPresentDays++;
        }
      }
    } else if (attendanceRecords.length > 0) {
       attendanceRecords.forEach(record => {
         const studentRecord = record.students.find(s => s.studentId && s.studentId.toString() === studentId);
         if (studentRecord) {
            fullAttendanceData.push({
              date: record.date,
              present: studentRecord.present
            });
            if (studentRecord.present) actualPresentDays++;
         }
       });
    }

    const attendancePercentage = expectedDays > 0
      ? Math.round((actualPresentDays / expectedDays) * 100)
      : 0;

    res.json({
      student: { name: student.name, email: student.email, courseName: student.courseName },
      attendance: fullAttendanceData,
      tasks: tasks,
      expectedDays,
      actualPresentDays,
      attendancePercentage
    });
  } catch (err) {
    console.error('❌ Admin Export Student Error:', err);
    res.status(500).json('Server Error');
  }
  });

  // student-centric routes
  // get tasks for logged in student
router.get('/student/tasks', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json('Access Denied');
    }

    const tasks = await Task.find({ studentId: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error('❌ Student Tasks Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// student submits a task
router.post('/tasks/:taskId/submit', auth, upload.fields([{ name: 'screenshot', maxCount: 1 }, { name: 'screenshots', maxCount: 10 }]), async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json('Access Denied');
    }
    const { taskId } = req.params;
    const { description, code, gitLink, linkedinLink } = req.body;

    const task = await Task.findOne({ _id: taskId, studentId: req.user.id });
    if (!task) return res.status(404).json('Task not found');

    let screenshotPath = '';
    let screenshotsPaths = [];

    if (req.files) {
      if (req.files['screenshot'] && req.files['screenshot'].length > 0) {
        screenshotPath = `/uploads/${req.files['screenshot'][0].filename}`;
      }
      if (req.files['screenshots'] && req.files['screenshots'].length > 0) {
        screenshotsPaths = req.files['screenshots'].map(file => `/uploads/${file.filename}`);
      }
    }

    task.submission = {
      description: description || '',
      code: code || '',
      screenshot: screenshotPath,
      screenshots: screenshotsPaths,
      gitLink: gitLink || '',
      linkedinLink: linkedinLink || '',
      submittedAt: new Date(),
    };
    await task.save();

    res.json(task);
  } catch (err) {
    console.error('❌ Submit Task Error:', err);
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

// ✅ GET STUDENT DETAILED INFO (with attendance & exams)
// Helper function to calculate expected attendance days
const calculateExpectedAttendanceDays = (joiningDate, batchDays) => {
  if (!joiningDate || !batchDays || batchDays.length === 0) return 0;

  const startDate = new Date(joiningDate);
  const endDate = new Date();
  let expectedDays = 0;

  // Convert batch days to lowercase for consistency
  const normalizedBatchDays = batchDays.map(day => day ? day.toLowerCase() : '');

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (normalizedBatchDays.includes(dayName)) {
      expectedDays++;
    }
  }

  return expectedDays;
};

router.get('/student-details/:studentId', auth, async (req, res) => {
  try {
    if (!['teacher', 'super'].includes(req.user.role)) {
      return res.status(403).json('Access Denied');
    }

    const { studentId } = req.params;

    // Check if student belongs to this teacher
    const student = await User.findOne({
      _id: studentId,
      teacherId: req.user.id,
      role: 'student'
    }).populate('fee');

    if (!student) {
      return res.status(404).json('Student not found');
    }

    // Get all attendance records for this student
    const attendanceRecords = await Attendance.find({
      teacherId: req.user.id,
      'students.studentId': studentId
    }).select('date students').sort({ date: -1 });

    // Get exam results for this student
    const exams = await ChapterExam.find({ teacherId: req.user.id }).select('_id chapter');
    const examAttempts = await ExamAttempt.find({
      studentId: studentId,
      examId: { $in: exams.map(e => e._id) }
    }).populate('examId', 'chapter');

    // Process attendance data
    const actualAttendanceMap = new Map();
    attendanceRecords.forEach(record => {
      const studentRecord = record.students.find(s => s.studentId && s.studentId.toString() === studentId);
      if (studentRecord) {
        const rDate = new Date(record.date);
        const y = rDate.getFullYear();
        const m = String(rDate.getMonth() + 1).padStart(2, '0');
        const d = String(rDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        if (studentRecord.present) {
          actualAttendanceMap.set(dateStr, true);
        } else if (!actualAttendanceMap.has(dateStr)) {
          actualAttendanceMap.set(dateStr, false);
        }
      }
    });

    let expectedDays = 0;
    let actualPresentDays = 0;
    const fullAttendanceData = [];

    const batchDays = student.batchDay || [];
    const normalizedBatchDays = batchDays.map(day => day ? day.toLowerCase() : '');

    let joinDate = student.joiningDate ? new Date(student.joiningDate) : null;
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    if (joinDate && !isNaN(joinDate.getTime()) && batchDays.length > 0) {
      joinDate.setHours(0,0,0,0);
      for (let curDate = new Date(joinDate); curDate <= end; curDate.setDate(curDate.getDate() + 1)) {
        const dayName = curDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        const y = curDate.getFullYear();
        const m = String(curDate.getMonth() + 1).padStart(2, '0');
        const dStr = String(curDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${dStr}`;
        
        const isPresent = actualAttendanceMap.get(dateStr) || false;

        if (normalizedBatchDays.includes(dayName)) {
          expectedDays++;
          fullAttendanceData.push({
            date: new Date(curDate),
            present: isPresent
          });
          if (isPresent) actualPresentDays++;
        } else if (isPresent) {
          // Attended on a non-batch day
          fullAttendanceData.push({
            date: new Date(curDate),
            present: true
          });
          actualPresentDays++;
        }
      }
      
      // Sort attendance data descending by date
      fullAttendanceData.sort((a, b) => b.date - a.date);
    } else {
       // fallback if no joining date or batch days
       attendanceRecords.forEach(record => {
         const studentRecord = record.students.find(s => s.studentId && s.studentId.toString() === studentId);
         if (studentRecord) {
            fullAttendanceData.push({
              date: record.date,
              present: studentRecord.present
            });
            if (studentRecord.present) actualPresentDays++;
         }
       });
       expectedDays = calculateExpectedAttendanceDays(student.joiningDate, student.batchDay || []);
    }

    // Calculate attendance percentage based on expected vs actual attendance
    const attendancePercentage = expectedDays > 0
      ? Math.round((actualPresentDays / expectedDays) * 100)
      : 0;

    // Process exam data
    const examData = examAttempts.map(attempt => ({
      chapter: attempt.examId?.chapter || 'Unknown',
      score: attempt.score || 0,
      completedAt: attempt.completedAt
    }));

    res.json({
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        courseName: student.courseName,
        batchTime: student.batchTime,
        batchDay: student.batchDay,
        joiningDate: student.joiningDate,
        personalContact: student.personalContact,
        parentContact: student.parentContact,
        totalFee: student.totalFee,
        fee: student.fee
      },
      attendance: fullAttendanceData,
      exams: examData,
      attendancePercentage: attendancePercentage,
      expectedAttendanceDays: expectedDays,
      actualPresentDays: actualPresentDays
    });
  } catch (err) {
    console.error('❌ Get Student Details Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
