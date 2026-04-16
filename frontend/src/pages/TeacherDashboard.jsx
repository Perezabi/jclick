import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

const LOGO_BASE64 =
  "data:image/jpeg;base64,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";
import {
  FaTrash,
  FaEye,
  FaDownload,
  FaFilePdf,
  FaPlus,
  FaClock,
  FaMoon,
  FaSun,
} from "react-icons/fa";
import logoImage from "../assets/Jclick logo black png.png";

function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState("students");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({});
  const [savingStudent, setSavingStudent] = useState(false);
  const [showNonBatchStudents, setShowNonBatchStudents] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  // make sure <body> always reflects the theme so that any unstyled
  // elements (and the background) switch immediately when the page loads.
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherName, setTeacherName] = useState("Teacher");
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    email: "",
    personalContact: "",
    parentContact: "",
  });
  const [savingTeacher, setSavingTeacher] = useState(false);

  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [attendanceFrom, setAttendanceFrom] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [attendanceTo, setAttendanceTo] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // ATTENDANCE DAILY REPORT STATES
  const [showAttendanceReportModal, setShowAttendanceReportModal] =
    useState(false);
  const [attendanceReportData, setAttendanceReportData] = useState(null);
  const [attendanceReportLoading, setAttendanceReportLoading] = useState(false);
  const [editingAttendanceReport, setEditingAttendanceReport] = useState(false);
  const [attendanceReportSlots, setAttendanceReportSlots] = useState([]);
  const [attendanceReportDescription, setAttendanceReportDescription] =
    useState("");

  // DAILY REPORT STATES
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [reportSlots, setReportSlots] = useState([]);
  const [reportDescription, setReportDescription] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);
  const [savingReport, setSavingReport] = useState(false);

  // EXAM STATES
  const [teacherExams, setTeacherExams] = useState([]);
  const [examSearchTerm, setExamSearchTerm] = useState("");
  const [showExamModal, setShowExamModal] = useState(false);
  const [examForm, setExamForm] = useState({
    chapter: "",
    questions: [{ question: "", options: ["", "", "", ""], correctAnswer: 0 }],
  });
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsExam, setResultsExam] = useState(null);
  const [examResults, setExamResults] = useState([]);

  // TASK STATES
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskSearchTerm, setTaskSearchTerm] = useState("");
  const [taskForm, setTaskForm] = useState({
    studentId: "",
    title: "",
    description: "",
    dueDate: "",
  });
  const [reviewingTask, setReviewingTask] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewMark, setReviewMark] = useState("");
  const [taskFromDate, setTaskFromDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [taskToDate, setTaskToDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const timeSlots = [
    "9:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-1:00",
    "1:00-2:00",
    "2:00-3:00",
    "3:00-4:00",
    "4:00-5:00",
    "5:00-6:00",
    "6:00-7:00",
  ];

  // Helper: Download HTML file with colors
  const downloadHTML = (htmlContent, filename) => {
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: Download CSV file
  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const buildDefaultReportSlots = () =>
    timeSlots.map((slot) => ({ slot, completed: false, description: "" }));

  const handleSaveStudent = async () => {
    try {
      setSavingStudent(true);
      await axios.put(`${API}/users/${studentForm._id}`, studentForm, {
        headers: { Authorization: token },
      });
      toast.success("Student updated");
      fetchStudents();
      setEditingStudent(false);
      setShowStudentModal(false);
    } catch (err) {
      toast.error("Failed to update student");
    } finally {
      setSavingStudent(false);
    }
  };

  const handleSaveTeacher = async () => {
    try {
      setSavingTeacher(true);
      const res = await axios.put(`${API}/users/profile`, teacherForm, {
        headers: { Authorization: token },
      });
      toast.success("Profile updated");
      setTeacherName(res.data.name || teacherName);
      localStorage.setItem("userName", res.data.name || "");
      setShowTeacherModal(false);
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setSavingTeacher(false);
    }
  };

  const applyAttendanceRecord = (recordStudents) => {
    const recordMap = new Map(
      (recordStudents || []).map((s) => [
        s.studentId?.toString?.() || s.studentId,
        s,
      ]),
    );

    setStudents((prev) =>
      prev.map((st) => {
        const record = recordMap.get(st._id);
        return {
          ...st,
          attendance: {
            present: record ? record.present : false,
            status: record ? record.status : "",
            topicCovered: record ? record.topicCovered : "",
            reason: record ? record.reason : "",
          },
        };
      }),
    );
  };

  // Export tasks with attendance data
  const exportTasksWithAttendance = async (
    fromDate,
    toDate,
    selectedStudentId = null,
  ) => {
    try {
      const fromParam = fromDate || new Date().toISOString().split("T")[0];
      const toParam = toDate || new Date().toISOString().split("T")[0];
      const fromTarget = new Date(fromParam);
      const toTarget = new Date(toParam);
      const dateStr = `${fromTarget.toLocaleDateString()} to ${toTarget.toLocaleDateString()}`;

      // Fetch attendance data
      const attendanceRes = await axios.get(`${API}/teacher/attendance`, {
        params: { date: toParam },
        headers: { Authorization: token },
      });
      const attendanceData = attendanceRes.data || { students: [] };

      // Fetch tasks for the selected student(s)
      let tasksData = [];
      if (selectedStudentId) {
        // Export for specific student
        const tasksRes = await axios.get(
          `${API}/teacher/tasks?studentId=${selectedStudentId}`,
          {
            headers: { Authorization: token },
          },
        );
        tasksData = tasksRes.data || [];
      } else {
        // Export for all students
        const tasksRes = await axios.get(`${API}/teacher/tasks`, {
          headers: { Authorization: token },
        });
        tasksData = tasksRes.data || [];
      }

      // Filter tasks based on due date range
      const filteredTasks = tasksData.filter((task) => {
        const dueDate = new Date(task.dueDate);
        return dueDate >= fromTarget && dueDate <= toTarget;
      });

      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${selectedStudentId ? "Student Tasks & Attendance Report" : "Tasks & Attendance Report"} - ${dateStr}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo-box { display: inline-block; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
    .logo-text { font-size: 16px; font-weight: bold; color: #10b981; margin-top: 8px; }
    .header { background: white; color: black; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 28px; }
    .info { margin: 10px 0; font-size: 14px; }
    .section { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .section h2 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
    th { background: #10b981; color: white; padding: 12px; text-align: left; font-weight: bold; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f9f9f9; }
    .present { background: #d1fae5; color: #065f46; font-weight: bold; }
    .absent { background: #f8d7da; color: #721c24; font-weight: bold; }
    .submitted { background: #d1fae5; color: #065f46; font-weight: bold; }
    .pending { background: #fef3c7; color: #92400e; font-weight: bold; }
    .code-block { background: #f4f4f4; padding: 10px; border-left: 4px solid #10b981; margin: 5px 0; font-family: monospace; white-space: pre-wrap; }
    .links { margin: 5px 0; }
    .links a { color: #10b981; text-decoration: none; }
    .links a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="logo">
    <div class="logo-box">
      <img src="${LOGO_BASE64}" alt="JClick Solutions Logo" style="max-height: 80px; width: auto; border-radius: 8px;" />
    </div>
  </div>
  <div class="header">
    <h1>${selectedStudentId ? "📋 Student Tasks & Attendance Report" : "📋 Tasks & Attendance Report"}</h1>
    ${selectedStudentId ? `<div class="info"><strong>Student:</strong> ${students.find((s) => s._id === selectedStudentId)?.name || "Unknown"}</div>` : `<div class="info"><strong>Date:</strong> ${dateStr}</div>`}
    <div class="info"><strong>Teacher:</strong> ${teacherName}</div>
    ${selectedStudentId ? `<div class="info"><strong>Report Date:</strong> ${dateStr}</div>` : '<div class="info"><strong>Scope:</strong> All Students</div>'}
  </div>

  <!-- Attendance Section -->
  <div class="section">
    <h2>📊 Attendance Summary</h2>
    <table>
      <thead>
        <tr><th>Student Name</th><th>Course</th><th>Attendance Status</th></tr>
      </thead>
      <tbody>`;

      // Show attendance for selected student(s)
      const attendanceStudents = selectedStudentId
        ? students.filter((s) => s._id === selectedStudentId)
        : students;

      attendanceStudents.forEach((student) => {
        const attendanceRecord = attendanceData.students?.find(
          (a) => a.studentId === student._id,
        );
        const status = attendanceRecord?.present ? "Present" : "Absent";
        const statusClass = attendanceRecord?.present ? "present" : "absent";
        html += `<tr><td>${student.name}</td><td>${student.courseName}</td><td class="${statusClass}">${status}</td></tr>`;
      });

      html += `</tbody>
    </table>
  </div>

  <!-- Tasks Section -->
  <div class="section">
    <h2>📝 Task Submissions</h2>`;

      if (filteredTasks.length === 0) {
        html += `<p>${selectedStudentId ? "No tasks found for this student." : "No tasks found for the selected date."}</p>`;
      } else {
        filteredTasks.forEach((task) => {
          const student = students.find((s) => s._id === task.studentId);
          const studentName = student ? student.name : "Unknown Student";

          html += `
    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
      <h3 style="color: #10b981; margin: 0 0 10px 0;">${task.title}</h3>
      <p><strong>Student:</strong> ${studentName}</p>
      <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
      <p><strong>Description:</strong> ${task.description || "No description"}</p>
      <p><strong>Status:</strong> <span class="${task.submission?.submittedAt ? "submitted" : "pending"}">${task.submission?.submittedAt ? "Submitted" : "Pending"}</span></p>`;

          if (task.submission) {
            html += `<p><strong>Submitted:</strong> ${new Date(task.submission.submittedAt).toLocaleDateString()}</p>`;

            if (task.submission.description) {
              html += `<p><strong>Submission Description:</strong> ${task.submission.description}</p>`;
            }

            if (task.submission.code) {
              html += `<div><strong>Code:</strong><div class="code-block">${task.submission.code}</div></div>`;
            }

            if (
              task.submission.screenshots &&
              Array.isArray(task.submission.screenshots)
            ) {
              html += `<div class="links"><strong>Files:</strong>`;
              task.submission.screenshots.forEach((screenshot, index) => {
                html += `<br><a href="${API}${screenshot}" target="_blank">View File ${index + 1}</a>`;
              });
              html += `</div>`;
            } else if (task.submission.screenshot) {
              html += `<div class="links"><strong>File:</strong> <a href="${API}${task.submission.screenshot}" target="_blank">View File</a></div>`;
            }

            if (task.submission.gitLink) {
              html += `<div class="links"><strong>Git Repository:</strong> <a href="${task.submission.gitLink}" target="_blank">${task.submission.gitLink}</a></div>`;
            }

            if (task.submission.linkedinLink) {
              html += `<div class="links"><strong>LinkedIn Profile:</strong> <a href="${task.submission.linkedinLink}" target="_blank">${task.submission.linkedinLink}</a></div>`;
            }
          }

          if (task.review) {
            html += `<div style="background: #e8f5e8; padding: 10px; border-radius: 5px; margin-top: 10px;">
              <strong>Review:</strong> ${task.review.feedback || "No feedback"}
              ${task.review.mark ? `<br><strong>Mark:</strong> ${task.review.mark}` : ""}
            </div>`;
          }

          html += `</div>`;
        });
      }

      html += `
  </div>
</body>
</html>`;

      const filename = selectedStudentId
        ? `tasks-attendance-${students.find((s) => s._id === selectedStudentId)?.name || "student"}-${fromParam}-to-${toParam}.html`
        : `tasks-attendance-all-${fromParam}-to-${toParam}.html`;

      downloadHTML(html, filename);
      toast.success(
        `${selectedStudentId ? "Student tasks & attendance" : "Tasks & attendance"} report exported successfully!`,
      );
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export tasks & attendance report");
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/teacher/my-students`, {
        headers: { Authorization: token },
        timeout: 15000,
      });
      setStudents(
        (res.data || []).map((s) => ({
          ...s,
          attendance: { present: false },
        })),
      );
    } catch (err) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceForDate = async (date) => {
    try {
      setLoadingAttendance(true);
      const res = await axios.get(`${API}/teacher/attendance`, {
        params: { date },
        headers: { Authorization: token },
      });
      applyAttendanceRecord(res.data?.students);
    } catch (err) {
      console.error("Attendance fetch error:", err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchAttendanceReport = async (date) => {
    try {
      setAttendanceReportLoading(true);
      const res = await axios.get(`${API}/teacher/daily-report`, {
        params: { date },
        headers: { Authorization: token },
      });
      setAttendanceReportData(res.data);
      const existing = res.data?.timeSlots?.length
        ? res.data.timeSlots.map((s) => ({
            ...s,
            description: s.description || "",
          }))
        : buildDefaultReportSlots();
      setAttendanceReportSlots(existing);
      setAttendanceReportDescription(res.data?.description || "");
      setEditingAttendanceReport(false);
    } catch (err) {
      toast.error("Failed to load daily report");
      setAttendanceReportSlots(buildDefaultReportSlots());
      setAttendanceReportDescription("");
    } finally {
      setAttendanceReportLoading(false);
    }
  };

  const saveAttendanceReport = async () => {
    try {
      setSavingAttendance(true);
      await axios.post(
        `${API}/teacher/daily-report`,
        {
          date: attendanceDate,
          timeSlots: attendanceReportSlots,
          description: attendanceReportDescription,
        },
        { headers: { Authorization: token } },
      );
      toast.success("Daily report saved!");
      fetchAttendanceReport(attendanceDate);
      setEditingAttendanceReport(false);
    } catch (err) {
      toast.error(err.response?.data || "Failed to save daily report");
    } finally {
      setSavingAttendance(false);
    }
  };

  // export both attendance & daily report as HTML with colors
  const exportAttendanceToCSV = async (dateParam) => {
    try {
      const targetDate = new Date(dateParam || attendanceDate);
      const dateStr = targetDate.toLocaleDateString();

      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Attendance Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo-box { display: inline-block; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
    .logo-text { font-size: 16px; font-weight: bold; color: #10b981; margin-top: 8px; }
    .header { background: white; color: black; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 28px; }
    .info { margin: 10px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 30px; }
    th { background: #10b981; color: white; padding: 12px; text-align: left; font-weight: bold; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f9f9f9; }
    .present { background: #d1fae5; color: #065f46; font-weight: bold; }
    .absent { background: #f8d7da; color: #721c24; font-weight: bold; }
  </style>
</head>
<body>
  <div class="logo">
    <div class="logo-box">
      <img src="${LOGO_BASE64}" alt="JClick Solutions Logo" style="max-height: 80px; width: auto; border-radius: 8px;" />
    </div>
  </div>
  <div class="header">
    <h1>📋 Attendance Report</h1>
    <div class="info"><strong>Date:</strong> ${dateStr}</div>
    <div class="info"><strong>Teacher:</strong> ${teacherName}</div>
  </div>
  
  <table>
    <thead>
      <tr><th>Student Name</th><th>Course</th><th>Status</th></tr>
    </thead>
    <tbody>`;

      students.forEach((s) => {
        const status = s.attendance?.present ? "Present" : "Absent";
        const statusClass = s.attendance?.present ? "present" : "absent";
        html += `<tr><td>${s.name}</td><td>${s.courseName}</td><td class="${statusClass}">${status}</td></tr>`;
      });

      html += `</tbody>
  </table>`;

      // Add Daily Report section
      const slots = attendanceReportSlots.length
        ? attendanceReportSlots
        : buildDefaultReportSlots();
      html += `<div style="page-break-before: always; margin-top: 40px;">
    <div class="header" style="margin-bottom: 20px;">
      <h2 style="margin: 0; font-size: 24px;">📅 Daily Report</h2>
    </div>
    <table>
      <thead>
        <tr><th>Time Slot</th><th>Completed</th><th>Description</th></tr>
      </thead>
      <tbody>`;

      slots.forEach((ts) => {
        const completed = ts.completed ? "Yes" : "No";
        const completedClass = ts.completed ? "present" : "absent";
        html += `<tr><td>${ts.slot}</td><td class="${completedClass}">${completed}</td><td>${ts.description || "-"}</td></tr>`;
      });

      if (attendanceReportDescription) {
        html += `<tr><td colspan="3"><strong>Notes:</strong> ${attendanceReportDescription}</td></tr>`;
      }

      html += `</tbody>
    </table>
  </div>
</body>
</html>`;

      downloadHTML(html, `attendance-report-${attendanceDate}.html`);
      toast.success("Report exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export report");
    }
  };

  // helper: export ONLY attendance rows as HTML with colors
  const exportAttendanceOnlyCSV = async (dateParam) => {
    try {
      const targetDate = new Date(dateParam || attendanceDate);
      const dateStr = targetDate.toLocaleDateString();

      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Attendance - ${dateStr}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo-box { display: inline-block; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
    .logo-text { font-size: 16px; font-weight: bold; color: #10b981; margin-top: 8px; }
    .header { background: white; color: black; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 28px; }
    .info { margin: 10px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    th { background: #10b981; color: white; padding: 12px; text-align: left; font-weight: bold; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f9f9f9; }
    .present { background: #d1fae5; color: #065f46; font-weight: bold; }
    .absent { background: #f8d7da; color: #721c24; font-weight: bold; }
  </style>
</head>
<body>
  <div class="logo">
    <div class="logo-box">
      <img src="${LOGO_BASE64}" alt="JClick Solutions Logo" style="max-height: 80px; width: auto; border-radius: 8px;" />
    </div>
  </div>
  <div class="header">
    <h1>✅ Attendance Report</h1>
    <div class="info"><strong>Date:</strong> ${dateStr}</div>
  </div>
  
  <table>
    <thead>
      <tr><th>Student Name</th><th>Course</th><th>Status</th></tr>
    </thead>
    <tbody>`;

      students.forEach((s) => {
        const status = s.attendance?.present ? "Present" : "Absent";
        const statusClass = s.attendance?.present ? "present" : "absent";
        html += `<tr><td>${s.name}</td><td>${s.courseName}</td><td class="${statusClass}">${status}</td></tr>`;
      });

      html += `</tbody>
  </table>
</body>
</html>`;

      downloadHTML(html, `attendance-all-${attendanceDate}.html`);
      toast.success("Report exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export report");
    }
  };

  // export attendance for a range of dates as HTML with colors
  const exportAttendanceRangeCSV = async () => {
    if (!attendanceFrom || !attendanceTo) {
      toast.error("Please select both from and to dates");
      return;
    }
    try {
      setLoadingAttendance(true);
      const res = await axios.get(`${API}/teacher/attendance/range`, {
        params: { from: attendanceFrom, to: attendanceTo },
        headers: { Authorization: token },
      });
      const records = res.data || [];

      const [fromYear, fromMonth, fromDay] = attendanceFrom.split("-");
      const startDt = new Date(fromYear, fromMonth - 1, fromDay);
      const [toYear, toMonth, toDay] = attendanceTo.split("-");
      const endDt = new Date(toYear, toMonth - 1, toDay);
      const daysOfWeek = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];

      const dates = [];
      const dateObjects = [];
      let currentDt = new Date(startDt);
      while (currentDt <= endDt) {
        const dStr = currentDt.toLocaleDateString();
        dates.push(dStr);
        dateObjects.push({
          dateStr: dStr,
          dayName: daysOfWeek[currentDt.getDay()],
        });
        currentDt.setDate(currentDt.getDate() + 1);
      }

      // Pivot data: students as rows, dates as columns
      const studentMap = new Map();
      students.forEach((stu) => {
        studentMap.set(stu.name, {
          studentObj: stu,
          statuses: {},
        });
      });

      records.forEach((rec) => {
        const dateStr = new Date(rec.date).toLocaleDateString();
        rec.students.forEach((s) => {
          const stu = students.find(
            (st) => st._id === s.studentId || st._id === s.studentId?._id,
          );
          if (stu) {
            studentMap.get(stu.name).statuses[dateStr] = s.present
              ? "Present"
              : "Absent";
          }
        });
      });

      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Attendance Range Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    .header { background: white; color: black; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
    .logo { text-align: center; margin-bottom: 15px; }
    .logo-box { display: inline-block; }
    .logo svg { height: 60px; width: auto; }
    .logo-text { font-size: 12px; font-weight: bold; color: #10b981; margin-top: 5px; }
    .header h1 { margin: 10px 0 0 0; font-size: 28px; }
    .info { margin: 10px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    th { background: #10b981; color: white; padding: 12px; text-align: center; font-weight: bold; }
    td { padding: 12px; border: 1px solid #ddd; text-align: center; }
    .student-name { text-align: left; background: #f9f9f9; font-weight: bold; }
    tr:hover { background: #f0f0f0; }
    .present { background: #d1fae5; color: #065f46; font-weight: bold; }
    .absent { background: #f8d7da; color: #721c24; font-weight: bold; }
    .leave { background: #e0e7ff; color: #1e40af; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <div class="logo-box">
        <img src="${LOGO_BASE64}" alt="JClick Solutions Logo" style="max-height: 80px; width: auto; border-radius: 8px;" />
      </div>
    </div>
    <h1>Attendance Range Report</h1>
    <div class="info"><strong>Date Range:</strong> ${attendanceFrom} to ${attendanceTo}</div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Student Name</th>`;

      dates.forEach((date) => {
        html += `<th>${date}</th>`;
      });

      html += `<th>Full Absent Days</th><th>Percentage</th></tr>
    </thead>
    <tbody>`;

      studentMap.forEach((data, studentName) => {
        const stu = data.studentObj;
        const statuses = data.statuses;
        const batchDays =
          stu && stu.batchDay ? stu.batchDay.map((d) => d.toLowerCase()) : [];

        html += `<tr><td class="student-name">${studentName}</td>`;

        let fullAbsentCount = 0;
        let expectedDaysCount = 0;

        dateObjects.forEach((dObj) => {
          const rawStatus = statuses[dObj.dateStr];
          const isBatchDay = batchDays.includes(dObj.dayName);

          let displayStatus = "N/A";
          let statusClass = "";

          if (isBatchDay) {
            expectedDaysCount++;
            if (rawStatus === "Present") {
              displayStatus = "Present";
              statusClass = "present";
            } else {
              displayStatus = "Absent";
              statusClass = "absent";
              fullAbsentCount++;
            }
          } else {
            if (rawStatus === "Present") {
              displayStatus = "Present";
              statusClass = "present";
            } else {
              displayStatus = "Leave";
              statusClass = "leave";
            }
          }

          html += `<td class="${statusClass}">${displayStatus}</td>`;
        });

        const presentDaysCount = expectedDaysCount - fullAbsentCount;
        const percentage =
          expectedDaysCount > 0
            ? Math.round((presentDaysCount / expectedDaysCount) * 100)
            : 0;

        html += `<td><strong>${fullAbsentCount}</strong></td><td><strong>${percentage}%</strong></td>`;
        html += `</tr>`;
      });

      html += `</tbody>
  </table>
</body>
</html>`;

      downloadHTML(
        html,
        `attendance-${attendanceFrom}-to-${attendanceTo}.html`,
      );
      toast.success("Range report exported!");
    } catch (err) {
      console.error("Range export error", err);
      toast.error("Failed to export range");
    } finally {
      setLoadingAttendance(false);
    }
  };

  // export only daily report as HTML with colors
  const exportDailyReportCSV = async (dateParam) => {
    try {
      const targetDate = new Date(dateParam || reportDate);
      const dateStr = targetDate.toLocaleDateString();
      const slots = reportSlots.length
        ? reportSlots
        : buildDefaultReportSlots();

      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Daily Report - ${dateStr}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo-box { display: inline-block; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
    .logo-text { font-size: 16px; font-weight: bold; color: #10b981; margin-top: 8px; }
    .header { background: white; color: black; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 28px; }
    .info { margin: 10px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    th { background: #10b981; color: white; padding: 12px; text-align: left; font-weight: bold; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f9f9f9; }
    .completed { background: #d1fae5; color: #065f46; font-weight: bold; }
    .pending { background: #fef3c7; color: #92400e; font-weight: bold; }
    .notes { background: #dbeafe; padding: 15px; border-left: 4px solid #10b981; margin-top: 20px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="logo">
    <div class="logo-box">
      <img src="${LOGO_BASE64}" alt="JClick Solutions Logo" style="max-height: 80px; width: auto; border-radius: 8px;" />
    </div>
  </div>
  <div class="header">
    <h1>📝 Daily Report</h1>
    <div class="info"><strong>Date:</strong> ${dateStr}</div>
  </div>
  
  <table>
    <thead>
      <tr><th>Time Slot</th><th>Status</th><th>Description</th></tr>
    </thead>
    <tbody>`;

      slots.forEach((ts) => {
        const status = ts.completed ? "Completed" : "Pending";
        const statusClass = ts.completed ? "completed" : "pending";
        html += `<tr><td>${ts.slot}</td><td class="${statusClass}">${status}</td><td>${ts.description || "-"}</td></tr>`;
      });

      html += `</tbody>
  </table>`;

      if (reportDescription) {
        html += `<div class="notes"><strong>📌 Notes:</strong><br>${reportDescription}</div>`;
      }

      html += `</body>
</html>`;

      downloadHTML(html, `daily-report-${reportDate}.html`);
      toast.success("Daily report exported!");
    } catch (err) {
      console.error("Daily report export error", err);
      toast.error("Failed to export report");
    }
  };

  // export a single student's attendance as HTML with colors
  const exportSingleStudentCSV = async (student) => {
    try {
      const dateStr = new Date(attendanceDate).toLocaleDateString();
      const status = student.attendance?.present ? "Present" : "Absent";
      const statusClass = student.attendance?.present ? "present" : "absent";

      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Attendance - ${student.name}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    .header { background: white; color: black; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
    .logo { text-align: center; margin-bottom: 15px; }
    .logo-box { display: inline-block; }
    .logo svg { height: 50px; width: auto; }
    .logo-text { font-size: 11px; font-weight: bold; color: #10b981; margin-top: 3px; }
    .header h1 { margin: 10px 0 0 0; font-size: 28px; }
    .info { margin: 10px 0; font-size: 14px; }
    .details { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .detail-row { display: flex; padding: 12px 0; border-bottom: 1px solid #ddd; }
    .detail-row:last-child { border-bottom: none; }
    .label { font-weight: bold; width: 150px; color: #10b981; }
    .value { flex: 1; }
    .present { background: #d1fae5; color: #065f46; padding: 8px 12px; border-radius: 5px; font-weight: bold; display: inline-block; }
    .absent { background: #f8d7da; color: #721c24; padding: 8px 12px; border-radius: 5px; font-weight: bold; display: inline-block; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <div class="logo-box">
        <img src="${LOGO_BASE64}" alt="JClick Solutions Logo" style="max-height: 80px; width: auto; border-radius: 8px;" />
      </div>
    </div>
    <h1>Student Attendance</h1>
    <div class="info"><strong>Date:</strong> ${dateStr}</div>
  </div>
  
  <div class="details">
    <div class="detail-row">
      <div class="label">Student Name:</div>
      <div class="value">${student.name}</div>
    </div>
    <div class="detail-row">
      <div class="label">Course:</div>
      <div class="value">${student.courseName}</div>
    </div>
    <div class="detail-row">
      <div class="label">Date:</div>
      <div class="value">${dateStr}</div>
    </div>
    <div class="detail-row">
      <div class="label">Status:</div>
      <div class="value"><span class="${statusClass}">${status}</span></div>
    </div>
    <div class="detail-row">
      <div class="label">Teacher:</div>
      <div class="value">${teacherName}</div>
    </div>
  </div>
</body>
</html>`;

      downloadHTML(
        html,
        `attendance-${student.name.replace(/\s+/g, "_")}-${attendanceDate}.html`,
      );
      toast.success("Report exported!");
    } catch (err) {
      console.error("Single student export error", err);
      toast.error("Failed to export report");
    }
  };

  // export student's full details with attendance and exam marks
  const exportStudentFullDetails = async (student) => {
    try {
      // Fetch student's detailed information from backend
      const res = await axios.get(
        `${API}/teacher/student-details/${student._id}`,
        {
          headers: { Authorization: token },
        },
      );

      const data = res.data;
      const currentDate = new Date().toLocaleDateString("en-GB");

      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${student.name} - Complete Report</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      padding: 20px; 
      background: #f5f5f5;
      margin: 0;
    }
    .logo-section {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      display: inline-block;
      background: white; padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    .logo img {
      height: 80px;
      width: auto;
      object-fit: contain;
    }
    .logo-text {
      font-size: 18px;
      font-weight: bold;
      color: #10b981;
      margin-top: 8px;
    }
    .header {
      background: white; color: black;      padding: 30px; 
      border-radius: 10px; 
      margin-bottom: 30px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .header h1 { 
      margin: 0; 
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      font-size: 14px;
    }
    .section { 
      background: white; 
      padding: 25px; 
      border-radius: 10px; 
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #059669;
      margin-bottom: 15px;
      border-bottom: 3px solid #10b981;
      padding-bottom: 10px;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .detail-row { 
      padding: 12px 0;
      border-bottom: 1px solid #ddd;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .label { 
      font-weight: bold; 
      color: #10b981;
      font-size: 13px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .value { 
      font-size: 15px;
      color: #333;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      background: white;
      margin-top: 10px;
    }
    th { 
      background: #10b981; 
      color: white; 
      padding: 12px; 
      text-align: left; 
      font-weight: bold;
    }
    td { 
      padding: 12px; 
      border-bottom: 1px solid #ddd;
    }
    tr:hover { 
      background: #f9f9f9;
    }
    .present { 
      background: #d1fae5; 
      color: #065f46; 
      padding: 6px 10px;
      border-radius: 4px;
      font-weight: bold;
      text-align: center;
    }
    .absent { 
      background: #f8d7da; 
      color: #721c24; 
      padding: 6px 10px;
      border-radius: 4px;
      font-weight: bold;
      text-align: center;
    }
    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-box {
      background: white; color: black;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .stat-label{
      font-size: 12px;
      opacity: 0.9;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #999;
      font-size: 12px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="logo-section">
    <div class="logo">
      <img src="${LOGO_BASE64}" alt="JClick Solutions Logo" style="max-height: 80px; width: auto; border-radius: 8px;" />
    </div>
  </div>

  <div class="header">
    <h1>Student Complete Report</h1>
    <div class="header-info">
      <div><strong>Generated on:</strong> ${currentDate}</div>
      <div><strong>Reported by:</strong> ${teacherName}</div>
    </div>
  </div>

  <!-- STUDENT DETAILS SECTION -->
  <div class="section">
    <div class="section-title">👤 Student Details</div>
    <div class="detail-grid">
      <div class="detail-row">
        <div class="label">Name</div>
        <div class="value">${data.student.name}</div>
      </div>
      <div class="detail-row">
        <div class="label">Email</div>
        <div class="value">${data.student.email}</div>
      </div>
      <div class="detail-row">
        <div class="label">Course</div>
        <div class="value">${data.student.courseName}</div>
      </div>
      <div class="detail-row">
        <div class="label">Batch Day</div>
        <div class="value" style="text-transform: capitalize;">${data.student.batchDay ? data.student.batchDay.join(", ") : "N/A"}</div>
      </div>
      <div class="detail-row">
        <div class="label">Joining Date</div>
        <div class="value">${data.student.joiningDate ? new Date(data.student.joiningDate).toLocaleDateString("en-GB") : "N/A"}</div>
      </div>
      <div class="detail-row">
        <div class="label">Personal Contact</div>
        <div class="value">${data.student.personalContact || "N/A"}</div>
      </div>
      <div class="detail-row">
        <div class="label">Parent Contact</div>
        <div class="value">${data.student.parentContact || "N/A"}</div>
      </div>
    </div>
  </div>

  <!-- STATISTICS SECTION -->
  <div class="section">
    <div class="section-title">📈 Statistics</div>
    <div class="stats">
      <div class="stat-box">
        <div class="stat-value">${data.attendancePercentage}%</div>
        <div class="stat-label">Attendance (${data.actualPresentDays}/${data.expectedAttendanceDays} days)</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${data.attendance.length}</div>
        <div class="stat-label">Recorded Days</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${data.exams.length}</div>
        <div class="stat-label">Exams Taken</div>
      </div>
    </div>
  </div>

  <!-- ATTENDANCE SECTION -->
  <div class="section">
    <div class="section-title">📋 Attendance Record</div>
    ${
      data.attendance.length > 0
        ? `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${data.attendance
            .map((att) => {
              const date = new Date(att.date).toLocaleDateString("en-GB");
              const statusClass = att.present ? "present" : "absent";
              const statusText = att.present ? "Present" : "Absent";
              return `<tr><td>${date}</td><td class="${statusClass}">${statusText}</td></tr>`;
            })
            .join("")}
        </tbody>
      </table>
    `
        : '<p style="color: #999;">No attendance records found</p>'
    }
  </div>

  <!-- EXAM RESULTS SECTION -->
  <div class="section">
    <div class="section-title">📝 Exam Results</div>
    ${
      data.exams.length > 0
        ? `
      <table>
        <thead>
          <tr>
            <th>Chapter</th>
            <th>Score</th>
            <th>Completed Date</th>
          </tr>
        </thead>
        <tbody>
          ${data.exams
            .map((exam) => {
              const date = exam.completedAt
                ? new Date(exam.completedAt).toLocaleDateString("en-GB")
                : "N/A";
              return `<tr><td>${exam.chapter}</td><td style="text-align:center;"><strong>${exam.score.toFixed(2)}%</strong></td><td>${date}</td></tr>`;
            })
            .join("")}
        </tbody>
      </table>
    `
        : '<p style="color: #999;">No exam records found</p>'
    }
  </div>

  <div class="footer">
    <p>This is an automatically generated report. For more information, contact your teacher.</p>
  </div>
</body>
</html>`;

      downloadHTML(
        html,
        `student-report-${student.name.replace(/\s+/g, "_")}-${new Date().toISOString().split("T")[0]}.html`,
      );
      toast.success("Student details exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error(err.response?.data || "Failed to export student details");
    }
  };

  const fetchTeacherExams = async () => {
    try {
      const res = await axios.get(`${API}/exams/teacher`, {
        headers: { Authorization: token },
      });
      setTeacherExams(res.data);
    } catch (err) {
      toast.error("Failed to load exams");
    }
  };

  const openExamResults = async (exam) => {
    try {
      setResultsExam(exam);
      setShowResultsModal(true);
      setResultsLoading(true);
      const res = await axios.get(`${API}/exams/results/${exam._id}`, {
        headers: { Authorization: token },
      });
      setExamResults(res.data || []);
    } catch (err) {
      toast.error("Failed to load results");
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    // fetch profile first
    fetchProfile();
    Promise.all([fetchStudents(), fetchTeacherExams()]).finally(() =>
      setLoading(false),
    );
  }, []);

  useEffect(() => {
    if (!token) return;
    if (students.length === 0) return;
    fetchAttendanceForDate(attendanceDate);
  }, [attendanceDate, students.length]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API}/users/profile`, {
        headers: { Authorization: token },
      });
      setTeacherName(res.data.name || "Teacher");
      setTeacherForm({
        name: res.data.name || "",
        email: res.data.email || "",
        personalContact: res.data.personalContact || "",
        parentContact: res.data.parentContact || "",
      });
    } catch (err) {
      console.error("Profile fetch error", err);
    }
  };

  // TASK HELPERS
  const fetchTasks = async (studentId = "") => {
    try {
      setLoadingTasks(true);
      let url = `${API}/teacher/tasks`;
      if (studentId) url += `?studentId=${studentId}`;
      const res = await axios.get(url, { headers: { Authorization: token } });
      setTasks(res.data || []);
    } catch (err) {
      toast.error("Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  };

  const createTask = async () => {
    if (!taskForm.studentId || !taskForm.title) {
      toast.error("Please pick a student and give the task a title");
      return;
    }
    try {
      const res = await axios.post(`${API}/teacher/tasks`, taskForm, {
        headers: { Authorization: token },
      });
      toast.success("Task created");
      setTaskForm({ studentId: "", title: "", description: "", dueDate: "" });
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data || "Failed to create task");
    }
  };

  const openReview = (task) => {
    setReviewingTask(task);
    setReviewFeedback(task.review?.feedback || "");
    setReviewMark(task.review?.mark ?? "");
  };

  const submitReview = async () => {
    if (!reviewingTask) return;
    try {
      const res = await axios.post(
        `${API}/teacher/tasks/${reviewingTask._id}/review`,
        {
          feedback: reviewFeedback,
          mark: reviewMark ? Number(reviewMark) : undefined,
        },
        { headers: { Authorization: token } },
      );
      toast.success("Review saved");
      setReviewingTask(null);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data || "Failed to save review");
    }
  };

  const fetchDailyReport = async (date) => {
    try {
      setLoadingReport(true);
      const res = await axios.get(`${API}/teacher/daily-report`, {
        params: { date },
        headers: { Authorization: token },
      });
      const existing = res.data?.timeSlots?.length
        ? res.data.timeSlots.map((s) => ({
            ...s,
            description: s.description || "",
          }))
        : buildDefaultReportSlots();
      setReportSlots(existing);
      setReportDescription(res.data?.description || "");
    } catch (err) {
      toast.error("Failed to load daily report");
      setReportSlots(buildDefaultReportSlots());
      setReportDescription("");
    } finally {
      setLoadingReport(false);
    }
  };

  const saveDailyReport = async () => {
    try {
      setSavingReport(true);
      await axios.post(
        `${API}/teacher/daily-report`,
        {
          date: reportDate,
          timeSlots: reportSlots,
          description: reportDescription,
        },
        { headers: { Authorization: token } },
      );
      toast.success("Daily report saved!");
    } catch (err) {
      toast.error(err.response?.data || "Failed to save daily report");
    } finally {
      setSavingReport(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    if (activeTab === "report") {
      // ensure both state slices are in sync – the button above still hits
      // the attendance-report loader, so refresh that too.
      fetchDailyReport(reportDate);
      fetchAttendanceReport(reportDate);
    }
    if (activeTab === "tasks") {
      fetchTasks();
    }
  }, [activeTab, reportDate]);

  const markAttendance = async () => {
    const studentsToSave = students
      .filter((s) => s.attendance?.status)
      .map((s) => ({
        studentId: s._id,
        status: s.attendance.status,
        topicCovered: s.attendance.topicCovered || "",
        reason: s.attendance.reason || "",
      }));

    if (studentsToSave.length === 0) {
      toast.error("Please mark status for at least one student");
      return;
    }

    try {
      setSavingAttendance(true);
      await axios.post(
        `${API}/teacher/attendance/mark`,
        {
          date: attendanceDate,
          students: studentsToSave,
        },
        { headers: { Authorization: token } },
      );
      toast.success("Attendance saved successfully!");
      fetchAttendanceForDate(attendanceDate);
    } catch (err) {
      toast.error("Failed to save attendance");
    } finally {
      setSavingAttendance(false);
    }
  };

  const updateStudentAttendance = (studentId, field, value) => {
    setStudents(
      students.map((student) =>
        student._id === studentId
          ? {
              ...student,
              attendance: {
                ...student.attendance,
                [field]: value,
                // automatically toggle present based on status if we update status
                ...(field === "status" ? { present: value === "Present" } : {}),
              },
            }
          : student,
      ),
    );
  };

  const addQuestion = () => {
    setExamForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { question: "", options: ["", "", "", ""], correctAnswer: 0 },
      ],
    }));
  };

  const handleExamSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/exams/create`, examForm, {
        headers: { Authorization: token },
      });
      toast.success("Exam created successfully!");
      setShowExamModal(false);
      setExamForm({
        chapter: "",
        questions: [
          { question: "", options: ["", "", "", ""], correctAnswer: 0 },
        ],
      });
      fetchTeacherExams();
    } catch (err) {
      toast.error(err.response?.data || "Failed to create exam");
    }
  };

  const enableStudentsForExam = (examId) => {
    setSelectedExam(examId);
    setShowEnableModal(true);
  };

  const confirmEnableStudents = async () => {
    try {
      await axios.post(
        `${API}/exams/enable/${selectedExam}`,
        {
          studentIds: selectedStudents,
        },
        { headers: { Authorization: token } },
      );
      toast.success("Students enabled for exam!");
      setShowEnableModal(false);
      setSelectedStudents([]);
      fetchTeacherExams();
    } catch (err) {
      toast.error("Failed to enable students");
    }
  };

  const openStudentModal = (student, edit = false) => {
    setSelectedStudent(student);
    setStudentForm({ ...student });
    setEditingStudent(edit);
    setShowStudentModal(true);
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.courseName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div
        className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gradient-to-br from-green-50 to-emerald-50"} flex items-center justify-center p-8`}
      >
        <div
          className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-green-200"} backdrop-blur-xl border rounded-3xl p-12 text-center max-w-md w-full`}
        >
          <div
            className={`w-20 h-20 border-4 ${darkMode ? "border-green-500 border-t-transparent" : "border-green-600 border-t-transparent"} rounded-full animate-spin mx-auto mb-6`}
          ></div>
          <p
            className={`text-2xl font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}
          >
            Loading your dashboard...
          </p>
          <p className={`mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Connecting to database
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" : "bg-gradient-to-br from-green-50 via-emerald-50 to-green-50"} p-4 sm:p-8 ${darkMode ? "text-gray-100" : "text-gray-900"}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div
          className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-green-200"} backdrop-blur-xl border rounded-3xl p-8 mb-8 shadow-2xl`}
        >
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-2xl ${darkMode ? "bg-gray-700" : "bg-green-100"}`}
              >
                <img
                  src={logoImage}
                  alt="Logo"
                  className={`h-16 w-16 object-contain ${darkMode ? "invert brightness-0 brightness-100" : ""}`}
                />
              </div>
              <div>
                <h1
                  className={`text-4xl lg:text-5xl font-black ${darkMode ? "bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent" : "bg-gradient-to-r from-green-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent"} mb-2 capitalize`}
                >
                  {teacherName}'s Dashboard
                </h1>
                <p
                  className={`text-xl ${darkMode ? "text-gray-400" : "text-gray-700"}`}
                >
                  No. of students: {students.length}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const newMode = !darkMode;
                  setDarkMode(newMode);
                  localStorage.setItem("theme", newMode ? "dark" : "light");
                }}
                className={`px-4 py-3 ${darkMode ? "bg-gray-700 hover:bg-gray-600 border-gray-600" : "bg-green-100 hover:bg-green-200 border-green-300"} border rounded-2xl ${darkMode ? "text-yellow-400" : "text-green-700"} transition-all flex items-center gap-2`}
                title={darkMode ? "Light mode" : "Dark mode"}
              >
                {darkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  window.location.href = "/";
                }}
                className={`px-8 py-3 ${darkMode ? "bg-red-900/30 hover:bg-red-900/50 border-red-700" : "bg-red-100 hover:bg-red-200 border-red-300"} border rounded-2xl ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-700 hover:text-red-900"} transition-all flex items-center gap-2`}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div
          className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-green-200"} backdrop-blur-xl border rounded-3xl p-2 mb-8 shadow-xl`}
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { id: "students", icon: "👥", label: "Students" },
              { id: "attendance", icon: "📋", label: "Attendance" },
              { id: "report", icon: "📊", label: "Daily Report" },
              { id: "tasks", icon: "📝", label: "Tasks" },
              { id: "exams", icon: "📝", label: "Chapter Exams" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-6 rounded-2xl font-bold text-lg transition-all flex flex-col items-center gap-2 ${
                  activeTab === tab.id
                    ? darkMode
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-2xl scale-105"
                      : "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-2xl scale-105"
                    : darkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white hover:scale-105"
                      : "bg-green-100 hover:bg-green-200 text-gray-700 hover:text-gray-900 hover:scale-105"
                }`}
              >
                <span className="text-2xl">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* STUDENTS TAB */}
        {activeTab === "students" && (
          <div
            className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-green-200"} backdrop-blur-xl border rounded-3xl p-8 shadow-2xl`}
          >
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`flex-1 p-4 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-green-50 border-green-300 text-gray-900 placeholder-gray-600"} border rounded-2xl focus:ring-4 ${darkMode ? "focus:ring-green-600/50" : "focus:ring-green-400/50"}`}
              />
            </div>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <p
                  className={`text-2xl mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  No students found
                </p>
                <button
                  onClick={fetchStudents}
                  className={`${darkMode ? "bg-green-700 hover:bg-green-600" : "bg-green-600 hover:bg-green-700"} text-white px-8 py-3 rounded-2xl font-bold capitalize`}
                >
                  Refresh Students
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      className={`${darkMode ? "bg-gray-700" : "bg-green-100"} rounded-2xl`}
                    >
                      <th
                        className={`p-4 rounded-l-2xl ${darkMode ? "text-green-400" : "text-green-700"}`}
                      >
                        Name
                      </th>
                      <th
                        className={`p-4 ${darkMode ? "text-green-400" : "text-green-700"}`}
                      >
                        Course
                      </th>
                      <th
                        className={`p-4 rounded-r-2xl ${darkMode ? "text-green-400" : "text-green-700"}`}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr
                        key={student._id}
                        className={`${darkMode ? "border-gray-700 hover:bg-gray-700/50" : "border-green-100 hover:bg-green-50"} border-b`}
                      >
                        <td
                          className={`p-4 font-semibold capitalize ${darkMode ? "text-gray-300" : "text-gray-900"}`}
                        >
                          {student.name}
                        </td>
                        <td
                          className={`p-4 capitalize ${darkMode ? "text-gray-300" : "text-gray-900"}`}
                        >
                          {student.courseName}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openStudentModal(student)}
                              className={`p-2 ${darkMode ? "bg-blue-900/50 hover:bg-blue-900/70 text-blue-400" : "bg-blue-100 hover:bg-blue-200 text-blue-600"} rounded-xl`}
                            >
                              <FaEye size={16} />
                            </button>
                            <button
                              onClick={() => exportStudentFullDetails(student)}
                              className={`p-2 ${darkMode ? "bg-red-900/50 hover:bg-red-900/70 text-red-400" : "bg-red-100 hover:bg-red-200 text-red-600"} rounded-xl`}
                              title="Export student full details"
                            >
                              <FaDownload size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            {/* Top Controls: Mark Attendance & Export */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Attendance Controls */}
              <div
                className={`p-6 rounded-3xl shadow-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-green-200"} backdrop-blur-xl`}
              >
                <h3
                  className={`text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-600"}`}
                >
                  Daily Attendance
                </h3>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label
                      className={`block text-sm font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-green-500/50 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-green-50 border-green-300 text-gray-900"}`}
                    />
                  </div>
                  <button
                    onClick={() => markAttendance()}
                    disabled={savingAttendance || students.length === 0}
                    className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-green-600 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {savingAttendance
                      ? "Saving..."
                      : `Save Attendance (${students.filter((s) => s.attendance?.status).length})`}
                  </button>
                </div>
                {loadingAttendance && (
                  <div
                    className={`mt-4 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Loading attendance...
                  </div>
                )}
              </div>

              {/* Export Controls */}
              <div
                className={`p-6 rounded-3xl shadow-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-blue-200"} backdrop-blur-xl`}
              >
                <h3
                  className={`text-xl font-bold mb-4 ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                >
                  Export Reports
                </h3>
                <div className="flex flex-col gap-4">
                  {/* Single Day Export */}
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Export selected day:
                    </span>
                    <button
                      onClick={() => exportAttendanceOnlyCSV(attendanceDate)}
                      disabled={students.length === 0}
                      className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl shadow transition-all flex items-center gap-2 text-sm"
                    >
                      <FaFilePdf /> Export Day
                    </button>
                  </div>
                  <hr
                    className={`${darkMode ? "border-gray-700" : "border-gray-200"}`}
                  />
                  {/* Range Export */}
                  <div className="flex flex-col md:flex-row gap-3 items-end">
                    <div className="flex-1">
                      <label
                        className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                      >
                        From
                      </label>
                      <input
                        type="date"
                        value={attendanceFrom}
                        onChange={(e) => setAttendanceFrom(e.target.value)}
                        className={`w-full p-2 text-sm rounded-lg border focus:ring-2 focus:ring-blue-500/50 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-blue-50 border-blue-200 text-gray-900"}`}
                      />
                    </div>
                    <div className="flex-1">
                      <label
                        className={`block text-xs font-semibold mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                      >
                        To
                      </label>
                      <input
                        type="date"
                        value={attendanceTo}
                        onChange={(e) => setAttendanceTo(e.target.value)}
                        className={`w-full p-2 text-sm rounded-lg border focus:ring-2 focus:ring-blue-500/50 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-blue-50 border-blue-200 text-gray-900"}`}
                      />
                    </div>
                    <button
                      onClick={exportAttendanceRangeCSV}
                      disabled={
                        !attendanceFrom ||
                        !attendanceTo ||
                        students.length === 0
                      }
                      className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <FaFilePdf /> Export Range
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Students Grid */}
            <div
              className={`p-8 rounded-3xl shadow-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-green-200"} backdrop-blur-xl`}
            >
              <h3
                className={`text-2xl font-bold mb-6 ${darkMode ? "text-white" : "text-gray-800"}`}
              >
                Student Roster
              </h3>

              {(() => {
                const attendanceDayName = new Date(attendanceDate)
                  .toLocaleDateString("en-US", { weekday: "long" })
                  .toLowerCase();
                const eligibleStudents = filteredStudents.filter(
                  (s) =>
                    s.batchDay &&
                    s.batchDay
                      .map((d) => d.toLowerCase())
                      .includes(attendanceDayName),
                );
                const notEligibleStudents = filteredStudents.filter(
                  (s) =>
                    !s.batchDay ||
                    !s.batchDay
                      .map((d) => d.toLowerCase())
                      .includes(attendanceDayName),
                );

                const renderStudentCard = (student) => (
                  <div
                    key={student._id}
                    className={`backdrop-blur-xl border p-6 rounded-2xl transition-all ${darkMode ? "bg-white/5 border-white/10" : "bg-blue-50 border-blue-200"}`}
                  >
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center text-xl font-bold">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-bold text-xl mb-2 text-center capitalize">
                      {student.name}
                    </h3>
                    <p
                      className={`mb-4 text-center capitalize ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {student.courseName}
                    </p>
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-center gap-4 bg-black/10 p-2 rounded-xl">
                        <label
                          className={`flex items-center gap-2 cursor-pointer text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
                        >
                          <input
                            type="radio"
                            name={`status-${student._id}`}
                            checked={student.attendance?.status === "Present"}
                            onChange={() =>
                              updateStudentAttendance(
                                student._id,
                                "status",
                                "Present",
                              )
                            }
                            className="accent-green-500 w-4 h-4"
                          />{" "}
                          Present
                        </label>
                        <label
                          className={`flex items-center gap-2 cursor-pointer text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
                        >
                          <input
                            type="radio"
                            name={`status-${student._id}`}
                            checked={student.attendance?.status === "Absent"}
                            onChange={() =>
                              updateStudentAttendance(
                                student._id,
                                "status",
                                "Absent",
                              )
                            }
                            className="accent-red-500 w-4 h-4"
                          />{" "}
                          Absent
                        </label>
                        <label
                          className={`flex items-center gap-2 cursor-pointer text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
                        >
                          <input
                            type="radio"
                            name={`status-${student._id}`}
                            checked={student.attendance?.status === "Leave"}
                            onChange={() =>
                              updateStudentAttendance(
                                student._id,
                                "status",
                                "Leave",
                              )
                            }
                            className="accent-blue-500 w-4 h-4"
                          />{" "}
                          Leave
                        </label>
                      </div>

                      {student.attendance?.status === "Present" && (
                        <input
                          type="text"
                          placeholder="Topic Covered"
                          value={student.attendance?.topicCovered || ""}
                          onChange={(e) =>
                            updateStudentAttendance(
                              student._id,
                              "topicCovered",
                              e.target.value,
                            )
                          }
                          className={`w-full p-2 rounded-lg border focus:ring-2 focus:ring-green-400 focus:outline-none ${darkMode ? "bg-white/10 border-white/20 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"}`}
                        />
                      )}
                      {(student.attendance?.status === "Absent" ||
                        student.attendance?.status === "Leave") && (
                        <input
                          type="text"
                          placeholder="Reason"
                          value={student.attendance?.reason || ""}
                          onChange={(e) =>
                            updateStudentAttendance(
                              student._id,
                              "reason",
                              e.target.value,
                            )
                          }
                          className={`w-full p-2 rounded-lg border focus:ring-2 focus:ring-red-400 focus:outline-none ${darkMode ? "bg-white/10 border-white/20 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"}`}
                        />
                      )}

                      <button
                        onClick={() => exportSingleStudentCSV(student)}
                        className={`w-full py-2 px-4 rounded-xl flex items-center justify-center gap-2 mt-2 ${darkMode ? "bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-white" : "bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700"}`}
                      >
                        <FaFilePdf /> Export
                      </button>
                    </div>
                  </div>
                );

                return (
                  <>
                    <h4
                      className={`text-xl font-bold mb-4 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}
                    >
                      Eligible Students ({eligibleStudents.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {eligibleStudents.map(renderStudentCard)}
                    </div>

                    {notEligibleStudents.length > 0 && (
                      <div className="mt-12">
                        <button
                          onClick={() =>
                            setShowNonBatchStudents(!showNonBatchStudents)
                          }
                          className={`w-full py-4 px-6 rounded-2xl font-bold flex items-center justify-between transition-all ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-800"}`}
                        >
                          <span>
                            Non-Batch Day Students ({notEligibleStudents.length}
                            )
                          </span>
                          <span>{showNonBatchStudents ? "▲" : "▼"}</span>
                        </button>
                        {showNonBatchStudents && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                            {notEligibleStudents.map(renderStudentCard)}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* DAILY REPORT TAB */}
        {activeTab === "report" && (
          <div
            className={`backdrop-blur-xl rounded-3xl p-8 shadow-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-blue-200"}`}
          >
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-8">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Daily Report
              </h3>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className={`p-4 rounded-2xl border focus:ring-4 focus:ring-emerald-500/50 ${darkMode ? "bg-white/10 border-white/20 text-white placeholder-gray-400" : "bg-white border-blue-300 text-gray-900"}`}
              />
              <div className="flex flex-col md:flex-row gap-2">
                <button
                  onClick={() => exportDailyReportCSV(reportDate)}
                  disabled={reportSlots.length === 0 && !reportDescription}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-3 px-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                >
                  <FaFilePdf /> Export Report
                </button>
                <button
                  onClick={() => exportAttendanceToCSV(reportDate)}
                  disabled={students.length === 0}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white font-bold py-3 px-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                >
                  <FaFilePdf /> Export Combined
                </button>
              </div>
            </div>

            {loadingReport ? (
              <div
                className={`text-center py-12 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                Loading report...
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-8">
                  {(reportSlots.length
                    ? reportSlots
                    : buildDefaultReportSlots()
                  ).map((ts, idx) => (
                    <div
                      key={ts.slot}
                      className={`p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/20" : "bg-emerald-50 border-emerald-200"}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={!!ts.completed}
                            onChange={(e) => {
                              const next = [
                                ...(reportSlots.length
                                  ? reportSlots
                                  : buildDefaultReportSlots()),
                              ];
                              next[idx] = {
                                ...next[idx],
                                completed: e.target.checked,
                              };
                              setReportSlots(next);
                            }}
                            className="w-5 h-5 rounded"
                          />
                          <span className="font-semibold">{ts.slot}</span>
                        </label>
                        <input
                          type="text"
                          value={ts.description || ""}
                          onChange={(e) => {
                            const next = [
                              ...(reportSlots.length
                                ? reportSlots
                                : buildDefaultReportSlots()),
                            ];
                            next[idx] = {
                              ...next[idx],
                              description: e.target.value,
                            };
                            setReportSlots(next);
                          }}
                          className={`flex-1 p-3 rounded-xl border focus:ring-2 focus:ring-emerald-500/50 ${darkMode ? "bg-white/10 border-white/20 text-white placeholder-gray-400" : "bg-emerald-50 border-emerald-300 text-gray-900 placeholder-gray-600"}`}
                          placeholder="Description for this time (e.g., Topic covered, Students details)"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-8">
                  <label
                    className={`block text-lg font-semibold mb-3 ${darkMode ? "" : "text-gray-900"}`}
                  >
                    Overall Notes (optional)
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    rows={5}
                    className={`w-full p-4 rounded-2xl border focus:ring-4 focus:ring-emerald-500/50 ${darkMode ? "bg-white/10 border-white/20 text-white placeholder-gray-400" : "bg-emerald-50 border-emerald-300 text-gray-900 placeholder-gray-600"}`}
                    placeholder="Any extra notes for the day..."
                  />
                </div>

                <button
                  onClick={saveDailyReport}
                  disabled={savingReport}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 disabled:opacity-50 text-white font-bold py-4 px-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                >
                  {savingReport ? "Saving..." : "Save Daily Report"}
                </button>
              </>
            )}
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === "tasks" && (
          <div
            className={`backdrop-blur-xl rounded-3xl p-8 shadow-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-blue-200"}`}
          >
            <h3 className="text-3xl font-bold mb-6">Tasks</h3>
            {/* create task form */}
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={taskForm.studentId}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, studentId: e.target.value })
                  }
                  className={`p-3 rounded-2xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-blue-300 text-gray-900"}`}
                >
                  <option value="">Choose student</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Title"
                  value={taskForm.title}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, title: e.target.value })
                  }
                  className={`p-3 rounded-2xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-blue-300 text-gray-900"}`}
                />
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, dueDate: e.target.value })
                  }
                  className={`p-3 rounded-2xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-blue-300 text-gray-900"}`}
                />
              </div>
              <textarea
                rows={3}
                placeholder="Description (optional)"
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, description: e.target.value })
                }
                className={`w-full p-3 rounded-2xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-blue-300 text-gray-900"}`}
              />
              <button
                onClick={createTask}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-2xl shadow-xl transition-all"
              >
                Add Task
              </button>
            </div>

            {/* filter tasks */}
            <div className="mb-4 flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Filter:</label>
                <select
                  value={taskForm.studentId}
                  onChange={(e) => {
                    const sid = e.target.value;
                    setTaskForm({ ...taskForm, studentId: sid });
                    fetchTasks(sid);
                  }}
                  className={`p-2 rounded-2xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-blue-300 text-gray-900"}`}
                >
                  <option value="">All students</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Search:</label>
                <input
                  type="text"
                  placeholder="Search tasks by title..."
                  value={taskSearchTerm}
                  onChange={(e) => setTaskSearchTerm(e.target.value)}
                  className={`p-2 rounded-2xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-blue-300 text-gray-900"}`}
                />
              </div>

              {/* Export Controls */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">From Date:</label>
                  <input
                    type="date"
                    value={taskFromDate}
                    onChange={(e) => setTaskFromDate(e.target.value)}
                    className={`p-2 rounded-2xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-blue-300 text-gray-900"}`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">To Date:</label>
                  <input
                    type="date"
                    value={taskToDate}
                    onChange={(e) => setTaskToDate(e.target.value)}
                    className={`p-2 rounded-2xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-blue-300 text-gray-900"}`}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      exportTasksWithAttendance(
                        taskFromDate,
                        taskToDate,
                        taskForm.studentId,
                      )
                    }
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-2xl shadow-xl transition-all flex items-center gap-2"
                  >
                    <FaFilePdf /> Export Tasks & Attendance
                  </button>
                </div>
              </div>
            </div>
            {/* list tasks */}
            {loadingTasks ? (
              <div
                className={`text-center py-8 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                Loading tasks...
              </div>
            ) : tasks.length === 0 ? (
              <div
                className={`text-center py-8 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                No tasks yet
              </div>
            ) : (
              <div className="space-y-4">
                {tasks
                  .filter(
                    (task) =>
                      task.title
                        .toLowerCase()
                        .includes(taskSearchTerm.toLowerCase()) ||
                      students
                        .find((s) => s._id === task.studentId)
                        ?.name.toLowerCase()
                        .includes(taskSearchTerm.toLowerCase()),
                  )
                  .map((task) => (
                    <div
                      key={task._id}
                      className={`p-4 border rounded-2xl ${darkMode ? "bg-white/5 border-white/20" : "bg-gray-50 border-gray-200"}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold">{task.title}</div>
                          <div className="text-sm text-gray-400">
                            Due: {new Date(task.dueDate)?.toLocaleDateString()}
                          </div>
                          <div className="text-sm">
                            Assigned to:{" "}
                            {students.find((s) => s._id === task.studentId)
                              ?.name || ""}
                          </div>
                          {task.submission?.submittedAt && (
                            <div className="text-sm text-green-400">
                              Submitted:{" "}
                              {new Date(
                                task.submission.submittedAt,
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {task.review?.mark && (
                            <span className="flex items-center gap-1 text-yellow-400">
                              <span className="text-sm">
                                Mark: {task.review.mark}
                              </span>
                            </span>
                          )}
                          {task.submission?.submittedAt ? (
                            <span className="text-green-400 text-sm">
                              Submitted
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              Pending
                            </span>
                          )}
                          <button
                            onClick={() =>
                              exportTasksWithAttendance(
                                task.dueDate,
                                task.dueDate,
                                task.studentId,
                              )
                            }
                            className="bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold py-1 px-3 rounded-xl shadow-lg transition-all flex items-center gap-1"
                            title={`Export ${students.find((s) => s._id === task.studentId)?.name || ""}'s tasks and attendance`}
                          >
                            <FaFilePdf size={12} /> Export
                          </button>
                        </div>
                      </div>

                      {/* Submission Details */}
                      {task.submission && (
                        <div className="mt-4 space-y-2">
                          {task.submission.description && (
                            <div className="p-2 bg-white/10 rounded">
                              <strong>Description:</strong>{" "}
                              {task.submission.description}
                            </div>
                          )}
                          {task.submission.code && (
                            <div className="p-2 bg-white/10 rounded">
                              <strong>Code:</strong>
                              <pre className="mt-1 whitespace-pre-wrap text-sm">
                                {task.submission.code}
                              </pre>
                            </div>
                          )}
                          {task.submission.screenshots &&
                            Array.isArray(task.submission.screenshots) && (
                              <div className="p-2 bg-white/10 rounded">
                                <strong>Screenshots:</strong>
                                <div className="mt-2 space-y-2">
                                  {task.submission.screenshots.map(
                                    (screenshot, index) => (
                                      <div
                                        key={index}
                                        className="flex flex-col items-start"
                                      >
                                        {screenshot.match(
                                          /\.(jpg|jpeg|png|gif|webp)$/i,
                                        ) ? (
                                          <img
                                            src={`${API}${screenshot}`}
                                            alt={`File ${index + 1}`}
                                            className="max-w-full h-auto rounded"
                                          />
                                        ) : (
                                          <div className="p-3 bg-white/20 rounded flex items-center gap-2 mb-2 w-full">
                                            📄 Document File
                                          </div>
                                        )}
                                        <a
                                          href={`${API}${screenshot}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-400 underline mt-1"
                                        >
                                          View/Download File {index + 1}
                                        </a>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                          {task.submission.screenshot &&
                            !Array.isArray(task.submission.screenshot) && (
                              <div className="p-2 bg-white/10 rounded">
                                <strong>Screenshot:</strong>
                                <br />
                                {task.submission.screenshot.match(
                                  /\.(jpg|jpeg|png|gif|webp)$/i,
                                ) ? (
                                  <img
                                    src={`${API}${task.submission.screenshot}`}
                                    alt="File"
                                    className="max-w-full h-auto mt-2 rounded"
                                  />
                                ) : (
                                  <div className="p-3 bg-white/20 rounded flex items-center gap-2 mt-2 w-full">
                                    📄 Document File
                                  </div>
                                )}
                                <a
                                  href={`${API}${task.submission.screenshot}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 underline mt-1"
                                >
                                  View/Download File
                                </a>
                              </div>
                            )}
                          {task.submission.gitLink && (
                            <div className="p-2 bg-white/10 rounded">
                              <strong>Git Link:</strong>{" "}
                              <a
                                href={task.submission.gitLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 underline"
                              >
                                {task.submission.gitLink}
                              </a>
                            </div>
                          )}
                          {task.submission.linkedinLink && (
                            <div className="p-2 bg-white/10 rounded">
                              <strong>LinkedIn Link:</strong>{" "}
                              <a
                                href={task.submission.linkedinLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 underline"
                              >
                                {task.submission.linkedinLink}
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Review Section */}
                      {task.review?.feedback && (
                        <div className="mt-2 p-2 bg-green-100 rounded text-green-800">
                          <strong>Feedback:</strong> {task.review.feedback}
                        </div>
                      )}

                      {(task.review || task.submission) && (
                        <button
                          onClick={() => openReview(task)}
                          className="mt-2 text-blue-500 underline hover:text-blue-700"
                        >
                          {task.review ? "Update Review" : "Add Review"}
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* review modal */}
            {reviewingTask && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div
                  className={`${darkMode ? "glass-card" : "bg-white border border-gray-200"} p-8 w-full max-w-lg rounded-3xl shadow-2xl`}
                >
                  <h3 className="text-2xl font-bold mb-4">
                    Review: {reviewingTask.title}
                  </h3>
                  {reviewingTask.submission?.content && (
                    <div className="mb-4">
                      <strong>Submission:</strong>
                      <p className="whitespace-pre-wrap">
                        {reviewingTask.submission.content}
                      </p>
                    </div>
                  )}
                  <textarea
                    rows={3}
                    placeholder="Feedback (optional)"
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    className="w-full p-3 rounded-2xl border mb-4"
                  />
                  <input
                    type="number"
                    placeholder="Mark (numeric)"
                    value={reviewMark}
                    onChange={(e) => setReviewMark(e.target.value)}
                    className="w-full p-3 rounded-2xl border mb-4"
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={submitReview}
                      className="bg-blue-500 text-white px-6 py-3 rounded-xl"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setReviewingTask(null)}
                      className="bg-gray-300 px-6 py-3 rounded-xl"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EXAMS TAB */}
        {activeTab === "exams" && (
          <div
            className={`backdrop-blur-xl rounded-3xl p-8 shadow-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-blue-200"}`}
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Chapter Exams
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Search:</label>
                  <input
                    type="text"
                    placeholder="Search exams by chapter..."
                    value={examSearchTerm}
                    onChange={(e) => setExamSearchTerm(e.target.value)}
                    className={`p-2 rounded-2xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-blue-300 text-gray-900"}`}
                  />
                </div>
                <button
                  onClick={() => setShowExamModal(true)}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 px-8 py-4 rounded-2xl font-bold text-lg glow shadow-2xl transition-all"
                >
                  ➕ Create Exam
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teacherExams
                .filter((exam) =>
                  exam.chapter
                    .toLowerCase()
                    .includes(examSearchTerm.toLowerCase()),
                )
                .map((exam) => (
                  <div
                    key={exam._id}
                    className={`p-6 rounded-3xl hover:scale-105 transition-all ${darkMode ? "glass-card" : "bg-white border border-blue-200 shadow-md"}`}
                  >
                    <h4 className="text-xl font-bold mb-2">{exam.chapter}</h4>
                    <p
                      className={`mb-4 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}
                    >
                      {exam.questions.length} Questions
                    </p>
                    <p
                      className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {exam.enabledStudents.length} Students Enabled
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => enableStudentsForExam(exam._id)}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl font-semibold text-sm"
                      >
                        Enable Students
                      </button>
                      <button
                        onClick={() => openExamResults(exam)}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-xl font-semibold text-sm"
                      >
                        View Results
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* CREATE EXAM MODAL */}
      {showExamModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl`}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                Create Chapter Exam
              </h2>
              <button
                onClick={() => setShowExamModal(false)}
                className="text-4xl hover:text-red-400 p-3 rounded-2xl hover:bg-white/10 transition-all"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleExamSubmit}>
              <div className="mb-8">
                <label
                  className={`block text-xl font-semibold mb-4 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}
                >
                  Chapter Name
                </label>
                <input
                  type="text"
                  value={examForm.chapter}
                  onChange={(e) =>
                    setExamForm({ ...examForm, chapter: e.target.value })
                  }
                  className={`w-full p-6 text-xl rounded-3xl border-2 focus:ring-4 focus:ring-indigo-400/50 ${darkMode ? "bg-white/10 border-white/20" : "bg-indigo-50 border-indigo-300 text-gray-900"}`}
                  required
                />
              </div>

              <div className="space-y-6">
                {examForm.questions.map((q, qIndex) => (
                  <div
                    key={qIndex}
                    className={`p-6 rounded-3xl ${darkMode ? "glass-card" : "bg-white border border-blue-200"}`}
                  >
                    <h4 className="font-bold text-xl mb-4">
                      Question {qIndex + 1}
                    </h4>
                    <input
                      type="text"
                      placeholder="Enter question..."
                      value={q.question}
                      onChange={(e) => {
                        const newQuestions = [...examForm.questions];
                        newQuestions[qIndex].question = e.target.value;
                        setExamForm({ ...examForm, questions: newQuestions });
                      }}
                      className={`w-full p-4 mb-4 rounded-2xl border ${darkMode ? "bg-white/10 border-white/20" : "bg-blue-50 border-blue-300 text-gray-900"}`}
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      {q.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-3">
                          <input
                            type="radio"
                            id={`q${qIndex}o${oIndex}`}
                            checked={q.correctAnswer === oIndex}
                            onChange={() => {
                              const newQuestions = [...examForm.questions];
                              newQuestions[qIndex].correctAnswer = oIndex;
                              setExamForm({
                                ...examForm,
                                questions: newQuestions,
                              });
                            }}
                            className="w-5 h-5 text-indigo-600"
                          />
                          <label
                            htmlFor={`q${qIndex}o${oIndex}`}
                            className={`flex-1 p-3 rounded-xl border ${darkMode ? "bg-white/5 border-white/20" : "bg-indigo-100 border-indigo-300"}`}
                          >
                            {String.fromCharCode(65 + oIndex)}.{" "}
                            {option || `Option ${oIndex + 1}`}
                          </label>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newQuestions = [...examForm.questions];
                              newQuestions[qIndex].options[oIndex] =
                                e.target.value;
                              setExamForm({
                                ...examForm,
                                questions: newQuestions,
                              });
                            }}
                            className={`flex-1 p-3 rounded-xl border focus:ring-2 focus:ring-indigo-400/50 ${darkMode ? "bg-white/5 border-white/20" : "bg-indigo-50 border-indigo-300 text-gray-900"}`}
                          />
                        </div>
                      ))}
                    </div>
                    {examForm.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setExamForm((prev) => ({
                            ...prev,
                            questions: prev.questions.filter(
                              (_, i) => i !== qIndex,
                            ),
                          }));
                        }}
                        className={`mt-4 text-sm ${darkMode ? "text-red-300 hover:text-red-200" : "text-red-600 hover:text-red-700"}`}
                      >
                        Remove Question
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div
                className={`flex flex-col md:flex-row gap-4 mt-12 pt-8 border-t ${darkMode ? "border-white/20" : "border-blue-200"}`}
              >
                <button
                  type="button"
                  onClick={addQuestion}
                  className={`w-full md:w-auto px-6 py-4 rounded-2xl font-bold text-lg ${darkMode ? "bg-white/10 hover:bg-white/20" : "bg-blue-100 hover:bg-blue-200 text-gray-900"}`}
                >
                  ➕ Add Question
                </button>
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 px-8 py-4 rounded-2xl font-bold text-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-8 py-4 rounded-2xl font-bold text-xl shadow-2xl glow transition-all"
                >
                  Create Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENABLE STUDENTS MODAL */}
      {showEnableModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl`}
          >
            <h3 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Enable Students
            </h3>
            <div className="space-y-4 mb-8">
              {students.slice(0, 10).map((student) => (
                <label
                  key={student._id}
                  className={`flex items-center gap-3 p-4 rounded-xl border ${darkMode ? "bg-white/5 border-white/20" : "bg-blue-50 border-blue-200"}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudents([...selectedStudents, student._id]);
                      } else {
                        setSelectedStudents(
                          selectedStudents.filter((id) => id !== student._id),
                        );
                      }
                    }}
                    className="w-5 h-5 text-emerald-600 rounded"
                  />
                  <span>
                    {student.name} - {student.courseName}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowEnableModal(false)}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 px-8 py-4 rounded-2xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={confirmEnableStudents}
                disabled={selectedStudents.length === 0}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 disabled:opacity-50 px-8 py-4 rounded-2xl font-bold shadow-2xl glow"
              >
                Enable {selectedStudents.length} Students
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXAM RESULTS MODAL */}
      {showResultsModal && resultsExam && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">
                Results:{" "}
                <span
                  className={darkMode ? "text-indigo-300" : "text-indigo-600"}
                >
                  {resultsExam.chapter}
                </span>
              </h3>
              <button
                onClick={() => {
                  setShowResultsModal(false);
                  setResultsExam(null);
                  setExamResults([]);
                }}
                className="text-3xl hover:text-red-400"
              >
                ×
              </button>
            </div>

            {resultsLoading ? (
              <div
                className={`text-center py-12 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                Loading results...
              </div>
            ) : examResults.length === 0 ? (
              <div
                className={`text-center py-12 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                No attempts yet.
              </div>
            ) : (
              <div className="space-y-3">
                {examResults.map((a) => (
                  <div
                    key={a._id}
                    className={`flex items-center justify-between p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-emerald-50 border-emerald-200"}`}
                  >
                    <div className="font-semibold">
                      {a.studentId?.name || "Student"}
                    </div>
                    <div
                      className={`font-mono ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}
                    >
                      {Number(a.score).toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STUDENT DETAILS MODAL */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3
                className={`text-2xl font-bold ${darkMode ? "" : "text-gray-900"}`}
              >
                {editingStudent ? "Edit Student:" : "Student Details:"}{" "}
                <span
                  className={darkMode ? "text-indigo-300" : "text-indigo-600"}
                >
                  {selectedStudent.name}
                </span>
              </h3>
              <button
                onClick={() => {
                  setShowStudentModal(false);
                  setSelectedStudent(null);
                  setEditingStudent(false);
                  setStudentForm({});
                }}
                className={`text-3xl transition-all ${darkMode ? "hover:text-red-400" : "hover:text-red-600"}`}
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div
                className={`p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-blue-50 border-blue-200"}`}
              >
                <div
                  className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Email
                </div>
                {editingStudent ? (
                  <input
                    type="email"
                    value={studentForm.email || ""}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, email: e.target.value })
                    }
                    className={`w-full p-3 rounded-xl border ${darkMode ? "bg-white/10 border-white/20 text-white placeholder-gray-400" : "bg-blue-50 border-blue-300 text-gray-900 placeholder-gray-600"}`}
                  />
                ) : (
                  <div
                    className={`font-semibold ${darkMode ? "" : "text-gray-900"}`}
                  >
                    {selectedStudent.email || "-"}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-blue-50 border-blue-200"}`}
                >
                  <div
                    className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Course
                  </div>
                  {editingStudent ? (
                    <input
                      type="text"
                      value={studentForm.courseName || ""}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          courseName: e.target.value,
                        })
                      }
                      className={`w-full p-3 rounded-xl border ${darkMode ? "bg-white/10 border-white/20 text-white placeholder-gray-400" : "bg-blue-50 border-blue-300 text-gray-900 placeholder-gray-600"}`}
                    />
                  ) : (
                    <div
                      className={`font-semibold ${darkMode ? "" : "text-gray-900"}`}
                    >
                      {selectedStudent.courseName || "-"}
                    </div>
                  )}
                </div>
                <div
                  className={`p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-blue-50 border-blue-200"}`}
                >
                  <div
                    className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Batch Time
                  </div>
                  {editingStudent ? (
                    <input
                      type="text"
                      value={studentForm.batchTime || ""}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          batchTime: e.target.value,
                        })
                      }
                      className={`w-full p-3 rounded-xl border ${darkMode ? "bg-white/10 border-white/20 text-white placeholder-gray-400" : "bg-blue-50 border-blue-300 text-gray-900 placeholder-gray-600"}`}
                    />
                  ) : (
                    <div
                      className={`font-semibold ${darkMode ? "" : "text-gray-900"}`}
                    >
                      {selectedStudent.batchTime || "-"}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-blue-50 border-blue-200"}`}
                >
                  <div
                    className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Personal Contact
                  </div>
                  {editingStudent ? (
                    <input
                      type="text"
                      value={studentForm.personalContact || ""}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          personalContact: e.target.value,
                        })
                      }
                      className={`w-full p-3 rounded-xl border ${darkMode ? "bg-white/10 border-white/20 text-white placeholder-gray-400" : "bg-blue-50 border-blue-300 text-gray-900 placeholder-gray-600"}`}
                    />
                  ) : (
                    <div
                      className={`font-semibold ${darkMode ? "" : "text-gray-900"}`}
                    >
                      {selectedStudent.personalContact || "-"}
                    </div>
                  )}
                </div>
                <div
                  className={`p-4 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-blue-50 border-blue-200"}`}
                >
                  <div
                    className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Parent Contact
                  </div>
                  {editingStudent ? (
                    <input
                      type="text"
                      value={studentForm.parentContact || ""}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          parentContact: e.target.value,
                        })
                      }
                      className={`w-full p-3 rounded-xl border ${darkMode ? "bg-white/10 border-white/20 text-white placeholder-gray-400" : "bg-blue-50 border-blue-300 text-gray-900 placeholder-gray-600"}`}
                    />
                  ) : (
                    <div
                      className={`font-semibold ${darkMode ? "" : "text-gray-900"}`}
                    >
                      {selectedStudent.parentContact || "-"}
                    </div>
                  )}
                </div>
              </div>
              {editingStudent && (
                <div className="flex gap-4 pt-6">
                  <button
                    onClick={handleSaveStudent}
                    disabled={savingStudent}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 disabled:opacity-50 text-white font-bold py-4 px-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                  >
                    {savingStudent ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingStudent(false);
                      setSelectedStudent(null);
                      setShowStudentModal(false);
                    }}
                    className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 px-8 py-4 rounded-2xl font-bold text-xl"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TEACHER PROFILE EDIT MODAL */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Edit Profile</h3>
              <button
                onClick={() => setShowTeacherModal(false)}
                className="text-3xl hover:text-red-400"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Name
                </label>
                <input
                  type="text"
                  value={teacherForm.name}
                  onChange={(e) =>
                    setTeacherForm({ ...teacherForm, name: e.target.value })
                  }
                  className={`w-full p-3 rounded-xl border ${darkMode ? "bg-white/10 border-white/20" : "bg-blue-50 border-blue-300 text-gray-900"}`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={teacherForm.email}
                  onChange={(e) =>
                    setTeacherForm({ ...teacherForm, email: e.target.value })
                  }
                  className={`w-full p-3 rounded-xl border ${darkMode ? "bg-white/10 border-white/20" : "bg-blue-50 border-blue-300 text-gray-900"}`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Personal Contact
                </label>
                <input
                  type="text"
                  value={teacherForm.personalContact}
                  onChange={(e) =>
                    setTeacherForm({
                      ...teacherForm,
                      personalContact: e.target.value,
                    })
                  }
                  className={`w-full p-3 rounded-xl border ${darkMode ? "bg-white/10 border-white/20" : "bg-blue-50 border-blue-300 text-gray-900"}`}
                />
              </div>
            </div>
            <div className="flex gap-4 pt-6">
              <button
                onClick={handleSaveTeacher}
                disabled={savingTeacher}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 disabled:opacity-50 text-white font-bold py-4 px-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
              >
                {savingTeacher ? "Saving..." : "Save Profile"}
              </button>
              <button
                onClick={() => setShowTeacherModal(false)}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 px-8 py-4 rounded-2xl font-bold text-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE DAILY REPORT MODAL */}
      {showAttendanceReportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`${darkMode ? "glass-card" : "bg-white border border-gray-200"} p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                Daily Report - {new Date(attendanceDate).toLocaleDateString()}
              </h3>
              <button
                onClick={() => {
                  setShowAttendanceReportModal(false);
                  setEditingAttendanceReport(false);
                }}
                className="text-3xl hover:text-red-400"
              >
                ×
              </button>
            </div>

            {attendanceReportLoading ? (
              <div
                className={`text-center py-12 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                Loading report...
              </div>
            ) : (
              <>
                {!editingAttendanceReport ? (
                  // VIEW MODE
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {attendanceReportSlots.length > 0 ? (
                        attendanceReportSlots.map((ts, idx) => (
                          <div
                            key={ts.slot}
                            className={`p-4 ${darkMode ? "bg-white/5 border-white/20" : "bg-gray-50 border-gray-200"} rounded-2xl border`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1">
                                <div
                                  className={`w-6 h-6 rounded flex items-center justify-center ${ts.completed ? "bg-green-500" : "bg-gray-600"}`}
                                >
                                  {ts.completed && (
                                    <span className="text-white text-sm">
                                      ✓
                                    </span>
                                  )}
                                </div>
                                <span className="font-semibold min-w-max">
                                  {ts.slot}
                                </span>
                              </div>
                              <span
                                className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}
                              >
                                {ts.description || "-"}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div
                          className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                        >
                          No report data for this date
                        </div>
                      )}
                    </div>

                    {attendanceReportDescription && (
                      <div
                        className={`p-4 ${darkMode ? "bg-white/5 border-white/20" : "bg-gray-50 border-gray-200"} rounded-2xl border`}
                      >
                        <h4 className="font-semibold mb-2 text-indigo-400">
                          Overall Notes
                        </h4>
                        <p
                          className={`${darkMode ? "text-gray-300" : "text-gray-700"} whitespace-pre-wrap`}
                        >
                          {attendanceReportDescription}
                        </p>
                      </div>
                    )}

                    <div
                      className={`flex gap-4 pt-4 border-t ${darkMode ? "border-white/20" : "border-gray-200"}`}
                    >
                      <button
                        onClick={() => setEditingAttendanceReport(true)}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
                      >
                        <FaEdit /> Edit Report
                      </button>
                      <button
                        onClick={() => setShowAttendanceReportModal(false)}
                        className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 px-8 py-4 rounded-2xl font-bold text-lg"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  // EDIT MODE
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {(attendanceReportSlots.length
                        ? attendanceReportSlots
                        : buildDefaultReportSlots()
                      ).map((ts, idx) => (
                        <div
                          key={ts.slot}
                          className={`p-4 ${darkMode ? "bg-white/5 border-white/20" : "bg-gray-50 border-gray-200"} rounded-2xl border`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <label className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={!!ts.completed}
                                onChange={(e) => {
                                  const next = [
                                    ...(attendanceReportSlots.length
                                      ? attendanceReportSlots
                                      : buildDefaultReportSlots()),
                                  ];
                                  next[idx] = {
                                    ...next[idx],
                                    completed: e.target.checked,
                                  };
                                  setAttendanceReportSlots(next);
                                }}
                                className="w-5 h-5 rounded"
                              />
                              <span className="font-semibold">{ts.slot}</span>
                            </label>
                            <input
                              type="text"
                              value={ts.description || ""}
                              onChange={(e) => {
                                const next = [
                                  ...(attendanceReportSlots.length
                                    ? attendanceReportSlots
                                    : buildDefaultReportSlots()),
                                ];
                                next[idx] = {
                                  ...next[idx],
                                  description: e.target.value,
                                };
                                setAttendanceReportSlots(next);
                              }}
                              className={`flex-1 p-3 ${darkMode ? "bg-white/10 border-white/20 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"} border rounded-xl focus:ring-2 focus:ring-emerald-500/50`}
                              placeholder="Description for this time (e.g., Topic covered)"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-lg font-semibold mb-3">
                        Overall Notes (optional)
                      </label>
                      <textarea
                        value={attendanceReportDescription}
                        onChange={(e) =>
                          setAttendanceReportDescription(e.target.value)
                        }
                        rows={5}
                        className={`w-full p-4 ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-gray-300 text-gray-900"} border rounded-2xl focus:ring-4 focus:ring-emerald-500/50`}
                        placeholder="Any extra notes for the day..."
                      />
                    </div>

                    <div
                      className={`flex gap-4 pt-4 border-t ${darkMode ? "border-white/20" : "border-gray-200"}`}
                    >
                      <button
                        onClick={() => setEditingAttendanceReport(false)}
                        className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 px-8 py-4 rounded-2xl font-bold text-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveAttendanceReport}
                        disabled={savingAttendance}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 disabled:opacity-50 hover:from-emerald-600 hover:to-green-700 px-8 py-4 rounded-2xl font-bold text-lg"
                      >
                        {savingAttendance ? "Saving..." : "Save Report"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;
