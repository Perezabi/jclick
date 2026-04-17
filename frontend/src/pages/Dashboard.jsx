import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
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

function Dashboard() {
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [active, setActive] = useState("dashboard");
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
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
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentsWithTasks, setStudentsWithTasks] = useState([]);
  const [taskSearchTerm, setTaskSearchTerm] = useState("");
  const [selectedTaskStudent, setSelectedTaskStudent] = useState(null);
  const [reviewingTask, setReviewingTask] = useState(null);
  const [reviewForm, setReviewForm] = useState({ feedback: "", mark: "" });
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportStats, setExportStats] = useState(null);

  // ================= FETCH DATA =================
  const fetchData = async () => {
    try {
      const s = await axios.get(`${API}/users/students/all`, {
        headers: { Authorization: token },
      });

      const t = await axios.get(`${API}/users/teachers`, {
        headers: { Authorization: token },
      });

      // enforce role correctness here to avoid leakage between tabs
      setStudents((s.data || []).filter((u) => u.role === "student"));
      setTeachers((t.data || []).filter((u) => u.role === "teacher"));
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
      const res = await axios.get(`${API}/teacher/admin/students`, {
        headers: { Authorization: token },
      });
      setStudentsWithTasks(res.data);
    } catch (err) {
      toast.error("Error loading students with tasks");
    }
  };

  // ================= EXPORT STUDENTS DATA =================
  const exportStudentsData = () => {
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
  };

  const exportIndividualStudentTasks = (student) => {
    if (!student) return;
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

      const currentDate = new Date().toLocaleDateString("en-GB");
      let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.student.name} - Complete Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; margin: 0; }
    .logo-section { text-align: center; margin-bottom: 30px; }
    .logo { display: inline-block; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
    .logo img { height: 80px; width: auto; object-fit: contain; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
    .header h1 { margin: 0; font-size: 32px; margin-bottom: 10px; }
    .header-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px; }
    .section { background: white; padding: 25px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .section-title { font-size: 20px; font-weight: bold; color: #059669; margin-bottom: 15px; border-bottom: 3px solid #10b981; padding-bottom: 10px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .detail-row { padding: 12px 0; border-bottom: 1px solid #ddd; }
    .detail-row:last-child { border-bottom: none; }
    .label { font-weight: bold; color: #10b981; font-size: 13px; text-transform: uppercase; margin-bottom: 5px; }
    .value { font-size: 15px; color: #333; }
    table { width: 100%; border-collapse: collapse; background: white; margin-top: 10px; }
    th { background: #10b981; color: white; padding: 12px; text-align: left; font-weight: bold; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f9f9f9; }
    .present { background: #d1fae5; color: #065f46; padding: 6px 10px; border-radius: 4px; font-weight: bold; text-align: center; }
    .absent { background: #f8d7da; color: #721c24; padding: 6px 10px; border-radius: 4px; font-weight: bold; text-align: center; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
    .stat-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
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
    <h1>Student Range Report</h1>
    <div class="header-info">
      <div><strong>Generated on:</strong> ${currentDate}</div>
      <div><strong>Range:</strong> ${new Date(exportStartDate).toLocaleDateString("en-GB")} to ${new Date(exportEndDate).toLocaleDateString("en-GB")}</div>
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
    </div>
  </div>

  <!-- STATISTICS SECTION -->
  <div class="section">
    <div class="section-title">📈 Statistics</div>
    <div class="stats">
      <div class="stat-box">
        <div class="stat-value">${data.attendancePercentage}%</div>
        <div class="stat-label">Attendance (${data.actualPresentDays}/${data.expectedDays} days)</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${data.tasks.length}</div>
        <div class="stat-label">Tasks</div>
      </div>
    </div>
  </div>

  <!-- ATTENDANCE SECTION -->
  <div class="section">
    <div class="section-title">📋 Attendance Details</div>
    ${
      data.attendance.length > 0
        ? "<table><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>" +
          data.attendance
            .map(
              (a) =>
                "<tr><td>" +
                new Date(a.date).toLocaleDateString("en-GB") +
                '</td><td class="' +
                (a.present ? "present" : "absent") +
                '">' +
                (a.present ? "Present" : "Absent") +
                "</td></tr>",
            )
            .join("") +
          "</tbody></table>"
        : '<p style="color: #999;">No attendance records found</p>'
    }
  </div>

  <!-- TASKS SECTION -->
  <div class="section">
    <div class="section-title">📝 Tasks Details</div>
    ${
      data.tasks.length > 0
        ? "<table><thead><tr><th>Date</th><th>Title</th><th>Submitted</th><th>Mark</th></tr></thead><tbody>" +
          data.tasks
            .map((t) => {
              const date = new Date(t.createdAt).toLocaleDateString("en-GB");
              const submitted = t.submission?.submittedAt
                ? new Date(t.submission.submittedAt).toLocaleDateString("en-GB")
                : "No";
              const mark =
                t.review?.mark !== undefined ? t.review.mark : "Not graded";
              return (
                "<tr><td>" +
                date +
                "</td><td>" +
                t.title +
                "</td><td>" +
                submitted +
                "</td><td>" +
                mark +
                "</td></tr>"
              );
            })
            .join("") +
          "</tbody></table>"
        : '<p style="color: #999;">No tasks found</p>'
    }
  </div>

  <div class="footer">
    <p>This is an automatically generated report. For more information, contact the administration.</p>
  </div>
</body>
</html>`;

      downloadHTML(
        html,
        `${data.student.name.replace(/\s+/g, "_")}_report.html`,
      );

      toast.success("Data exported as HTML successfully!");
    } catch (err) {
      toast.error(err.response?.data || "Failed to export data");
    }
  };

  // ================= CREATE USER =================
  const handleSubmit = async () => {
    try {
      await axios.post(`${API}/auth/create`, form, {
        headers: { Authorization: token },
      });

      toast.success("Created Successfully");
      setModalOpen(false);
      setForm({
        name: "",
        email: "",
        password: "",
        role: "student",
        courseName: "",
        batchTime: "",
        batchType: "",
        courseJoiningDate: "",
        personalContact: "",
        parentContact: "",
        teacherId: "",
        joiningDate: "",
        loginTimeFrom: "",
        loginTimeTo: "",
        specialization: "",
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data || "Error");
    }
  };

  const deleteUser = async (id) => {
    await axios.delete(`${API}/users/${id}`, {
      headers: { Authorization: token },
    });
    toast.success("Deleted");
    fetchData();
  };

  // ================= REVIEW TASK =================
  const handleReviewTask = async (taskId) => {
    try {
      await axios.post(
        `${API}/teacher/admin/tasks/${taskId}/review`,
        reviewForm,
        {
          headers: { Authorization: token },
        },
      );
      toast.success("Task reviewed successfully");
      setReviewingTask(null);
      setReviewForm({ feedback: "", mark: "" });
      fetchStudentsWithTasks();
    } catch (err) {
      toast.error("Error reviewing task");
    }
  };

  // 🔥 LOGOUT FUNCTION - Add this before the return statement
  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      toast.success("Logged out successfully!");

      // Redirect to login after 1.5s
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    }
  };

  // ================= UI =================
  return (
    <div
      className={`${darkMode ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100" : "bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 text-gray-900"} min-h-screen p-8`}
    >
      {/* NAVIGATION - ENHANCED */}
      {/* ENHANCED NAVIGATION WITH LOGOUT */}
      <div
        className={`flex flex-wrap gap-4 mb-12 ${darkMode ? "bg-white/5 backdrop-blur-sm" : "bg-white/60 backdrop-blur-sm border border-blue-200"} p-6 rounded-3xl shadow-2xl`}
      >
        <button
          onClick={() => {
            setActive("dashboard");
          }}
          className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex-1 md:flex-none ${
            active === "dashboard"
              ? "bg-indigo-500 glow text-white shadow-indigo-500/25 scale-105"
              : `${darkMode ? "hover:bg-white/10" : "hover:bg-blue-100"} hover:shadow-xl hover:scale-105`
          }`}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => {
            setActive("students");
          }}
          className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex-1 md:flex-none ${
            active === "students"
              ? "bg-emerald-500 glow text-white shadow-emerald-500/25 scale-105"
              : `${darkMode ? "hover:bg-white/10" : "hover:bg-blue-100"} hover:shadow-xl hover:scale-105`
          }`}
        >
          👨‍🎓 Students
        </button>
        <button
          onClick={() => {
            setActive("teachers");
          }}
          className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex-1 md:flex-none ${
            active === "teachers"
              ? "bg-purple-500 glow text-white shadow-purple-500/25 scale-105"
              : `${darkMode ? "hover:bg-white/10" : "hover:bg-blue-100"} hover:shadow-xl hover:scale-105`
          }`}
        >
          👨‍🏫 Teachers
        </button>
        <button
          onClick={() => {
            setActive("tasks");
            fetchStudentsWithTasks();
          }}
          className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex-1 md:flex-none ${
            active === "tasks"
              ? "bg-orange-500 glow text-white shadow-orange-500/25 scale-105"
              : `${darkMode ? "hover:bg-white/10" : "hover:bg-blue-100"} hover:shadow-xl hover:scale-105`
          }`}
        >
          📝 Tasks
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={() => {
            const newMode = !darkMode;
            setDarkMode(newMode);
            localStorage.setItem("theme", newMode ? "dark" : "light");
          }}
          className={`px-6 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex items-center gap-2 ${
            darkMode
              ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
              : "bg-blue-200 hover:bg-blue-300 text-blue-600"
          }`}
          title={darkMode ? "Light mode" : "Dark mode"}
        >
          {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
        </button>

        {/* 🔥 NEW LOGOUT BUTTON */}
        <button
          onClick={handleLogout}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 font-bold text-lg shadow-lg glow shadow-red-500/25 hover:shadow-xl hover:scale-105 transition-all ml-auto text-white"
        >
          🚪 Logout
        </button>
      </div>

      {/* ================= DASHBOARD ================= */}
      {active === "dashboard" && (
        <div className="grid md:grid-cols-3 gap-6">
          <div
            className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-6 rounded-3xl shadow-xl`}
          >
            <h3
              className={`text-xl opacity-90 mb-2 ${darkMode ? "" : "text-gray-700"}`}
            >
              Total Students
            </h3>
            <p
              className={`text-4xl font-bold ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}
            >
              {students.length}
            </p>
          </div>
          <div
            className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-6 rounded-3xl shadow-xl`}
          >
            <h3
              className={`text-xl opacity-90 mb-2 ${darkMode ? "" : "text-gray-700"}`}
            >
              Total Teachers
            </h3>
            <p
              className={`text-4xl font-bold ${darkMode ? "text-purple-400" : "text-purple-600"}`}
            >
              {teachers.length}
            </p>
          </div>
        </div>
      )}

      {/* ================= STUDENTS ================= */}
      {active === "students" && (
        <>
          <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between flex-wrap">
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
                onChange={(e) => setAdminStudentSearch(e.target.value)}
                className={`flex-1 p-2 rounded-xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-gray-300 text-gray-900"}`}
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN - STUDENTS LIST */}
            <div
              className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-6 rounded-3xl shadow-xl`}
            >
              <h3
                className={`text-2xl font-bold mb-6 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}
              >
                👨‍🎓 Students ({students.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {students
                  .filter(
                    (s) =>
                      s.name
                        .toLowerCase()
                        .includes(adminStudentSearch.toLowerCase()) ||
                      s.email
                        .toLowerCase()
                        .includes(adminStudentSearch.toLowerCase()) ||
                      s.courseName
                        .toLowerCase()
                        .includes(adminStudentSearch.toLowerCase()),
                  )
                  .map((s) => (
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
                      {" "}
                      <div className="flex justify-between items-center">
                        <div>
                          <h4
                            className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {s.name}
                          </h4>
                          <p
                            className={`text-sm ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}
                          >
                            {s.courseName}
                          </p>
                          <p
                            className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            {s.batchTime}
                          </p>
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
            </div>

            {/* RIGHT COLUMN - STUDENT DETAILS */}
            <div
              className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-6 rounded-3xl shadow-xl`}
            >
              {selectedStudent ? (
                <>
                  <div>
                    <h3
                      className={`text-2xl font-bold mb-6 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}
                    >
                      👤 Student Details
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            className={`block text-sm font-bold mb-2 ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}
                          >
                            Name
                          </label>
                          <p
                            className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {selectedStudent.name}
                          </p>
                        </div>
                        <div>
                          <label
                            className={`block text-sm font-bold mb-2 ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}
                          >
                            Email
                          </label>
                          <p
                            className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {selectedStudent.email}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            className={`block text-sm font-bold mb-2 ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}
                          >
                            Course
                          </label>
                          <p
                            className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {selectedStudent.courseName}
                          </p>
                        </div>
                        <div>
                          <label
                            className={`block text-sm font-bold mb-2 ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}
                          >
                            Batch Time
                          </label>
                          <p
                            className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {selectedStudent.batchTime || "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            className={`block text-sm font-bold mb-2 ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}
                          >
                            Personal Contact
                          </label>
                          <p
                            className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {selectedStudent.personalContact || "Not set"}
                          </p>
                        </div>
                        <div>
                          <label
                            className={`block text-sm font-bold mb-2 ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}
                          >
                            Parent Contact
                          </label>
                          <p
                            className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {selectedStudent.parentContact || "Not set"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            className={`block text-sm font-bold mb-2 ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}
                          >
                            Joining Date
                          </label>
                          <p
                            className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {selectedStudent.joiningDate
                              ? new Date(
                                  selectedStudent.joiningDate,
                                ).toLocaleDateString()
                              : "Not set"}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <label
                            className={`block text-sm font-bold mb-2 ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}
                          >
                            Assigned Teacher
                          </label>
                          <p
                            className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {selectedStudent.teacherId?.name || "Not assigned"}
                          </p>
                        </div>
                      </div>

                      {/* EXPORT SECTION */}
                      <div
                        className={`mt-6 p-6 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-emerald-50 border-emerald-200"}`}
                      >
                        <h4
                          className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}
                        >
                          <FaDownload /> Export Attendance & Tasks
                        </h4>
                        <div className="flex flex-wrap gap-4 items-end">
                          <div>
                            <label
                              className={`block text-sm font-bold mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                            >
                              Start Date
                            </label>
                            <input
                              type="date"
                              value={exportStartDate}
                              onChange={(e) =>
                                setExportStartDate(e.target.value)
                              }
                              className={`p-2 rounded-xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                            />
                          </div>
                          <div>
                            <label
                              className={`block text-sm font-bold mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                            >
                              End Date
                            </label>
                            <input
                              type="date"
                              value={exportEndDate}
                              onChange={(e) => setExportEndDate(e.target.value)}
                              className={`p-2 rounded-xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                            />
                          </div>
                          <button
                            onClick={handleExportStudentData}
                            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 shadow-lg transition-all"
                          >
                            <FaDownload /> Export Data
                          </button>
                        </div>

                        {exportStats && (
                          <div
                            className={`mt-4 p-4 rounded-xl border ${darkMode ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-100" : "bg-emerald-100 border-emerald-200 text-emerald-800"}`}
                          >
                            <p className="font-semibold text-lg mb-1">
                              Attendance: {exportStats.percentage}%
                            </p>
                            <p className="text-sm opacity-90">
                              Based on class days: {exportStats.present} present
                              out of {exportStats.expected} expected days.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div
                      className={`text-6xl mb-4 ${darkMode ? "text-gray-600" : "text-gray-400"}`}
                    >
                      👨‍🎓
                    </div>
                    <h3
                      className={`text-xl font-bold mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Select a Student
                    </h3>
                    <p
                      className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-500"}`}
                    >
                      Click on a student from the list to view details
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ================= TEACHERS ================= */}
      {active === "teachers" && (
        <>
          <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between flex-wrap">
            <div className="flex gap-4 items-center flex-wrap">
              <button
                onClick={() => {
                  setForm({
                    ...form,
                    role: "teacher",
                    name: "",
                    email: "",
                    password: "",
                    specialization: "",
                    loginTimeFrom: "",
                    loginTimeTo: "",
                    joiningDate: "",
                  });
                  setModalOpen(true);
                }}
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 font-bold text-lg text-white shadow-2xl transition-all`}
              >
                <FaPlus size={20} /> Add New Teacher
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
                placeholder="Search by name or specialization..."
                value={adminTeacherSearch}
                onChange={(e) => setAdminTeacherSearch(e.target.value)}
                className={`flex-1 p-2 rounded-xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-gray-300 text-gray-900"}`}
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN - TEACHERS LIST */}
            <div
              className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-6 rounded-3xl shadow-xl`}
            >
              <h3
                className={`text-2xl font-bold mb-6 ${darkMode ? "text-purple-400" : "text-purple-600"}`}
              >
                👨‍🏫 Teachers ({teachers.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {teachers
                  .filter(
                    (t) =>
                      t.name
                        .toLowerCase()
                        .includes(adminTeacherSearch.toLowerCase()) ||
                      (t.specialization || "")
                        .toLowerCase()
                        .includes(adminTeacherSearch.toLowerCase()),
                  )
                  .map((t) => (
                    <div
                      key={t._id}
                      className={`p-4 rounded-2xl cursor-pointer transition-all ${
                        selectedTeacher?._id === t._id
                          ? darkMode
                            ? "bg-purple-500/30 border-2 border-purple-400"
                            : "bg-purple-100 border-2 border-purple-500"
                          : darkMode
                            ? "bg-white/5 border border-white/10 hover:bg-white/10"
                            : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                      }`}
                      onClick={() => setSelectedTeacher(t)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4
                            className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {t.name}
                          </h4>
                          <p
                            className={`text-sm ${darkMode ? "text-purple-300" : "text-purple-600"}`}
                          >
                            {t.specialization || "General"}
                          </p>
                          <p
                            className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Students:{" "}
                            {getAssignedStudentsForTeacher(t._id).length}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <FaEdit
                            className={`cursor-pointer ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-500 hover:text-blue-700"}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setForm({
                                ...form,
                                name: t.name,
                                email: t.email,
                                password: "",
                                role: "teacher",
                                specialization: t.specialization,
                                loginTimeFrom: t.loginTimeFrom,
                                loginTimeTo: t.loginTimeTo,
                                joiningDate: t.joiningDate,
                                _id: t._id,
                              });
                              setModalOpen(true);
                            }}
                            size={16}
                            title="Edit teacher"
                          />
                          <FaTrash
                            className={`cursor-pointer ${darkMode ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-700"}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteUser(t._id);
                            }}
                            size={16}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* RIGHT COLUMN - TEACHER DETAILS & ASSIGNED STUDENTS */}
            <div
              className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-6 rounded-3xl shadow-xl`}
            >
              {selectedTeacher ? (
                <>
                  {/* TEACHER DETAILS */}
                  <div className="mb-8">
                    <h3
                      className={`text-2xl font-bold mb-6 ${darkMode ? "text-purple-400" : "text-purple-600"}`}
                    >
                      👤 Teacher Details
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            className={`block text-sm font-bold mb-2 ${darkMode ? "text-purple-300" : "text-purple-600"}`}
                          >
                            Name
                          </label>
                          <p
                            className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {selectedTeacher.name}
                          </p>
                        </div>
                        <div>
                          <label
                            className={`block text-sm font-bold mb-2 ${darkMode ? "text-purple-300" : "text-purple-600"}`}
                          >
                            Email
                          </label>
                          <p
                            className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {selectedTeacher.email}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            className={`block text-sm font-bold mb-2 ${darkMode ? "text-purple-300" : "text-purple-600"}`}
                          >
                            Specialization
                          </label>
                          <p
                            className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {selectedTeacher.specialization || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label
                            className={`block text-sm font-bold mb-2 ${darkMode ? "text-purple-300" : "text-purple-600"}`}
                          >
                            Schedule
                          </label>
                          <p
                            className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}
                          >
                            {selectedTeacher.loginTimeFrom &&
                            selectedTeacher.loginTimeTo
                              ? `${selectedTeacher.loginTimeFrom} - ${selectedTeacher.loginTimeTo}`
                              : "Not set"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label
                          className={`block text-sm font-bold mb-2 ${darkMode ? "text-purple-300" : "text-purple-600"}`}
                        >
                          Joining Date
                        </label>
                        <p
                          className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}
                        >
                          {selectedTeacher.joiningDate
                            ? new Date(
                                selectedTeacher.joiningDate,
                              ).toLocaleDateString()
                            : "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ASSIGNED STUDENTS */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3
                        className={`text-2xl font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}
                      >
                        👨‍🎓 Assigned Students (
                        {
                          getAssignedStudentsForTeacher(selectedTeacher._id)
                            .length
                        }
                        )
                      </h3>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Search:</label>
                        <input
                          type="text"
                          placeholder="Search students..."
                          value={studentSearchTerm}
                          onChange={(e) => setStudentSearchTerm(e.target.value)}
                          className={`p-2 rounded-xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                        />
                      </div>
                    </div>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {getAssignedStudentsForTeacher(selectedTeacher._id)
                        .length === 0 ? (
                        <p
                          className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                        >
                          No students assigned to this teacher
                        </p>
                      ) : (
                        getAssignedStudentsForTeacher(selectedTeacher._id)
                          .filter(
                            (student) =>
                              student.name
                                .toLowerCase()
                                .includes(studentSearchTerm.toLowerCase()) ||
                              student.email
                                .toLowerCase()
                                .includes(studentSearchTerm.toLowerCase()) ||
                              student.courseName
                                .toLowerCase()
                                .includes(studentSearchTerm.toLowerCase()),
                          )
                          .map((student) => (
                            <div
                              key={student._id}
                              className={`p-4 rounded-2xl ${
                                darkMode
                                  ? "bg-white/5 border border-white/10"
                                  : "bg-gray-50 border border-gray-200"
                              }`}
                            >
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4
                                    className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
                                  >
                                    {student.name}
                                  </h4>
                                  <p
                                    className={`text-sm ${darkMode ? "text-emerald-300" : "text-emerald-600"}`}
                                  >
                                    {student.courseName}
                                  </p>
                                  <p
                                    className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                                  >
                                    {student.email}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p
                                    className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                                  >
                                    Batch: {student.batchTime}
                                  </p>
                                  <p
                                    className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                                  >
                                    Personal: {student.personalContact || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full min-h-96">
                  <div className="text-center">
                    <div
                      className={`text-6xl mb-4 ${darkMode ? "text-gray-600" : "text-gray-400"}`}
                    >
                      👨‍🏫
                    </div>
                    <h3
                      className={`text-xl font-bold mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Select a Teacher
                    </h3>
                    <p
                      className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-500"}`}
                    >
                      Click on a teacher from the list to view details and
                      assigned students
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ================= TASKS ================= */}
      {active === "tasks" && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-3xl font-bold">Task Management</h2>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={exportStudentsData}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 shadow-lg w-full sm:w-auto justify-center"
              >
                <FaDownload /> Export Data
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN - STUDENTS LIST */}
            <div className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-6 rounded-3xl shadow-xl`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-2xl font-bold ${darkMode ? "text-orange-400" : "text-orange-600"}`}>
                  👨‍🎓 Students ({studentsWithTasks.length})
                </h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Search:</label>
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={taskSearchTerm}
                    onChange={(e) => setTaskSearchTerm(e.target.value)}
                    className={`p-2 rounded-xl border ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  />
                </div>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {studentsWithTasks
                  .filter(
                    (student) =>
                      student.name.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
                      (student.courseName && student.courseName.toLowerCase().includes(taskSearchTerm.toLowerCase())) ||
                      student.email.toLowerCase().includes(taskSearchTerm.toLowerCase())
                  )
                  .map((student) => (
                    <div
                      key={student._id}
                      className={`p-4 rounded-2xl cursor-pointer transition-all ${
                        selectedTaskStudent?._id === student._id
                          ? darkMode
                            ? "bg-orange-500/30 border-2 border-orange-400"
                            : "bg-orange-100 border-2 border-orange-500"
                          : darkMode
                            ? "bg-white/5 border border-white/10 hover:bg-white/10"
                            : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                      }`}
                      onClick={() => setSelectedTaskStudent(student)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {student.name}
                          </h4>
                          <p className={`text-sm ${darkMode ? "text-orange-300" : "text-orange-600"}`}>
                            {student.courseName}
                          </p>
                          <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                            Tasks: {student.tasks.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* RIGHT COLUMN - STUDENT DETAILS & TASKS */}
            <div className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-6 rounded-3xl shadow-xl`}>
              {selectedTaskStudent ? (
                <>
                  <div className="mb-8">
                    <h3 className={`text-2xl font-bold mb-6 ${darkMode ? "text-orange-400" : "text-orange-600"}`}>
                      👤 Student Details
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-orange-300" : "text-orange-600"}`}>
                            Name
                          </label>
                          <p className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {selectedTaskStudent.name}
                          </p>
                        </div>
                        <div>
                          <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-orange-300" : "text-orange-600"}`}>
                            Email
                          </label>
                          <p className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {selectedTaskStudent.email}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-orange-300" : "text-orange-600"}`}>
                            Course
                          </label>
                          <p className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {selectedTaskStudent.courseName}
                          </p>
                        </div>
                        <div>
                          <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-orange-300" : "text-orange-600"}`}>
                            Batch Time
                          </label>
                          <p className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {selectedTaskStudent.batchTime}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-orange-300" : "text-orange-600"}`}>
                            Personal Contact
                          </label>
                          <p className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {selectedTaskStudent.personalContact || "Not set"}
                          </p>
                        </div>
                        <div>
                          <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-orange-300" : "text-orange-600"}`}>
                            Parent Contact
                          </label>
                          <p className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {selectedTaskStudent.parentContact || "Not set"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h4 className={`text-2xl font-bold ${darkMode ? "text-orange-400" : "text-orange-600"}`}>
                        📝 Tasks ({selectedTaskStudent.tasks.length})
                      </h4>
                      <button
                        onClick={() => exportIndividualStudentTasks(selectedTaskStudent)}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg transition-all text-sm"
                      >
                        <FaDownload /> Export Tasks
                      </button>
                    </div>
                    {selectedTaskStudent.tasks.length === 0 ? (
                      <p className={`text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        No tasks assigned to this student
                      </p>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {selectedTaskStudent.tasks.map((task) => (
                          <div
                            key={task._id}
                            className={`p-4 rounded-2xl ${darkMode ? "bg-white/5 border border-white/10" : "bg-gray-50 border border-gray-200"}`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 mr-4">
                                <p className={`font-semibold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>{task.title}</p>
                                <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                  {task.description}
                                </p>
                                {task.submission?.submittedAt && (
                                  <div className={`mt-3 p-3 rounded-xl border ${darkMode ? "bg-black/20 border-white/5" : "bg-white border-gray-100"} text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                    <p className="text-green-500 font-semibold mb-2">
                                      ✅ Submitted: {new Date(task.submission.submittedAt).toLocaleDateString()}
                                    </p>
                                    {task.submission.description && (
                                      <p className="mb-2">
                                        <strong className={darkMode ? "text-gray-200" : "text-gray-700"}>Notes:</strong> {task.submission.description}
                                      </p>
                                    )}
                                    {task.submission.gitLink && (
                                      <p className="mb-2">
                                        <strong className={darkMode ? "text-gray-200" : "text-gray-700"}>Git:</strong>{" "}
                                        <a
                                          href={task.submission.gitLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-500 underline hover:text-blue-600 break-all"
                                        >
                                          {task.submission.gitLink}
                                        </a>
                                      </p>
                                    )}
                                    {task.submission.screenshots && Array.isArray(task.submission.screenshots) && task.submission.screenshots.length > 0 && (
                                      <div className="mt-3">
                                        <strong className={`block mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Files:</strong>
                                        <div className="flex flex-wrap gap-3">
                                        {task.submission.screenshots.map((screenshot, index) => (
                                          <div key={index} className="flex flex-col items-start bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                                            {screenshot.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                              <img
                                                src={`${API}${screenshot}`}
                                                alt={`File ${index + 1}`}
                                                className="w-32 h-24 object-cover rounded shadow-sm border border-gray-200 dark:border-gray-700"
                                              />
                                            ) : (
                                              <div className="w-32 h-24 bg-black/10 dark:bg-white/10 rounded flex items-center justify-center text-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                                📄
                                              </div>
                                            )}
                                            <a
                                              href={`${API}${screenshot}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-500 hover:text-blue-600 underline mt-2 text-xs font-medium text-center w-full"
                                            >
                                              View File {index + 1}
                                            </a>
                                          </div>
                                        ))}
                                        </div>
                                      </div>
                                    )}
                                    {task.submission.screenshot && !Array.isArray(task.submission.screenshot) && (
                                      <div className="mt-3">
                                        <strong className={`block mb-2 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>File:</strong>
                                        <div className="flex flex-col items-start bg-black/5 dark:bg-white/5 p-2 rounded-lg inline-block">
                                        {task.submission.screenshot.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                          <img
                                            src={`${API}${task.submission.screenshot}`}
                                            alt="File"
                                            className="w-32 h-24 object-cover rounded shadow-sm border border-gray-200 dark:border-gray-700"
                                          />
                                        ) : (
                                          <div className="w-32 h-24 bg-black/10 dark:bg-white/10 rounded flex items-center justify-center text-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                            📄
                                          </div>
                                        )}
                                        <a
                                          href={`${API}${task.submission.screenshot}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-500 hover:text-blue-600 underline mt-2 text-xs font-medium text-center w-full"
                                        >
                                          View File
                                        </a>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                {task.review?.mark ? (
                                  <span className="flex items-center gap-1 text-yellow-500 font-bold bg-yellow-500/10 px-3 py-1 rounded-lg">
                                    <FaStar /> {task.review.mark}/100
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium px-2 py-1 rounded bg-gray-500/10 text-gray-500">
                                    Not Reviewed
                                  </span>
                                )}
                                <button
                                  onClick={() => {
                                    setReviewingTask(task._id);
                                    setReviewForm({
                                      feedback: task.review?.feedback || "",
                                      mark: task.review?.mark || "",
                                    });
                                  }}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all w-full mt-2"
                                >
                                  {task.review?.mark ? "Update Review" : "Review Task"}
                                </button>
                              </div>
                            </div>

                            {reviewingTask === task._id && (
                              <div className={`mt-4 p-4 rounded-xl border ${darkMode ? "bg-black/20 border-white/10" : "bg-white border-blue-100 shadow-inner"}`}>
                                <h5 className={`font-semibold mb-3 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                                  {task.review?.mark ? "Update Review" : "Provide Review"}
                                </h5>
                                <div className="space-y-3">
                                  <div>
                                    <label className={`block text-xs font-bold mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                      Mark (0-100)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={reviewForm.mark}
                                      onChange={(e) => setReviewForm({ ...reviewForm, mark: e.target.value })}
                                      placeholder="e.g. 85"
                                      className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${darkMode ? "bg-white/5 border-white/20 text-white placeholder-gray-500" : "bg-gray-50 border-gray-300 placeholder-gray-400 focus:bg-white"}`}
                                    />
                                  </div>
                                  <div>
                                    <label className={`block text-xs font-bold mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                      Feedback
                                    </label>
                                    <textarea
                                      value={reviewForm.feedback}
                                      onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                                      placeholder="Provide constructive feedback..."
                                      rows={3}
                                      className={`w-full p-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${darkMode ? "bg-white/5 border-white/20 text-white placeholder-gray-500" : "bg-gray-50 border-gray-300 placeholder-gray-400 focus:bg-white"}`}
                                    />
                                  </div>
                                  <div className="flex gap-3 pt-2">
                                    <button
                                      onClick={() => handleReviewTask(task._id)}
                                      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all"
                                    >
                                      Submit
                                    </button>
                                    <button
                                      onClick={() => setReviewingTask(null)}
                                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center p-8 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <div className={`text-7xl mb-6 ${darkMode ? "text-gray-600" : "text-gray-300"}`}>
                      📝
                    </div>
                    <h3 className={`text-2xl font-bold mb-3 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      No Student Selected
                    </h3>
                    <p className={`text-base ${darkMode ? "text-gray-500" : "text-gray-500"} max-w-xs mx-auto`}>
                      Select a student from the list on the left to view their details and manage their tasks.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ================= VIEW MODAL ================= */}
      {/* FIXED VIEW MODAL - Shows ALL data */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl`}
          >
            <div className="flex justify-between items-center mb-10">
              <h3
                className={`text-4xl font-bold ${darkMode ? "bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent" : "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"}`}
              >
                {viewUser.role === "teacher" ? "👨‍🏫 Teacher" : "👨‍🎓 Student"}{" "}
                Details
              </h3>
              <button
                onClick={() => setViewUser(null)}
                className={`text-4xl p-3 rounded-2xl transition-all ${darkMode ? "hover:text-red-400 hover:bg-white/10" : "hover:text-red-600 hover:bg-blue-100"}`}
              >
                ×
              </button>
            </div>

            <div
              className={`grid md:grid-cols-2 gap-8 text-xl ${darkMode ? "" : "text-gray-900"}`}
            >
              {/* LEFT COLUMN - BASIC INFO */}
              <div className="space-y-4">
                <p>
                  <span
                    className={`font-bold ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}
                  >
                    👤 Name:
                  </span>{" "}
                  {viewUser.name}
                </p>
                <p>
                  <span
                    className={`font-bold ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}
                  >
                    📧 Email:
                  </span>{" "}
                  {viewUser.email}
                </p>
                <p>
                  <span
                    className={`font-bold ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}
                  >
                    🎭 Role:
                  </span>
                  <span
                    className={`ml-2 px-4 py-2 rounded-full text-sm font-bold ${
                      viewUser.role === "super"
                        ? darkMode
                          ? "bg-purple-500/30 text-purple-300"
                          : "bg-purple-100 text-purple-700"
                        : viewUser.role === "teacher"
                          ? darkMode
                            ? "bg-pink-500/30 text-pink-300"
                            : "bg-pink-100 text-pink-700"
                          : darkMode
                            ? "bg-emerald-500/30 text-emerald-300"
                            : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {viewUser.role}
                  </span>
                </p>
              </div>

              {/* RIGHT COLUMN - ROLE SPECIFIC */}
              <div className="space-y-4">
                {viewUser.role === "teacher" && (
                  <>
                    <p>
                      <span
                        className={`font-bold ${darkMode ? "text-purple-400" : "text-purple-600"}`}
                      >
                        🎯 Specialization:
                      </span>
                      <span
                        className={`ml-2 px-4 py-2 rounded-2xl ${darkMode ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20" : "bg-purple-100 text-purple-700"}`}
                      >
                        {viewUser.specialization || "Not set"}
                      </span>
                    </p>
                    <p>
                      <span
                        className={`font-bold ${darkMode ? "text-purple-400" : "text-purple-600"}`}
                      >
                        ⏰ Schedule:
                      </span>
                      {viewUser.loginTimeFrom && viewUser.loginTimeTo
                        ? `${viewUser.loginTimeFrom} - ${viewUser.loginTimeTo}`
                        : "Not set"}
                    </p>
                    <p>
                      <span
                        className={`font-bold ${darkMode ? "text-purple-400" : "text-purple-600"}`}
                      >
                        📅 Joined:
                      </span>
                      {viewUser.joiningDate
                        ? new Date(viewUser.joiningDate).toLocaleDateString()
                        : "Not set"}
                    </p>
                    <p>
                      <span
                        className={`font-bold ${darkMode ? "text-purple-400" : "text-purple-600"}`}
                      >
                        👥 Assigned Students:
                      </span>
                      <span
                        className={`ml-2 ${darkMode ? "text-gray-200" : "text-gray-800"}`}
                      >
                        {getAssignedStudentsForTeacher(viewUser._id).length}
                      </span>
                    </p>
                  </>
                )}

                {viewUser.role === "student" && (
                  <>
                    <p>
                      <span
                        className={`font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}
                      >
                        📚 Course:
                      </span>{" "}
                      {viewUser.courseName || "Not assigned"}
                    </p>
                    <p>
                      <span
                        className={`font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}
                      >
                        🕒 Batch Time:
                      </span>
                      <span
                        className={`ml-2 px-4 py-2 rounded-xl ${darkMode ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"}`}
                      >
                        {viewUser.batchTime || "Not scheduled"}
                      </span>
                    </p>
                    <p>
                      <span
                        className={`font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}
                      >
                        📱 Contact:
                      </span>{" "}
                      {viewUser.personalContact}
                    </p>
                    <p>
                      <span
                        className={`font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}
                      >
                        👨‍👩‍👧 Parent:
                      </span>{" "}
                      {viewUser.parentContact || "Not provided"}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div
              className={`flex gap-4 mt-12 pt-8 border-t ${darkMode ? "border-white/20" : "border-blue-200"}`}
            >
              <button
                onClick={() => setViewUser(null)}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-8 py-4 rounded-2xl font-bold text-xl text-white transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ENHANCED CREATE USER MODAL ================= */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div
            className={`${darkMode ? "glass-card" : "bg-white border border-blue-200"} p-8 w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-3xl shadow-2xl`}
          >
            <h2
              className={`text-3xl font-bold mb-8 ${darkMode ? "bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent" : "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"}`}
            >
              Create {form.role === "teacher" ? "👨‍🏫 Teacher" : "👨‍🎓 Student"}
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
              required
            />

            {/* ============ TEACHER FIELDS ============ */}
            {form.role === "teacher" && (
              <div className="space-y-4 mb-8">
                {/* Specializations */}
                <div>
                  <label
                    className={`block text-lg font-semibold mb-3 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}
                  >
                    🎯 Specializations
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "MERN Stack",
                      "Python",
                      "Full Stack",
                      "Digital Marketing",
                      "AWS DevOps",
                      "Java Full Stack",
                      "Data Science",
                      "Cybersecurity",
                    ].map((spec) => (
                      <label
                        key={spec}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${darkMode ? "bg-white/5 border border-white/10 hover:bg-white/10" : "bg-blue-50 border border-blue-200 hover:bg-blue-100"}`}
                      >
                        <input
                          type="checkbox"
                          checked={form.specialization?.includes(spec) || false}
                          onChange={(e) => {
                            const specs = form.specialization
                              ? [...form.specialization.split(", ")]
                              : [];
                            if (e.target.checked) {
                              if (!specs.includes(spec)) specs.push(spec);
                            } else {
                              const index = specs.indexOf(spec);
                              if (index > -1) specs.splice(index, 1);
                            }
                            setForm({
                              ...form,
                              specialization: specs.join(", "),
                            });
                          }}
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Login Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-sm font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Login Time
                    </label>
                    <input
                      type="time"
                      value={form.loginTimeFrom}
                      onChange={(e) =>
                        setForm({ ...form, loginTimeFrom: e.target.value })
                      }
                      className={`w-full p-3 rounded-xl ${darkMode ? "bg-white/10 border-white/20" : "bg-blue-50 border-blue-300"} border focus:ring-2 focus:ring-purple-400`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Logout Time
                    </label>
                    <input
                      type="time"
                      value={form.loginTimeTo}
                      onChange={(e) =>
                        setForm({ ...form, loginTimeTo: e.target.value })
                      }
                      className={`w-full p-3 rounded-xl ${darkMode ? "bg-white/10 border-white/20" : "bg-blue-50 border-blue-300"} border focus:ring-2 focus:ring-purple-400`}
                    />
                  </div>
                </div>

                <input
                  type="date"
                  placeholder="Joining Date"
                  value={form.joiningDate}
                  onChange={(e) =>
                    setForm({ ...form, joiningDate: e.target.value })
                  }
                  className={`w-full p-4 rounded-xl ${darkMode ? "bg-white/10 border-white/20 text-white" : "bg-blue-50 border-blue-300 text-gray-900"} border focus:ring-2 focus:ring-purple-400`}
                />
              </div>
            )}

            {/* ============ STUDENT FIELDS ============ */}
            {/* COMPLETE STUDENT FIELDS - Replace your student form section */}
            {form.role === "student" && (
              <div className="space-y-6 mb-12">
                {/* Course Selection */}
                <div>
                  <label
                    className={`block text-3xl font-bold mb-6 text-center ${darkMode ? "text-green-400" : "text-green-600"}`}
                  >
                    📚 IT Courses
                  </label>
                  <select
                    value={form.courseName}
                    onChange={(e) =>
                      setForm({ ...form, courseName: e.target.value })
                    }
                    className={`w-full p-6 text-xl rounded-3xl border-2 shadow-2xl hover:border-white/50 transition-all focus:outline-none focus:ring-4 focus:ring-green-400/60 ${
                      darkMode
                        ? "bg-gradient-to-br from-slate-800/90 to-gray-900/90 border-white/30 text-white placeholder-gray-300 focus:border-green-400/70"
                        : "bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 text-gray-900 placeholder-gray-600 focus:border-green-600"
                    }`}
                  >
                    <option
                      value=""
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      📚 Select Course
                    </option>
                    <option
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      MERN Stack Development
                    </option>
                    <option
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      Python Full Stack
                    </option>
                    <option
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      Java Full Stack
                    </option>
                    <option
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      Digital Marketing
                    </option>
                    <option
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      AWS DevOps
                    </option>
                    <option
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      Data Science & AI
                    </option>
                    <option
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      Cybersecurity
                    </option>
                    <option
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      Mobile App Development
                    </option>
                  </select>
                </div>

                {/* Batch Time */}
                <div>
                  <label
                    className={`block text-3xl font-bold mb-6 text-center ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                  >
                    🕒 Batch Time
                  </label>
                  <select
                    value={form.batchTime}
                    onChange={(e) =>
                      setForm({ ...form, batchTime: e.target.value })
                    }
                    className={`w-full p-6 text-xl rounded-3xl border-2 shadow-2xl hover:border-white/50 transition-all focus:outline-none focus:ring-4 focus:ring-blue-400/60 ${
                      darkMode
                        ? "bg-gradient-to-br from-slate-800/90 to-gray-900/90 border-white/30 text-white placeholder-gray-300 focus:border-blue-400/70"
                        : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 text-gray-900 placeholder-gray-600 focus:border-blue-600"
                    }`}
                  >
                    <option
                      value=""
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      🕒 Select Time Slot
                    </option>
                    <option
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      9:00 AM - 10:00 AM
                    </option>
                    <option
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      10:00 AM - 11:00 AM
                    </option>
                    <option
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      11:00 AM - 12:00 PM
                    </option>
                    <option
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      12:00 PM - 01:00 PM
                    </option>
                    <option
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      01:00 PM - 02:00 PM
                    </option>
                    <option
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      02:00 PM - 03:00 PM
                    </option>
                    <option
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      03:00 PM - 04:00 PM
                    </option>
                    <option
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      04:00 PM - 05:00 PM
                    </option>
                    <option
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      05:00 PM - 06:00 PM
                    </option>
                    <option
                      className={
                        darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-gray-900"
                      }
                    >
                      06:00 PM - 07:00 PM
                    </option>
                  </select>
                </div>

                {/* Batch Days */}
                <div>
                  <label
                    className={`block text-3xl font-bold mb-6 text-center ${darkMode ? "text-purple-400" : "text-purple-600"}`}
                  >
                    📅 Batch Days
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      "sunday",
                      "monday",
                      "tuesday",
                      "wednesday",
                      "thursday",
                      "friday",
                      "saturday",
                    ].map((day) => (
                      <label
                        key={day}
                        className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                          darkMode
                            ? "bg-white/5 border border-white/10 hover:bg-white/10"
                            : "bg-purple-50 border border-purple-200 hover:bg-purple-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.batchDay?.includes(day) || false}
                          onChange={(e) => {
                            const currentDays = form.batchDay || [];
                            if (e.target.checked) {
                              setForm({
                                ...form,
                                batchDay: [...currentDays, day],
                              });
                            } else {
                              setForm({
                                ...form,
                                batchDay: currentDays.filter((d) => d !== day),
                              });
                            }
                          }}
                          className="w-5 h-5 flex-shrink-0 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-lg capitalize font-medium">
                          {day}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Joining Date */}
                <div>
                  <label
                    className={`block text-xl font-bold mb-4 ${darkMode ? "text-yellow-400" : "text-yellow-600"}`}
                  >
                    📅 Joining Date
                  </label>
                  <input
                    type="date"
                    value={form.joiningDate}
                    onChange={(e) =>
                      setForm({ ...form, joiningDate: e.target.value })
                    }
                    className={`w-full p-6 text-xl rounded-3xl border-2 shadow-2xl hover:border-white/50 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400/60 ${
                      darkMode
                        ? "bg-gradient-to-br from-slate-800/90 to-gray-900/90 border-white/30 text-white focus:border-yellow-400/70"
                        : "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400 text-gray-900 focus:border-yellow-600"
                    }`}
                  />
                </div>
                <div className="mt-6">
                  <label className="block text-xl font-bold mb-4 text-orange-400">
                    👨‍🏫 Assign Teacher
                  </label>
                  <select
                    value={form.teacherId}
                    onChange={(e) =>
                      setForm({ ...form, teacherId: e.target.value })
                    }
                    className="w-full p-6 text-xl rounded-3xl 
             bg-gradient-to-br from-slate-800/90 to-gray-900/90 
             border-2 border-white/50 
             text-white placeholder-gray-300 
             focus:outline-none focus:ring-4 focus:ring-orange-400/60 
             focus:border-orange-400/70 shadow-2xl
             hover:border-white/60 hover:bg-slate-800/100"
                  >
                    <option value="" className="bg-slate-800 text-white">
                      👨‍🏫 Select Teacher
                    </option>
                    {teachers.map((teacher) => (
                      <option
                        key={teacher._id}
                        value={teacher._id}
                        className="bg-slate-800 text-white"
                      >
                        {teacher.name} - {teacher.specialization || "General"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contact */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <input
                    type="tel"
                    placeholder="📱 Personal Contact"
                    value={form.personalContact}
                    onChange={(e) =>
                      setForm({ ...form, personalContact: e.target.value })
                    }
                    className="p-6 text-xl rounded-3xl bg-white/10 border-2 border-white/20 focus:ring-4 focus:ring-emerald-400/50 shadow-xl"
                  />
                  <input
                    type="tel"
                    placeholder="👨‍👩‍👧 Parent Contact"
                    value={form.parentContact}
                    onChange={(e) =>
                      setForm({ ...form, parentContact: e.target.value })
                    }
                    className="p-6 text-xl rounded-3xl bg-white/10 border-2 border-white/20 focus:ring-4 focus:ring-emerald-400/50 shadow-xl"
                  />
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex gap-4 pt-6">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setForm({
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
                }}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 px-8 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all"
              >
                ❌ Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl glow transition-all flex items-center justify-center gap-2"
              >
                ✅ Create {form.role.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
