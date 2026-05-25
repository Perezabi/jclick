import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  FaPlus,
  FaTrash,
  FaMoon,
  FaSun,
  FaDownload,
  FaEye,
  FaStar,
  FaEdit,
  FaSync,
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const AnimatedNumber = ({ value }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    const duration = 1000; // 1 second animation duration
    const endValue = parseInt(value, 10) || 0;

    if (endValue === 0) {
      setCount(0);
      return;
    }

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * endValue));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return <>{count}</>;
};

function CROsDashboard() {
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [active, setActive] = useState("dashboard");
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [cros, setCros] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [showLogout, setShowLogout] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    courseName: "",
    batchTime: "",
    batchDay: [],
    personalContact: "",
    parentContact: "",
    teacherId: "",
    joiningDate: "",
    loginTimeFrom: "",
    loginTimeTo: "",
    specialization: "",
  });

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [adminStudentSearch, setAdminStudentSearch] = useState("");
  const [adminTeacherSearch, setAdminTeacherSearch] = useState("");
  const [adminCroSearch, setAdminCroSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCro, setSelectedCro] = useState(null);
  const [studentsWithTasks, setStudentsWithTasks] = useState([]);
  const [taskSearchTerm, setTaskSearchTerm] = useState("");
  const [selectedTaskStudent, setSelectedTaskStudent] = useState(null);
  const [reviewingTask, setReviewingTask] = useState(null);
  const [reviewForm, setReviewForm] = useState({ feedback: "", mark: "" });
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportStats, setExportStats] = useState(null);
  const [exportingReport, setExportingReport] = useState(false);

  const [teacherReportStart, setTeacherReportStart] = useState("");
  const [teacherReportEnd, setTeacherReportEnd] = useState("");
  const [teacherReportsLoading, setTeacherReportsLoading] = useState(false);
  const [reportSelectedTeacherId, setReportSelectedTeacherId] = useState("");
  const [examsCount, setExamsCount] = useState(0);
  const [bulkSelectedStudents, setBulkSelectedStudents] = useState([]);
  const [certificateMessage, setCertificateMessage] = useState("");
  const [tabLoading, setTabLoading] = useState(false);
  const [studentSubTab, setStudentSubTab] = useState("active");

  const [enrollmentStart, setEnrollmentStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split("T")[0];
  });
  const [enrollmentEnd, setEnrollmentEnd] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const ITEMS_PER_PAGE = 10;
  const [studentPage, setStudentPage] = useState(1);
  const [teacherPage, setTeacherPage] = useState(1);
  const [croPage, setCroPage] = useState(1);
  const [taskStudentPage, setTaskStudentPage] = useState(1);

  // ================= FETCH DATA =================
  const fetchData = async () => {
    try {
      const s = await axios.get(`${API}/users/students/all?_t=${Date.now()}`, {
        headers: { Authorization: token },
      });

      const t = await axios.get(`${API}/users/teachers?_t=${Date.now()}`, {
        headers: { Authorization: token },
      });

      const c = await axios.get(`${API}/users/cros?_t=${Date.now()}`, {
        headers: { Authorization: token },
      }).catch(() => ({ data: [] }));

      const e = await axios.get(`${API}/exams/teacher?_t=${Date.now()}`, {
        headers: { Authorization: token },
      }).catch(() => ({ data: [] }));

      // enforce role correctness here to avoid leakage between tabs
      setStudents((s.data || []).filter((u) => u.role === "student"));
      setTeachers((t.data || []).filter((u) => u.role === "teacher"));
      setCros((c.data || []).filter((u) => u.role === "cro"));
      setExamsCount((e.data || []).length);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getAssignedStudentsForTeacher = (teacherId) => {
    if (!teacherId || !students.length) return [];

    return students.filter((s) => {
      if (!s.teacherId) return false;

      // If teacherId is populated (object with _id)
      if (typeof s.teacherId === "object" && s.teacherId._id) {
        return s.teacherId._id.toString() === teacherId.toString();
      }

      // If teacherId is a string or has a toString method
      if (s.teacherId.toString) {
        return s.teacherId.toString() === teacherId.toString();
      }

      return false;
    });
  };

  // ================= FETCH STUDENTS WITH TASKS =================
  const fetchStudentsWithTasks = async () => {
    try {
      const res = await axios.get(`${API}/teacher/admin/students?_t=${Date.now()}`, {
        headers: { Authorization: token },
      });

      // Validate payload arrays to prevent silent crashes
      const validatedData = (res.data || []).map(student => ({
        ...student,
        tasks: Array.isArray(student.tasks) ? student.tasks.map(task => ({
          ...task,
          submission: task.submission || null,
          review: task.review || null
        })) : []
      }));

      setStudentsWithTasks(validatedData);
      setSelectedTaskStudent((prev) => {
        if (prev) {
          return validatedData.find((s) => s._id === prev._id) || prev;
        }
        return prev;
      });
    } catch (err) {
      toast.error("Error loading students with tasks");
    }
  };

  const handleTabSwitch = async (tab) => {
    if (active === tab) return;
    setTabLoading(true);
    setActive(tab);
    try {
      if (tab === "tasks") await fetchStudentsWithTasks();
    } finally {
      setTimeout(() => setTabLoading(false), 300);
    }
  };

  // ================= EXPORT STUDENTS DATA =================
  const exportStudentsData = async () => {
    try {
      setExportingReport(true);
    const currentDate = new Date().toLocaleDateString("en-GB");

    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>All Students Task Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; margin: 0; }
    .logo-section { text-align: center; margin-bottom: 30px; }
    .logo { display: inline-block; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
    .logo img { height: 80px; width: auto; object-fit: contain; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
    .header h1 { margin: 0; font-size: 32px; margin-bottom: 10px; }
    .header-info { display: flex; justify-content: space-between; font-size: 14px; }
    .section { background: white; padding: 25px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .section-title { font-size: 20px; font-weight: bold; color: #ea580c; margin-bottom: 15px; border-bottom: 3px solid #f97316; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; background: white; margin-top: 10px; }
    th { background: #f97316; color: white; padding: 12px; text-align: left; font-weight: bold; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #fff7ed; }
    .badge-green { background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    .badge-red { background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    .badge-blue { background: #dbeafe; color: #1e3a8a; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    .footer { text-align: center; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="logo-section">
    <div class="logo">
      <img src="data:image/jpeg;base64,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" alt="Logo" />
    </div>
  </div>

  <div class="header">
    <h1>All Students Task Report</h1>
    <div class="header-info">
      <div><strong>Generated on:</strong> ${currentDate}</div>
      <div><strong>Total Students:</strong> ${studentsWithTasks.length}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📋 Students Task Overview</div>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Course</th>
          <th>Batch</th>
          <th>Total Tasks</th>
          <th>Submitted Tasks</th>
          <th>Pending Tasks</th>
        </tr>
      </thead>
      <tbody>
        ${studentsWithTasks
          .map((student) => {
            const totalTasks = student.tasks.length;
            const submittedTasks = student.tasks.filter(
              (t) => t.submission?.submittedAt,
            ).length;
            const pendingTasks = totalTasks - submittedTasks;

            return `<tr>
            <td><strong>${student.name}</strong><br><span style="font-size:12px;color:#666">${student.email}</span></td>
            <td>${student.courseName || "N/A"}</td>
            <td><span class="badge-blue">${student.batchTime || "N/A"}</span></td>
            <td style="text-align:center">${totalTasks}</td>
            <td style="text-align:center"><span class="badge-green">${submittedTasks}</span></td>
            <td style="text-align:center"><span class="${pendingTasks > 0 ? "badge-red" : "badge-green"}">${pendingTasks}</span></td>
          </tr>`;
          })
          .join("")}
      </tbody>
    </table>
  </div>
  
  <div class="footer">
    <p>This is an automatically generated report. For more information, contact the administration.</p>
  </div>
</body>
</html>`;

    downloadHTML(
      html,
      `students-task-report_${currentDate.replace(/\//g, "-")}.html`,
    );
    toast.success("Tasks exported as HTML successfully!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export students data");
    } finally {
      setExportingReport(false);
    }
  };

  const exportIndividualStudentTasks = async (student) => {
    if (!student) return;
    try {
      setExportingReport(true);
    const currentDate = new Date().toLocaleDateString("en-GB");

    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${student.name} - Tasks Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; margin: 0; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
    .header h1 { margin: 0; font-size: 32px; margin-bottom: 10px; }
    .header-info { display: flex; justify-content: space-between; font-size: 14px; }
    .section { background: white; padding: 25px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; background: white; margin-top: 10px; }
    th { background: #f97316; color: white; padding: 12px; text-align: left; font-weight: bold; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #fff7ed; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${student.name} - Tasks Report</h1>
    <div class="header-info">
      <div><strong>Generated on:</strong> ${currentDate}</div>
      <div><strong>Course:</strong> ${student.courseName || "N/A"}</div>
    </div>
  </div>

  <div class="section">
    <table>
      <thead>
        <tr>
          <th>Task Title</th>
          <th>Description</th>
          <th>Submitted</th>
          <th>Mark</th>
        </tr>
      </thead>
      <tbody>
        ${student.tasks
          .map((task) => {
            const submitted = task.submission?.submittedAt
              ? new Date(task.submission.submittedAt).toLocaleDateString("en-GB")
              : "No";
            const mark = task.review?.mark !== undefined ? task.review.mark : "Not graded";
            return `<tr>
            <td><strong>${task.title}</strong></td>
            <td>${task.description || "N/A"}</td>
            <td>${submitted}</td>
            <td>${mark}</td>
          </tr>`;
          })
          .join("")}
      </tbody>
    </table>
  </div>
</body>
</html>`;

    downloadHTML(
      html,
      `${student.name.replace(/\s+/g, "_")}_tasks_report.html`
    );
    toast.success("Individual tasks exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export individual tasks");
    } finally {
      setExportingReport(false);
    }
  };

  // Helper to download HTML
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

  // ================= EXPORT INDIVIDUAL STUDENT DATA =================
  const handleExportStudentData = async () => {
    if (!selectedStudent || !exportStartDate || !exportEndDate) {
      toast.error("Please select a date range first");
      return;
    }
    try {
      setExportingReport(true);
      const res = await axios.get(
        `${API}/teacher/admin/student-export/${selectedStudent._id}?startDate=${exportStartDate}&endDate=${exportEndDate}`,
        {
          headers: { Authorization: token },
        },
      );
      const data = res.data;

      setExportStats({
        percentage: data.attendancePercentage,
        expected: data.expectedDays,
        present: data.actualPresentDays,
      });

      const gradedTasks = data.tasks ? data.tasks.filter(t => t.review && t.review.mark !== undefined && t.review.mark !== null) : [];
      const taskSum = gradedTasks.reduce((sum, t) => sum + Number(t.review.mark), 0);
      const examSum = data.exams ? data.exams.reduce((sum, e) => sum + Number(e.score), 0) : 0;
      const totalGraded = gradedTasks.length + (data.exams ? data.exams.length : 0);
      const overallAvg = totalGraded > 0 ? ((taskSum + examSum) / totalGraded).toFixed(2) : 'N/A';

      const currentDate = new Date().toLocaleDateString("en-GB");
      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.student.name} - Complete Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; margin: 0; }
    .logo-section { text-align: center; margin-bottom: 30px; }
    .logo { display: inline-block; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3); }
    .logo img { height: 80px; width: auto; object-fit: contain; }
    .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
    .header h1 { margin: 0; font-size: 32px; margin-bottom: 10px; }
    .header-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px; }
    .section { background: white; padding: 25px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .section-title { font-size: 20px; font-weight: bold; color: #0891b2; margin-bottom: 15px; border-bottom: 3px solid #06b6d4; padding-bottom: 10px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .detail-row { padding: 12px 0; border-bottom: 1px solid #ddd; }
    .detail-row:last-child { border-bottom: none; }
    .label { font-weight: bold; color: #06b6d4; font-size: 13px; text-transform: uppercase; margin-bottom: 5px; }
    .value { font-size: 15px; color: #333; }
    table { width: 100%; border-collapse: collapse; background: white; margin-top: 10px; }
    th { background: #06b6d4; color: white; padding: 12px; text-align: left; font-weight: bold; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f9f9f9; }
    .present { background: #d1fae5; color: #065f46; padding: 6px 10px; border-radius: 4px; font-weight: bold; text-align: center; }
    .absent { background: #f8d7da; color: #721c24; padding: 6px 10px; border-radius: 4px; font-weight: bold; text-align: center; }
    .stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px; }
    .stat-box { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
    .stat-label{ font-size: 12px; opacity: 0.9; }
    .footer { text-align: center; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="logo-section">
    <div class="logo">
      <img src="data:image/jpeg;base64,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" alt="Logo" />
    </div>
  </div>

  <div class="header">
    <h1>Student Complete Report</h1>
    <div class="header-info">
      <div><strong>Generated on:</strong> ${currentDate}</div>
      <div><strong>Reported by:</strong> ${form.name || "Admin"}</div>
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
      <div class="stat-box">
        <div class="stat-value">${overallAvg}${overallAvg !== 'N/A' ? '%' : ''}</div>
        <div class="stat-label">Overall Average</div>
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
        `student-report-${data.student.name.replace(/\s+/g, "_")}-${new Date().toISOString().split("T")[0]}.html`,
      );
      toast.success("Student details exported successfully!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error(err.response?.data || "Failed to export student details");
    } finally {
      setExportingReport(false);
    }
  };

  const handleExportWeeklyReport = async (teacherId) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    try {
      setTeacherReportsLoading(true);
      const res = await axios.get(
        `${API}/teacher/admin/teacher-reports/${teacherId}?startDate=${startStr}&endDate=${endStr}`,
        { headers: { Authorization: token } }
      );

      const { teacher, reports } = res.data;

      if (reports.length === 0) {
        toast.error("No reports found in the last 7 days");
        return;
      }

      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Teacher Weekly Reports - ${teacher.name}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; margin: 0; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
    .header h1 { margin: 0; font-size: 32px; margin-bottom: 10px; }
    .header-info { display: flex; justify-content: space-between; font-size: 14px; }
    .report-card { background: white; padding: 25px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .report-date { font-size: 20px; font-weight: bold; color: #2563eb; margin-bottom: 15px; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; background: white; margin-top: 10px; margin-bottom: 20px; }
    th { background: #3b82f6; color: white; padding: 12px; text-align: left; font-weight: bold; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #eff6ff; }
    .completed { background: #d1fae5; color: #065f46; font-weight: bold; padding: 4px 8px; border-radius: 4px; display: inline-block; }
    .pending { background: #fef3c7; color: #92400e; font-weight: bold; padding: 4px 8px; border-radius: 4px; display: inline-block; }
    .notes { background: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; margin-top: 10px; border-radius: 5px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="header">
    <h1>👨‍🏫 Weekly Teacher Reports</h1>
    <div class="header-info">
      <div><strong>Teacher:</strong> ${teacher.name} (${teacher.specialization || 'General'})</div>
      <div><strong>Date Range:</strong> ${new Date(start).toLocaleDateString("en-GB")} to ${new Date(end).toLocaleDateString("en-GB")}</div>
    </div>
  </div>`;

      reports.forEach(report => {
        const dateStr = new Date(report.date).toLocaleDateString("en-GB");
        html += `
  <div class="report-card">
    <div class="report-date">📅 ${dateStr}</div>
    <table>
      <thead><tr><th width="150">Time Slot</th><th width="120">Status</th><th>Description</th></tr></thead>
      <tbody>`;
        if (report.timeSlots && report.timeSlots.length > 0) {
          report.timeSlots.forEach(slot => {
            html += `<tr><td>${slot.slot}</td><td><span class="${slot.completed ? "completed" : "pending"}">${slot.completed ? "Completed" : "Pending"}</span></td><td>${slot.description || "-"}</td></tr>`;
          });
        } else {
          html += `<tr><td colspan="3" style="text-align:center; color:#999;">No time slots recorded</td></tr>`;
        }
        html += `</tbody></table>`;
        if (report.description) { html += `<div class="notes"><strong>📌 Overall Notes:</strong><br>${report.description}</div>`; }
        html += `</div>`;
      });
      html += `</body></html>`;
      downloadHTML(html, `weekly_reports_${teacher.name.replace(/\s+/g, "_")}.html`);
      toast.success("Weekly reports exported successfully!");
    } catch (err) {
      toast.error("Failed to export weekly reports");
    } finally {
      setTeacherReportsLoading(false);
    }
  };

  const handleExportTeacherWithStudents = async (teacherId) => {
    if (!teacherReportStart || !teacherReportEnd) {
      toast.error("Please select a date range");
      return;
    }

    try {
      setTeacherReportsLoading(true);
      const res = await axios.get(
        `${API}/teacher/admin/teacher-reports/${teacherId}?startDate=${teacherReportStart}&endDate=${teacherReportEnd}`,
        { headers: { Authorization: token } }
      );
      
      const { teacher, reports } = res.data;

      // Fetch students assigned to this teacher
      const assignedStudents = getAssignedStudentsForTeacher(teacherId);
      const studentsPromises = assignedStudents.map(s => 
        axios.get(`${API}/teacher/admin/student-export/${s._id}?startDate=${teacherReportStart}&endDate=${teacherReportEnd}`, { headers: { Authorization: token } })
      );
      
      const studentsResponses = await Promise.all(studentsPromises);
      const studentsData = studentsResponses.map(r => r.data);

      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Teacher & Students Full Report - ${teacher.name}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; margin: 0; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
    .header h1 { margin: 0; font-size: 32px; margin-bottom: 10px; }
    .header-info { display: flex; justify-content: space-between; font-size: 14px; }
    .report-card { background: white; padding: 25px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .report-date { font-size: 20px; font-weight: bold; color: #059669; margin-bottom: 15px; border-bottom: 3px solid #10b981; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; background: white; margin-top: 10px; margin-bottom: 20px; }
    th { background: #10b981; color: white; padding: 12px; text-align: left; font-weight: bold; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f0fdf4; }
    .completed, .present { background: #d1fae5; color: #065f46; font-weight: bold; padding: 4px 8px; border-radius: 4px; display: inline-block; }
    .pending { background: #fef3c7; color: #92400e; font-weight: bold; padding: 4px 8px; border-radius: 4px; display: inline-block; }
    .absent { background: #fee2e2; color: #991b1b; font-weight: bold; padding: 4px 8px; border-radius: 4px; display: inline-block; }
    .notes { background: #ecfdf5; padding: 15px; border-left: 4px solid #10b981; margin-top: 10px; border-radius: 5px; white-space: pre-wrap; }
    .section-title { font-size: 28px; color: #065f46; margin: 40px 0 20px 0; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
    .student-title { font-size: 22px; color: #047857; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>👨‍🏫 Complete Teacher & Students Report</h1>
    <div class="header-info">
      <div><strong>Teacher:</strong> ${teacher.name} (${teacher.specialization || 'General'})</div>
      <div><strong>Date Range:</strong> ${new Date(teacherReportStart).toLocaleDateString("en-GB")} to ${new Date(teacherReportEnd).toLocaleDateString("en-GB")}</div>
    </div>
  </div>
  
  <h2 class="section-title">📅 Teacher Daily Reports</h2>`;

      if (reports.length === 0) {
        html += `<p style="color: #666;">No daily reports found for this period.</p>`;
      } else {
        reports.forEach(report => {
          const dateStr = new Date(report.date).toLocaleDateString("en-GB");
          html += `
    <div class="report-card">
      <div class="report-date">📅 ${dateStr}</div>
      <table>
        <thead><tr><th width="150">Time Slot</th><th width="120">Status</th><th>Description</th></tr></thead>
        <tbody>`;
          if (report.timeSlots && report.timeSlots.length > 0) {
            report.timeSlots.forEach(slot => {
              html += `<tr><td>${slot.slot}</td><td><span class="${slot.completed ? "completed" : "pending"}">${slot.completed ? "Completed" : "Pending"}</span></td><td>${slot.description || "-"}</td></tr>`;
            });
          } else {
            html += `<tr><td colspan="3" style="text-align:center; color:#999;">No time slots recorded</td></tr>`;
          }
          html += `</tbody></table>`;
          if (report.description) { html += `<div class="notes"><strong>📌 Overall Notes:</strong><br>${report.description}</div>`; }
          html += `</div>`;
        });
      }

      html += `<h2 class="section-title">👨‍🎓 Students Attendance Details</h2>`;

      if (studentsData.length === 0) {
        html += `<p style="color: #666;">No students assigned to this teacher.</p>`;
      } else {
        studentsData.forEach(sd => {
          const gradedTasks = sd.tasks ? sd.tasks.filter(t => t.review && t.review.mark !== undefined && t.review.mark !== null) : [];
          const taskSum = gradedTasks.reduce((sum, t) => sum + Number(t.review.mark), 0);
          const examSum = sd.exams ? sd.exams.reduce((sum, e) => sum + Number(e.score), 0) : 0;
          const totalGraded = gradedTasks.length + (sd.exams ? sd.exams.length : 0);
          const overallAvg = totalGraded > 0 ? ((taskSum + examSum) / totalGraded).toFixed(2) + '%' : 'N/A';

          html += `
    <div class="report-card">
      <div class="student-title">${sd.student.name} <span style="font-size:16px; color:#666;">(${sd.student.courseName || 'No Course'})</span></div>
      <div style="margin-bottom: 15px;">
        <strong>Email:</strong> ${sd.student.email} | 
        <strong>Attendance:</strong> <span style="color:#065f46; font-weight:bold;">${sd.attendancePercentage}%</span> (${sd.actualPresentDays}/${sd.expectedDays} days) |
        <strong>Overall Average:</strong> <span style="color:#065f46; font-weight:bold;">${overallAvg}</span>
      </div>`;
      
          if (sd.attendance.length > 0) {
            html += `
      <table>
        <thead><tr><th>Date</th><th>Status</th></tr></thead>
        <tbody>`;
            sd.attendance.forEach(a => {
              html += `<tr><td>${new Date(a.date).toLocaleDateString("en-GB")}</td><td><span class="${a.present ? 'present' : 'absent'}">${a.present ? 'Present' : 'Absent'}</span></td></tr>`;
            });
            html += `</tbody></table>`;
          } else {
            html += `<p style="color:#999; font-style:italic;">No attendance records found in this range.</p>`;
          }
          html += `<h4 style="margin-top: 20px; margin-bottom: 10px; color: #047857;">📝 Tasks & Submissions</h4>`;
          if (sd.tasks && sd.tasks.length > 0) {
            html += `
      <table>
        <thead><tr><th>Task Title</th><th>Assigned Date</th><th>Status</th><th>Score</th></tr></thead>
        <tbody>`;
            sd.tasks.forEach(t => {
              const assignedDate = new Date(t.createdAt).toLocaleDateString("en-GB");
              const status = t.submission?.submittedAt ? '<span class="completed">Submitted</span>' : '<span class="pending">Pending</span>';
              const score = (t.review && t.review.mark !== undefined && t.review.mark !== null) ? `<strong>${t.review.mark}/100</strong>` : '<span style="color:#999">Not Graded</span>';
              html += `<tr><td>${t.title}</td><td>${assignedDate}</td><td>${status}</td><td>${score}</td></tr>`;
            });
            html += `</tbody></table>`;
          } else {
            html += `<p style="color:#999; font-style:italic;">No tasks assigned in this range.</p>`;
          }

          html += `<h4 style="margin-top: 20px; margin-bottom: 10px; color: #047857;">🏅 Chapter Exams</h4>`;
          if (sd.exams && sd.exams.length > 0) {
            html += `
      <table>
        <thead><tr><th>Chapter</th><th>Completed Date</th><th>Score</th></tr></thead>
        <tbody>`;
            sd.exams.forEach(exam => {
              const completedDate = exam.completedAt ? new Date(exam.completedAt).toLocaleDateString("en-GB") : "N/A";
              const scoreColor = exam.score >= 80 ? '#059669' : (exam.score >= 60 ? '#d97706' : '#dc2626');
              html += `<tr><td>${exam.chapter}</td><td>${completedDate}</td><td><strong style="color:${scoreColor}">${Number(exam.score).toFixed(2)}%</strong></td></tr>`;
            });
            html += `</tbody></table>`;
          } else {
            html += `<p style="color:#999; font-style:italic;">No chapter exams completed in this range.</p>`;
          }

          html += `</div>`;
        });
      }

      html += `</body></html>`;
      downloadHTML(html, `full_report_${teacher.name.replace(/\s+/g, "_")}_${teacherReportStart}_to_${teacherReportEnd}.html`);
      toast.success("Complete report exported successfully!");
    } catch (err) {
      toast.error("Failed to export complete report");
    } finally {
      setTeacherReportsLoading(false);
    }
  };

  // ================= CREATE / UPDATE / DELETE USER =================
  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (form.role === "student" && (!form.batchDay || form.batchDay.length === 0)) {
      toast.error("Please select at least one batch day");
      return;
    }

    const payload = { ...form };
    if (!payload.password) delete payload.password;
    if (payload.teacherId === "") payload.teacherId = null;

    try {
      if (form._id) {
        await axios.put(`${API}/users/${form._id}`, payload, {
          headers: { Authorization: token },
        });
        toast.success("Updated Successfully");
      } else {
        await axios.post(`${API}/auth/create`, payload, {
          headers: { Authorization: token },
        });
        toast.success("Created Successfully");
      }

      setModalOpen(false);
      setForm({
        name: "", email: "", password: "", role: "student",
        courseName: "", batchTime: "", batchDay: [],
        personalContact: "", parentContact: "", teacherId: "",
        joiningDate: "", loginTimeFrom: "", loginTimeTo: "", specialization: "",
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data || "Error");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${API}/users/${id}`, {
        headers: { Authorization: token },
      });
      toast.success("Deleted");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data || "Failed to delete user");
    }
  };

  const handleBulkMarkCompleted = async () => {
    if (!window.confirm(`Are you sure you want to mark ${bulkSelectedStudents.length} students as completed? This will issue certificates to all of them.`)) return;
    try {
      setStudents(prev => prev.map(s => bulkSelectedStudents.includes(s._id) ? { ...s, status: "completed", certificateIssued: true, certificateDate: new Date() } : s));
      
      await Promise.all(
        bulkSelectedStudents.map((id) =>
          axios.put(
            `${API}/users/${id}`,
            { status: "completed", certificateIssued: true, certificateDate: new Date(), certificateMessage },
            { headers: { Authorization: token } }
          )
        )
      );

      const selectedObjects = students.filter(s => bulkSelectedStudents.includes(s._id));
      const html = generateCertificatesHTML(selectedObjects, certificateMessage);
      downloadHTML(html, `Bulk_Certificates_${new Date().toISOString().split('T')[0]}.html`);

      toast.success(`${bulkSelectedStudents.length} students marked as completed and certificates exported!`);
      setBulkSelectedStudents([]);
      setCertificateMessage("");
      fetchData();
    } catch (err) {
      toast.error("Failed to update some students");
      fetchData();
    }
  };

  // ================= STUDENT STATUS & CERTIFICATE =================
  const markStudentAsCompleted = async (id) => {
    if (!window.confirm("Are you sure you want to mark this student as completed? This will issue a certificate.")) return;
    try {
      setStudents(prev => prev.map(s => s._id === id ? { ...s, status: "completed", certificateIssued: true, certificateDate: new Date() } : s));
      if (selectedStudent?._id === id) setSelectedStudent(prev => ({...prev, status: "completed", certificateIssued: true, certificateDate: new Date()}));
      
      await axios.put(`${API}/users/${id}`, { status: "completed", certificateIssued: true, certificateDate: new Date() }, { headers: { Authorization: token } });
      toast.success("Student marked as completed!");
      fetchData();
    } catch(err) {
      toast.error("Failed to update status");
      fetchData();
    }
  };

  const markStudentAsActive = async (id) => {
    if (!window.confirm("Are you sure you want to reactivate this student?")) return;
    try {
      setStudents(prev => prev.map(s => s._id === id ? { ...s, status: "active" } : s));
      if (selectedStudent?._id === id) setSelectedStudent(prev => ({...prev, status: "active"}));
      
      await axios.put(`${API}/users/${id}`, { status: "active" }, { headers: { Authorization: token } });
      toast.success("Student reactivated!");
      fetchData();
    } catch(err) {
      toast.error("Failed to update status");
      fetchData();
    }
  };

  const markStudentAsOld = async (id) => {
    if (!window.confirm("Are you sure you want to move this student to old students?")) return;
    try {
      setStudents(prev => prev.map(s => s._id === id ? { ...s, status: "old" } : s));
      if (selectedStudent?._id === id) setSelectedStudent(prev => ({...prev, status: "old"}));
      
      await axios.put(`${API}/users/${id}`, { status: "old" }, { headers: { Authorization: token } });
      toast.success("Student moved to old students!");
      fetchData();
    } catch(err) {
      toast.error("Failed to update status");
      fetchData();
    }
  };

  // ================= PAGINATION CALCULATIONS =================
  const searchFilteredStudents = students.filter(
    (s) =>
      (s?.name || "").toLowerCase().includes(adminStudentSearch.toLowerCase()) ||
      (s?.email || "").toLowerCase().includes(adminStudentSearch.toLowerCase()) ||
      (s?.courseName || "").toLowerCase().includes(adminStudentSearch.toLowerCase())
  );
  const filteredStudents = searchFilteredStudents.filter(s => 
    studentSubTab === "active" ? (s.status !== 'completed' && s.status !== 'old') : (s.status === 'completed' || s.status === 'old')
  );
  const totalStudentPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
  const paginatedStudents = filteredStudents.slice((studentPage - 1) * ITEMS_PER_PAGE, studentPage * ITEMS_PER_PAGE);

  // ================= CHART DATA PREPARATION =================
  const roleData = [
    { name: "Students", value: students.length },
    { name: "Teachers", value: teachers.length },
    { name: "CROs", value: cros.length },
  ];

  const courseDistribution = students.reduce((acc, student) => {
    const course = student.courseName || "Unassigned";
    acc[course] = (acc[course] || 0) + 1;
    return acc;
  }, {});

  const courseChartData = Object.keys(courseDistribution).map((key) => ({
    name: key,
    count: courseDistribution[key],
  }));

  const CHART_COLORS = ["#10b981", "#8b5cf6", "#3b82f6", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

  // ================= LOGOUT LOGIC =================
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      toast.success("Logged out successfully!");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    }
  };

  return (
    <div
      className={`${darkMode ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100" : "bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 text-gray-900"} min-h-screen p-8`}
    >
      {/* ================= TOP NAVIGATION BAR ================= */}
      <nav
        className={`flex items-center justify-between px-8 py-4 mb-12 rounded-3xl shadow-2xl sticky top-4 z-50 transition-all ${
          darkMode ? "bg-gray-800/90 backdrop-blur-md border border-white/10" : "bg-white/90 backdrop-blur-md border border-blue-200"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
            CRO
          </div>
          <h1 className={`text-2xl font-black ${darkMode ? "text-white" : "text-gray-800"}`}>
            CRO Portal
          </h1>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {["dashboard", "students"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabSwitch(tab)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all capitalize ${
                active === tab
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                  : `${darkMode ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-blue-50"}`
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const newMode = !darkMode;
              setDarkMode(newMode);
              localStorage.setItem("theme", newMode ? "dark" : "light");
            }}
            className={`p-3 rounded-xl transition-all shadow-md ${
              darkMode ? "bg-gray-700 hover:bg-gray-600 text-yellow-400" : "bg-blue-50 hover:bg-blue-100 text-blue-600"
            }`}
          >
            {darkMode ? <FaSun size={18} /> : <FaMoon size={18} />}
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 font-bold text-sm text-white shadow-lg shadow-red-500/30 transition-all"
          >
            Logout
          </button>
        </div>
      </nav>

      {tabLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className={`w-16 h-16 border-4 ${darkMode ? "border-cyan-500" : "border-cyan-600"} border-t-transparent rounded-full animate-spin`}></div>
          <p className={`mt-6 text-xl font-bold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Loading {active}...</p>
        </div>
      ) : (
        <>
          {/* ================= DASHBOARD TAB ================= */}
          {active === "dashboard" && (
        <div className="space-y-8">
          {/* KPI Stat Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              onClick={() => handleTabSwitch("students")}
              data-aos="fade-up"
              className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-6 rounded-3xl shadow-xl cursor-pointer hover:scale-105 transition-all`}
            >
              <h3 className={`text-xl opacity-90 mb-2 ${darkMode ? "" : "text-gray-700"}`}>
                Total Students
              </h3>
              <p className={`text-4xl font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                <AnimatedNumber value={students.length} />
              </p>
            </div>
            <div
              data-aos="fade-up"
              data-aos-delay="100"
              className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-6 rounded-3xl shadow-xl`}
            >
              <h3 className={`text-xl opacity-90 mb-2 ${darkMode ? "" : "text-gray-700"}`}>
                Total Teachers
              </h3>
              <p className={`text-4xl font-bold ${darkMode ? "text-purple-400" : "text-purple-600"}`}>
                <AnimatedNumber value={teachers.length} />
              </p>
            </div>
            <div
              data-aos="fade-up"
              data-aos-delay="200"
              className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-6 rounded-3xl shadow-xl`}
            >
              <h3 className={`text-xl opacity-90 mb-2 ${darkMode ? "" : "text-gray-700"}`}>
                Active Courses
              </h3>
              <p className={`text-4xl font-bold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                <AnimatedNumber value={courseChartData.length} />
              </p>
            </div>
            <div
              data-aos="fade-up"
              data-aos-delay="300"
              className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-6 rounded-3xl shadow-xl`}
            >
              <h3 className={`text-xl opacity-90 mb-2 ${darkMode ? "" : "text-gray-700"}`}>
                Total Exams
              </h3>
              <p className={`text-4xl font-bold ${darkMode ? "text-orange-400" : "text-orange-600"}`}>
                <AnimatedNumber value={examsCount} />
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Users Pie Chart */}
            <div className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-6 rounded-3xl shadow-xl`} data-aos="fade-up" data-aos-delay="300">
              <h3 className={`text-xl font-bold mb-6 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                Users Distribution
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={roleData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} dataKey="value" label>
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', borderColor: darkMode ? '#374151' : '#e5e7eb', color: darkMode ? '#f3f4f6' : '#111827', borderRadius: '0.75rem' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Course Distribution Bar Chart */}
            <div className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-6 rounded-3xl shadow-xl`} data-aos="fade-up" data-aos-delay="400">
              <h3 className={`text-xl font-bold mb-6 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                Students by Course
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} vertical={false} />
                    <XAxis dataKey="name" stroke={darkMode ? "#9ca3af" : "#6b7280"} tick={{ fontSize: 12 }} />
                    <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} allowDecimals={false} />
                    <Tooltip cursor={{ fill: darkMode ? '#374151' : '#f3f4f6' }} contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', borderColor: darkMode ? '#374151' : '#e5e7eb', color: darkMode ? '#f3f4f6' : '#111827', borderRadius: '0.75rem' }} />
                    <Bar dataKey="count" name="Students Enrolled" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                      {courseChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STUDENTS TAB ================= */}
      {active === "students" && (
        <>
          <div className="flex flex-col md:flex-row gap-4 mb-4 items-center justify-between flex-wrap">
            <div className="flex gap-4 items-center flex-wrap">
              <button
                onClick={() => {
                  setForm({
                    ...form,
                    role: "student",
                    name: "",
                    email: "",
                    password: "",
                    courseName: "",
                    batchTime: "",
                    batchDay: [],
                    personalContact: "",
                    parentContact: "",
                  });
                  setModalOpen(true);
                }}
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 font-bold text-lg text-white shadow-2xl transition-all`}
              >
                <FaPlus size={20} /> Add New Student
              </button>
              <button
                onClick={fetchData}
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 font-bold text-lg text-white shadow-2xl transition-all`}
              >
                <FaSync size={20} /> Refresh Data
              </button>
            </div>
            <div className="flex items-center gap-2 flex-1 md:flex-initial min-w-64">
              <label className="text-sm font-medium">Search:</label>
              <input
                type="text"
                placeholder="Search by name, email, or course..."
                value={adminStudentSearch}
                onChange={(e) => {
                  setAdminStudentSearch(e.target.value);
                  setStudentPage(1);
                }}
                className={`flex-1 p-2 rounded-xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-gray-300 text-gray-900"}`}
              />
            </div>
          </div>
          
          <div className="flex gap-4 mb-8 border-b pb-4 dark:border-white/10 border-blue-200">
            <button 
              onClick={() => { setStudentSubTab("active"); setStudentPage(1); }}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm ${studentSubTab === 'active' ? 'bg-emerald-500 text-white shadow-emerald-500/30' : darkMode ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              Active Students
            </button>
            <button 
              onClick={() => { setStudentSubTab("old"); setStudentPage(1); }}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm ${studentSubTab === 'old' ? 'bg-emerald-500 text-white shadow-emerald-500/30' : darkMode ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              Old Students
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN - STUDENTS LIST */}
            <div className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-6 rounded-3xl shadow-xl`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-2xl font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                  👨‍🎓 Students ({filteredStudents.length})
                </h3>
                {bulkSelectedStudents.length > 0 ? (
                  <div className="flex items-center gap-3">
                    <input 
                      type="text"
                      placeholder="Custom Certificate Message..."
                      value={certificateMessage}
                      onChange={(e) => setCertificateMessage(e.target.value)}
                      className={`text-sm p-2 rounded-xl border outline-none ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"}`}
                    />
                    <button 
                      onClick={handleBulkMarkCompleted} 
                      className="text-sm bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-4 py-2 rounded-xl shadow-lg transition-all whitespace-nowrap"
                    >
                      🎓 Mark {bulkSelectedStudents.length} Completed & Export
                    </button>
                  </div>
                ) : (
                  <label className={`text-sm flex items-center gap-2 cursor-pointer font-bold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    <input type="checkbox" 
                      checked={paginatedStudents.length > 0 && bulkSelectedStudents.length === paginatedStudents.length}
                      onChange={(e) => setBulkSelectedStudents(e.target.checked ? paginatedStudents.map(s => s._id) : [])}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer" />
                    Select Page
                  </label>
                )}
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {paginatedStudents.map((s) => (
                    <div
                      key={s._id}
                      className={`p-4 rounded-2xl cursor-pointer transition-all ${
                        selectedStudent?._id === s._id
                          ? darkMode
                            ? "bg-emerald-500/30 border-2 border-emerald-400"
                            : "bg-emerald-100 border-2 border-emerald-500"
                          : darkMode
                            ? "bg-white/5 border border-white/10 hover:bg-white/10"
                            : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setSelectedStudent(s);
                        setExportStats(null);
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={bulkSelectedStudents.includes(s._id)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              if (e.target.checked) setBulkSelectedStudents([...bulkSelectedStudents, s._id]);
                              else setBulkSelectedStudents(bulkSelectedStudents.filter(id => id !== s._id));
                            }}
                            className="w-5 h-5 accent-emerald-500 cursor-pointer"
                          />
                          <div>
                            <h4 className={`font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                              {s.name}
                              {(s.status === 'completed' || s.status === 'old') && (
                                <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${s.status === 'old' ? (darkMode ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600") : (darkMode ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-600")}`}>
                                  {s.status === 'completed' ? 'COMPLETED' : 'OLD'}
                                </span>
                              )}
                            </h4>
                            <p className={`text-sm ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}>{s.courseName}</p>
                            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{s.batchTime}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <FaEdit
                            className={`cursor-pointer ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-500 hover:text-blue-700"}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setForm({
                                ...form,
                                name: s.name,
                                email: s.email,
                                password: "",
                                role: "student",
                                courseName: s.courseName,
                                batchTime: s.batchTime,
                                batchDay: s.batchDay || [],
                                personalContact: s.personalContact,
                                parentContact: s.parentContact,
                                teacherId: typeof s.teacherId === "object" && s.teacherId ? s.teacherId._id : (s.teacherId || ""),
                                joiningDate: s.joiningDate ? new Date(s.joiningDate).toISOString().split('T')[0] : "",
                                _id: s._id,
                              });
                              setModalOpen(true);
                            }}
                            size={16}
                            title="Edit student"
                          />
                          <FaTrash
                            className={`cursor-pointer ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-700"}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteUser(s._id);
                            }}
                            size={16}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              {totalStudentPages > 1 && (
                <div className={`flex justify-between items-center pt-4 border-t mt-4 ${darkMode ? "border-white/10" : "border-blue-200"}`}>
                  <button
                    onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                    disabled={studentPage === 1}
                    className={`px-4 py-2 rounded-xl text-sm font-bold ${studentPage === 1 ? "opacity-50 cursor-not-allowed" : darkMode ? "hover:bg-white/10" : "hover:bg-blue-100"} ${darkMode ? "bg-white/5 text-white" : "bg-blue-50 text-blue-600"}`}
                  >
                    Prev
                  </button>
                  <span className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Page {studentPage} of {totalStudentPages}
                  </span>
                  <button
                    onClick={() => setStudentPage((p) => Math.min(totalStudentPages, p + 1))}
                    disabled={studentPage === totalStudentPages}
                    className={`px-4 py-2 rounded-xl text-sm font-bold ${studentPage === totalStudentPages ? "opacity-50 cursor-not-allowed" : darkMode ? "hover:bg-white/10" : "hover:bg-blue-100"} ${darkMode ? "bg-white/5 text-white" : "bg-blue-50 text-blue-600"}`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN - STUDENT DETAILS */}
            <div className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-6 rounded-3xl shadow-xl`}>
              {selectedStudent ? (
                <>
                  <div>
                    <h3 className={`text-2xl font-bold mb-6 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                      👤 Student Details
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}>Name</label>
                          <p className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>{selectedStudent.name}</p>
                        </div>
                        <div>
                          <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}>Email</label>
                          <p className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>{selectedStudent.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}>Course</label>
                          <p className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>{selectedStudent.courseName}</p>
                        </div>
                        <div>
                          <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}>Batch Time</label>
                          <p className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>{selectedStudent.batchTime || "Not set"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}>Personal Contact</label>
                          <p className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>{selectedStudent.personalContact || "Not set"}</p>
                        </div>
                        <div>
                          <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}>Parent Contact</label>
                          <p className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>{selectedStudent.parentContact || "Not set"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}>Joining Date</label>
                          <p className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {selectedStudent.joiningDate ? new Date(selectedStudent.joiningDate).toLocaleDateString() : "Not set"}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}>Assigned Teacher</label>
                          <p className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>{selectedStudent.teacherId?.name || "Not assigned"}</p>
                        </div>
                      </div>

                      {/* EXPORT SECTION */}
                      <div className={`mt-6 p-6 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-emerald-50 border-emerald-200"}`}>
                        {/* Status Section */}
                        <div className="mb-6 pb-6 border-b border-emerald-500/20">
                          <h4 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                            🎓 Student Status & Certificate
                          </h4>
                          <div className="flex flex-wrap gap-4 items-center">
                            <span className={`px-4 py-2 rounded-xl font-bold text-sm ${selectedStudent.status === 'completed' || selectedStudent.status === 'old' ? (selectedStudent.status === 'old' ? (darkMode ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-700") : (darkMode ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700")) : (darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700")}`}>
                              {selectedStudent.status === 'completed' ? 'Completed' : selectedStudent.status === 'old' ? 'Old Student' : 'Active'}
                            </span>
                            
                            {selectedStudent.status !== 'completed' && selectedStudent.status !== 'old' ? (
                              <div className="flex flex-col gap-3 w-full sm:w-auto">
                                <input 
                                  type="text"
                                  placeholder="Custom Certificate Message..."
                                  value={certificateMessage}
                                  onChange={(e) => setCertificateMessage(e.target.value)}
                                  className={`w-full sm:w-80 p-2 text-sm rounded-xl border outline-none ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"}`}
                                />
                                <div className="flex flex-col sm:flex-row gap-2 w-full">
                                  <button onClick={() => markStudentAsCompleted(selectedStudent._id)} className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all text-sm">
                                    🎓 Issue Cert & Complete
                                  </button>
                                  <button onClick={() => markStudentAsOld(selectedStudent._id)} className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all text-sm">
                                    📦 Move to Old
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => markStudentAsActive(selectedStudent._id)} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 shadow-lg transition-all text-sm">
                                🔄 Re-activate Student
                              </button>
                            )}
                          </div>
                        </div>

                        <h4 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                          <FaDownload /> Export Attendance & Tasks
                        </h4>
                        <div className="flex flex-wrap gap-4 items-end">
                          <div>
                            <label className={`block text-sm font-bold mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Start Date</label>
                            <input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className={`p-2 rounded-xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
                          </div>
                          <div>
                            <label className={`block text-sm font-bold mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>End Date</label>
                            <input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className={`p-2 rounded-xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
                          </div>
                          <button onClick={handleExportStudentData} disabled={exportingReport} className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 shadow-lg transition-all">
                            <FaDownload /> {exportingReport ? "Exporting..." : "Export Data"}
                          </button>
                        </div>
                        {exportStats && (
                          <div className={`mt-4 p-4 rounded-xl border ${darkMode ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-100" : "bg-emerald-100 border-emerald-200 text-emerald-800"}`}>
                            <p className="font-semibold text-lg mb-1">Attendance: {exportStats.percentage}%</p>
                            <p className="text-sm opacity-90">Based on class days: {exportStats.present} present out of {exportStats.expected} expected days.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className={`text-6xl mb-4 ${darkMode ? "text-gray-600" : "text-gray-400"}`}>👨‍🎓</div>
                    <h3 className={`text-xl font-bold mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Select a Student</h3>
                    <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-500"}`}>Click on a student from the list to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ================= OTHER TABS PLACEHOLDER ================= */}
      {active !== "dashboard" && active !== "students" && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-12 rounded-3xl shadow-xl text-center max-w-2xl w-full`} data-aos="fade-up">
            <div className="text-6xl mb-6">🚧</div>
            <h2 className={`text-3xl font-bold mb-4 capitalize ${darkMode ? "text-cyan-400" : "text-cyan-600"}`}>
              {active} Section
            </h2>
            <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              This tab is currently empty. Please copy the <strong>{active}</strong> tab UI code from your main <code>Dashboard.jsx</code> file to display it here.
            </p>
          </div>
        </div>
      )}
        </>
      )}

      {/* ================= ENHANCED CREATE USER MODAL ================= */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <form
            onSubmit={handleSubmit}
            className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-8 w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-3xl shadow-2xl`}
          >
            <h2 className={`text-3xl font-bold mb-8 ${darkMode ? "bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent" : "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"}`}>
              {form._id ? "Edit" : "Create"} 👨‍🎓 Student
            </h2>

            {/* COMMON FIELDS */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <input
                type="text"
                placeholder="Full Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`p-4 rounded-xl ${darkMode ? "bg-white/10 border-white/20 text-white placeholder-gray-400" : "bg-blue-50 border-blue-300 text-gray-900 placeholder-gray-600"} border focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full`}
                required
              />
              <input
                type="email"
                placeholder="Email *"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`p-4 rounded-xl ${darkMode ? "bg-white/10 border-white/20 text-white placeholder-gray-400" : "bg-blue-50 border-blue-300 text-gray-900 placeholder-gray-600"} border focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full`}
                required
              />
            </div>

            <input
              type="password"
              placeholder="Password *"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={`w-full p-4 rounded-xl ${darkMode ? "bg-white/10 border-white/20 text-white placeholder-gray-400" : "bg-blue-50 border-blue-300 text-gray-900 placeholder-gray-600"} border focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-6`}
              required={!form._id}
            />

            {/* ============ STUDENT FIELDS ============ */}
            <div className="space-y-6 mb-12">
              <div>
                <label className={`block text-xl font-bold mb-4 ${darkMode ? "text-green-400" : "text-green-600"}`}>📚 IT Courses</label>
                <select
                  value={form.courseName}
                  onChange={(e) => setForm({ ...form, courseName: e.target.value })}
                  className={`w-full p-4 rounded-xl border-2 shadow-sm ${darkMode ? "bg-white/10 border-white/30 text-white focus:border-green-400" : "bg-white border-green-400 text-gray-900 focus:border-green-600"}`}
                  required
                >
                  <option value="" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>Select Course</option>
                  <option className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>MERN Stack Development</option>
                  <option className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>Python Full Stack</option>
                  <option className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>Java Full Stack</option>
                  <option className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>Digital Marketing</option>
                  <option className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>AWS DevOps</option>
                  <option className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>Data Science & AI</option>
                  <option className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>Cybersecurity</option>
                  <option className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>Mobile App Development</option>
                </select>
              </div>

              <div>
                <label className={`block text-xl font-bold mb-4 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>🕒 Batch Time</label>
                <select
                  value={form.batchTime}
                  onChange={(e) => setForm({ ...form, batchTime: e.target.value })}
                  className={`w-full p-4 rounded-xl border-2 shadow-sm ${darkMode ? "bg-white/10 border-white/30 text-white focus:border-blue-400" : "bg-white border-blue-400 text-gray-900 focus:border-blue-600"}`}
                  required
                >
                  <option value="" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>Select Time Slot</option>
                  <option className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>9:00 AM - 10:00 AM</option>
                  <option className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>10:00 AM - 11:00 AM</option>
                  <option className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>11:00 AM - 12:00 PM</option>
                  <option className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>12:00 PM - 01:00 PM</option>
                  <option className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>01:00 PM - 02:00 PM</option>
                  <option className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>02:00 PM - 03:00 PM</option>
                  <option className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>03:00 PM - 04:00 PM</option>
                  <option className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>04:00 PM - 05:00 PM</option>
                  <option className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>05:00 PM - 06:00 PM</option>
                  <option className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>06:00 PM - 07:00 PM</option>
                </select>
              </div>

              <div>
                <label className={`block text-xl font-bold mb-4 ${darkMode ? "text-purple-400" : "text-purple-600"}`}>📅 Batch Days</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((day) => (
                    <label key={day} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${darkMode ? "bg-white/5 border border-white/10 hover:bg-white/10" : "bg-purple-50 border border-purple-200 hover:bg-purple-100"}`}>
                      <input
                        type="checkbox"
                        checked={form.batchDay?.includes(day) || false}
                        onChange={(e) => {
                          const currentDays = form.batchDay || [];
                          if (e.target.checked) setForm({ ...form, batchDay: [...currentDays, day] });
                          else setForm({ ...form, batchDay: currentDays.filter((d) => d !== day) });
                        }}
                          className="w-6 h-6 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-500 transition-transform hover:scale-110"
                        className="w-6 h-6 text-purple-600 rounded focus:ring-purple-500 cursor-pointer accent-purple-500 transition-transform hover:scale-110"
                      />
                      <span className="text-sm capitalize font-medium">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-xl font-bold mb-4 ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}>📅 Joining Date</label>
                <input
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                  className={`w-full p-4 rounded-xl border-2 shadow-sm ${darkMode ? "bg-white/10 border-white/30 text-white focus:border-yellow-400" : "bg-white border-yellow-400 text-gray-900 focus:border-yellow-600"}`}
                  required
                />
              </div>
              
              <div className="mt-6">
                <label className="block text-xl font-bold mb-4 text-orange-400">👨‍🏫 Assign Teacher</label>
                <select
                  value={form.teacherId}
                  onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                  className={`w-full p-4 rounded-xl border-2 shadow-sm ${darkMode ? "bg-white/10 border-white/30 text-white focus:border-orange-400" : "bg-white border-orange-400 text-gray-900 focus:border-orange-600"}`}
                  required
                >
                  <option value="" className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>👨‍🏫 Select Teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id} className={darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                      {teacher.name} - {teacher.specialization || "General"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <input type="tel" placeholder="📱 Personal Contact" value={form.personalContact} onChange={(e) => setForm({ ...form, personalContact: e.target.value.replace(/\D/g, "") })} pattern="[0-9]{10}" maxLength="10" minLength="10" className={`p-4 rounded-xl border-2 ${darkMode ? "bg-white/10 border-white/30 text-white focus:border-emerald-400" : "bg-white border-emerald-400 text-gray-900 focus:border-emerald-600"}`} required />
                <input type="tel" placeholder="👨‍👩‍👧 Parent Contact" value={form.parentContact} onChange={(e) => setForm({ ...form, parentContact: e.target.value.replace(/\D/g, "") })} pattern="[0-9]{10}" maxLength="10" minLength="10" className={`p-4 rounded-xl border-2 ${darkMode ? "bg-white/10 border-white/30 text-white focus:border-emerald-400" : "bg-white border-emerald-400 text-gray-900 focus:border-emerald-600"}`} required />
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setForm({
                    name: "", email: "", password: "", role: "student",
                    courseName: "", batchTime: "", batchDay: [],
                    personalContact: "", parentContact: "", teacherId: "",
                    joiningDate: "", loginTimeFrom: "", loginTimeTo: "", specialization: "",
                  });
                }}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 px-8 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all text-white"
              >
                ❌ Cancel
              </button>
              <button type="submit" className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl glow transition-all flex items-center justify-center gap-2 text-white">
                ✅ {form._id ? "Update" : "Create"} Student
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default CROsDashboard;