import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaTrash, FaEye, FaDownload, FaFilePdf, FaPlus, FaClock, FaEdit } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({});
  const [savingStudent, setSavingStudent] = useState(false);

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherName, setTeacherName] = useState('Teacher');
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '', personalContact: '', parentContact: '' });
  const [savingTeacher, setSavingTeacher] = useState(false);

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceFrom, setAttendanceFrom] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceTo, setAttendanceTo] = useState(new Date().toISOString().split('T')[0]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  
  // ATTENDANCE DAILY REPORT STATES
  const [showAttendanceReportModal, setShowAttendanceReportModal] = useState(false);
  const [attendanceReportData, setAttendanceReportData] = useState(null);
  const [attendanceReportLoading, setAttendanceReportLoading] = useState(false);
  const [editingAttendanceReport, setEditingAttendanceReport] = useState(false);
  const [attendanceReportSlots, setAttendanceReportSlots] = useState([]);
  const [attendanceReportDescription, setAttendanceReportDescription] = useState('');
  
  // DAILY REPORT STATES
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportSlots, setReportSlots] = useState([]);
  const [reportDescription, setReportDescription] = useState('');
  const [loadingReport, setLoadingReport] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  
  // EXAM STATES
  const [teacherExams, setTeacherExams] = useState([]);
  const [showExamModal, setShowExamModal] = useState(false);
  const [examForm, setExamForm] = useState({
    chapter: '',
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]
  });
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsExam, setResultsExam] = useState(null);
  const [examResults, setExamResults] = useState([]);

  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');
  const timeSlots = ['9:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-1:00', '1:00-2:00', '2:00-3:00', '3:00-4:00', '4:00-5:00', '5:00-6:00', '6:00-7:00'];

  const buildDefaultReportSlots = () =>
    timeSlots.map((slot) => ({ slot, completed: false, description: '' }));

  const handleSaveStudent = async () => {
    try {
      setSavingStudent(true);
      await axios.put(`${API}/users/${studentForm._id}`, studentForm, {
        headers: { Authorization: token },
      });
      toast.success('Student updated');
      fetchStudents();
      setEditingStudent(false);
      setShowStudentModal(false);
    } catch (err) {
      toast.error('Failed to update student');
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
      toast.success('Profile updated');
      setTeacherName(res.data.name || teacherName);
      localStorage.setItem('userName', res.data.name || '');
      setShowTeacherModal(false);
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSavingTeacher(false);
    }
  };

  const applyAttendanceRecord = (recordStudents) => {
    const presentIds = new Set(
      (recordStudents || [])
        .filter((s) => s.present)
        .map((s) => s.studentId?.toString?.() || s.studentId),
    );
    setStudents((prev) =>
      prev.map((st) => ({
        ...st,
        attendance: { present: presentIds.has(st._id) },
      })),
    );
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/teacher/my-students`, {
        headers: { Authorization: token },
        timeout: 15000
      });
      setStudents(
        (res.data || []).map((s) => ({
          ...s,
          attendance: { present: false },
        })),
      );
    } catch (err) {
      toast.error('Failed to load students');
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
      console.error('Attendance fetch error:', err);
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
        ? res.data.timeSlots.map((s) => ({ ...s, description: s.description || '' }))
        : buildDefaultReportSlots();
      setAttendanceReportSlots(existing);
      setAttendanceReportDescription(res.data?.description || '');
      setEditingAttendanceReport(false);
    } catch (err) {
      toast.error('Failed to load daily report');
      setAttendanceReportSlots(buildDefaultReportSlots());
      setAttendanceReportDescription('');
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
          description: attendanceReportDescription 
        },
        { headers: { Authorization: token } },
      );
      toast.success('Daily report saved!');
      fetchAttendanceReport(attendanceDate);
      setEditingAttendanceReport(false);
    } catch (err) {
      toast.error(err.response?.data || 'Failed to save daily report');
    } finally {
      setSavingAttendance(false);
    }
  };

  // export both attendance & daily report into a PDF; accepts optional date parameter so it can be used from either tab
  const exportAttendanceToPDF = async (dateParam) => {
    // this function exports attendance + daily report (used by report tab)
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Title
      doc.setFontSize(18);
      doc.text('Attendance Report', pageWidth / 2, 20, { align: 'center' });
      
      // Date and Teacher Info
      doc.setFontSize(11);
      const targetDate = new Date(dateParam || attendanceDate);
      doc.text(`Date: ${targetDate.toLocaleDateString()}`, 20, 35);
      
      // use teacherName from upper scope
      doc.text(`Teacher: ${teacherName}`, 20, 45);
      
      // Attendance table - export all students for chosen date with present/absent status
      const attendanceTableData = students.map(s => [
        s.name,
        s.courseName,
        s.attendance?.present ? 'Present' : 'Absent'
      ]);
      if (attendanceTableData.length > 0) {
        autoTable(doc, {
          head: [['Student Name', 'Course', 'Status']],
          body: attendanceTableData,
          startY: 60,
          theme: 'grid',
          headStyles: { fillColor: [76, 175, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [240, 240, 240] },
          margin: { left: 20, right: 20 }
        });
      }
      
      // Daily Report section
      let yPosition = doc.lastAutoTable.finalY + 20;
      if (attendanceReportSlots.length > 0) {
        doc.setFontSize(14);
        doc.text('Daily Report', 20, yPosition);
        yPosition += 15;
        
        const reportTableData = attendanceReportSlots.map(ts => [
          ts.slot,
          ts.completed ? 'Yes' : 'No',
          ts.description || '-'
        ]);
        
        autoTable(doc, {
          head: [['Time Slot', 'Completed', 'Description']],
          body: reportTableData,
          startY: yPosition,
          theme: 'grid',
          headStyles: { fillColor: [66, 133, 244], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [240, 245, 255] },
          columnStyles: { 2: { cellWidth: 100 } },
          margin: { left: 20, right: 20 },
          didDrawPage: function(data) {
            // Check if we need more space
            if (data.pageCount > 1) {
              yPosition += 50;
            }
          }
        });
        
        if (attendanceReportDescription) {
          yPosition = doc.lastAutoTable.finalY + 15;
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = 20;
          }
          doc.setFontSize(12);
          doc.text('Overall Notes:', 20, yPosition);
          yPosition += 10;
          const splitText = doc.splitTextToSize(attendanceReportDescription, pageWidth - 40);
          doc.setFontSize(10);
          doc.text(splitText, 20, yPosition);
        }
      }
      
      // Footer
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
      
      const filename = `attendance-report-${attendanceDate}.pdf`;
      doc.save(filename);
      toast.success('PDF exported successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to export PDF');
    }
  };

  // helper: export ONLY attendance rows (no daily report)
  const exportAttendanceOnlyPDF = async (dateParam) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      // title + header
      doc.setFontSize(18);
      doc.text('Attendance Sheet', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(11);
      const targetDate = new Date(dateParam || attendanceDate);
      doc.text(`Date: ${targetDate.toLocaleDateString()}`, 20, 35);
      doc.text(`Teacher: ${teacherName}`, 20, 45);
      const attendanceTableData = students.map(s => [
        s.name,
        s.courseName,
        s.attendance?.present ? 'Present' : 'Absent'
      ]);
      if (attendanceTableData.length > 0) {
        autoTable(doc, {
          head: [['Student Name', 'Course', 'Status']],
          body: attendanceTableData,
          startY: 60,
          theme: 'grid',
          headStyles: { fillColor: [76, 175, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [240, 240, 240] },
          margin: { left: 20, right: 20 }
        });
      }
      const filename = `attendance-all-${attendanceDate}.pdf`;
      doc.save(filename);
      toast.success('PDF exported successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to export PDF');
    }
  };

  // export attendance for a range of dates
  const exportAttendanceRangePDF = async () => {
    if (!attendanceFrom || !attendanceTo) {
      toast.error('Please select both from and to dates');
      return;
    }
    try {
      setLoadingAttendance(true);
      const res = await axios.get(`${API}/teacher/attendance/range`, {
        params: { from: attendanceFrom, to: attendanceTo },
        headers: { Authorization: token },
      });
      const records = res.data || [];
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(18);
      doc.text('Attendance Range Report', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(11);
      doc.text(`From: ${new Date(attendanceFrom).toLocaleDateString()}`, 20, 35);
      doc.text(`To: ${new Date(attendanceTo).toLocaleDateString()}`, 20, 45);
      doc.text(`Teacher: ${teacherName}`, 20, 55);
      let y = 70;
      records.forEach((rec, idx) => {
        const dateStr = new Date(rec.date).toLocaleDateString();
        doc.setFontSize(12);
        doc.text(`Date: ${dateStr}`, 20, y);
        y += 6;
        const tableData = rec.students.map(s => {
          const stu = students.find(st => st._id === s.studentId || st._id === (s.studentId?._id) );
          const name = stu ? stu.name : 'Unknown';
          return [name, s.present ? 'Present' : 'Absent'];
        });
        autoTable(doc, {
          head: [['Student', 'Status']],
          body: tableData,
          startY: y,
          theme: 'grid',
          margin: { left: 20, right: 20 }
        });
        y = doc.lastAutoTable.finalY + 10;
        if (y > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage();
          y = 20;
        }
      });
      const filename = `attendance-${attendanceFrom}-to-${attendanceTo}.pdf`;
      doc.save(filename);
      toast.success('Range PDF exported');
    } catch (err) {
      console.error('Range export error', err);
      toast.error('Failed to export range');
    } finally {
      setLoadingAttendance(false);
    }
  };

  // export only daily report (without attendance)
  const exportDailyReportPDF = async (dateParam) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFontSize(18);
      doc.text('Daily Report', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(11);
      const targetDate = new Date(dateParam || reportDate);
      doc.text(`Date: ${targetDate.toLocaleDateString()}`, 20, 35);
      doc.text(`Teacher: ${teacherName}`, 20, 45);
      const slots = reportSlots.length ? reportSlots : buildDefaultReportSlots();
      const tableData = slots.map(ts => [ts.slot, ts.completed ? 'Yes' : 'No', ts.description || '-']);
      autoTable(doc, {
        head: [['Time Slot', 'Completed', 'Description']],
        body: tableData,
        startY: 60,
        theme: 'grid',
        margin: { left: 20, right: 20 }
      });
      if (reportDescription) {
        let yPos = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(12);
        doc.text('Notes:', 20, yPos);
        yPos += 10;
        doc.setFontSize(10);
        doc.text(doc.splitTextToSize(reportDescription, pageWidth - 40), 20, yPos);
      }
      const filename = `daily-report-${reportDate}.pdf`;
      doc.save(filename);
      toast.success('Daily report exported');
    } catch (err) {
      console.error('Daily report export error', err);
      toast.error('Failed to export report');
    }
  };

  // export a single student's attendance for the selected date
  const exportSingleStudentPDF = async (student) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      // header
      doc.setFontSize(18);
      doc.text('Student Attendance', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(11);
      const targetDate = new Date(attendanceDate);
      doc.text(`Date: ${targetDate.toLocaleDateString()}`, 20, 35);
      doc.text(`Teacher: ${teacherName}`, 20, 45);
      doc.text(`Student: ${student.name}`, 20, 55);
      doc.text(`Course: ${student.courseName}`, 20, 65);
      doc.text(`Status: ${student.attendance?.present ? 'Present' : 'Absent'}`, 20, 75);
      const filename = `attendance-${student.name.replace(/\s+/g,'_')}-${attendanceDate}.pdf`;
      doc.save(filename);
      toast.success('Individual PDF exported!');
    } catch (err) {
      console.error('Single student PDF error', err);
      toast.error('Failed to export student PDF');
    }
  };

  const fetchTeacherExams = async () => {
    try {
      const res = await axios.get(`${API}/exams/teacher`, {
        headers: { Authorization: token }
      });
      setTeacherExams(res.data);
    } catch (err) {
      toast.error('Failed to load exams');
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
      toast.error('Failed to load results');
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
      setTeacherName(res.data.name || 'Teacher');
      setTeacherForm({
        name: res.data.name || '',
        email: res.data.email || '',
        personalContact: res.data.personalContact || '',
        parentContact: res.data.parentContact || '',
      });
    } catch (err) {
      console.error('Profile fetch error', err);
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
        ? res.data.timeSlots.map((s) => ({ ...s, description: s.description || '' }))
        : buildDefaultReportSlots();
      setReportSlots(existing);
      setReportDescription(res.data?.description || '');
    } catch (err) {
      toast.error('Failed to load daily report');
      setReportSlots(buildDefaultReportSlots());
      setReportDescription('');
    } finally {
      setLoadingReport(false);
    }
  };

  const saveDailyReport = async () => {
    try {
      setSavingReport(true);
      await axios.post(
        `${API}/teacher/daily-report`,
        { date: reportDate, timeSlots: reportSlots, description: reportDescription },
        { headers: { Authorization: token } },
      );
      toast.success('Daily report saved!');
    } catch (err) {
      toast.error(err.response?.data || 'Failed to save daily report');
    } finally {
      setSavingReport(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    if (activeTab !== 'report') return;
    fetchDailyReport(reportDate);
  }, [activeTab, reportDate]);

  const markAttendance = async () => {
    const presentStudents = students.filter(s => s.attendance?.present).map(s => s._id);
    if (presentStudents.length === 0) {
      toast.error('Select at least one student');
      return;
    }
    try {
      setSavingAttendance(true);
      await axios.post(`${API}/teacher/attendance/mark`, {
        date: attendanceDate,
        students: presentStudents
      }, { headers: { Authorization: token } });
      toast.success(`${presentStudents.length} students marked present!`);
      fetchAttendanceForDate(attendanceDate);
    } catch (err) {
      toast.error('Failed to save attendance');
    } finally {
      setSavingAttendance(false);
    }
  };

  const toggleAttendance = (studentId) => {
    setStudents(students.map(student =>
      student._id === studentId
        ? { ...student, attendance: { present: !student.attendance?.present } }
        : student
    ));
  };

  const addQuestion = () => {
    setExamForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { question: '', options: ['', '', '', ''], correctAnswer: 0 },
      ],
    }));
  };

  const handleExamSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/exams/create`, examForm, {
        headers: { Authorization: token }
      });
      toast.success('Exam created successfully!');
      setShowExamModal(false);
      setExamForm({ chapter: '', questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }] });
      fetchTeacherExams();
    } catch (err) {
      toast.error(err.response?.data || 'Failed to create exam');
    }
  };

  const enableStudentsForExam = (examId) => {
    setSelectedExam(examId);
    setShowEnableModal(true);
  };

  const confirmEnableStudents = async () => {
    try {
      await axios.post(`${API}/exams/enable/${selectedExam}`, {
        studentIds: selectedStudents
      }, { headers: { Authorization: token } });
      toast.success('Students enabled for exam!');
      setShowEnableModal(false);
      setSelectedStudents([]);
      fetchTeacherExams();
    } catch (err) {
      toast.error('Failed to enable students');
    }
  };

  const openStudentModal = (student, edit = false) => {
    setSelectedStudent(student);
    setStudentForm({ ...student });
    setEditingStudent(edit);
    setShowStudentModal(true);
  };

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.courseName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 flex items-center justify-center p-8">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center max-w-md w-full">
          <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-2xl font-bold text-emerald-400">Loading your dashboard...</p>
          <p className="text-gray-400 mt-2">Connecting to database</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 p-4 sm:p-8 text-white">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                {teacherName}'s Dashboard
              </h1>
              <p className="text-xl text-gray-300">No. of students: {students.length}</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/';
              }}
              className="px-8 py-3 bg-red-500/20 hover:bg-red-500/40 border border-red-400/50 rounded-2xl text-red-300 hover:text-red-100 transition-all flex items-center gap-2"
            >
              Logout
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-2 mb-8 shadow-xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { id: 'students', icon: '👥', label: 'Students' },
              { id: 'attendance', icon: '📋', label: 'Attendance' },
              { id: 'report', icon: '📊', label: 'Daily Report' },
              { id: 'exams', icon: '📝', label: 'Chapter Exams' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-6 rounded-2xl font-bold text-lg transition-all flex flex-col items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-2xl scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white hover:scale-105'
                }`}
              >
                <span className="text-2xl">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 p-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:ring-4 focus:ring-emerald-500/50"
              />
            </div>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-2xl text-gray-400 mb-4">No students found</p>
                <button onClick={fetchStudents} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold">
                  Refresh Students
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/10 rounded-2xl">
                      <th className="p-4 rounded-l-2xl">Name</th>
                      <th className="p-4">Course</th>
                      <th className="p-4">Fee Status</th>
                      <th className="p-4 rounded-r-2xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => (
                      <tr key={student._id} className="border-b border-white/10 hover:bg-white/10">
                        <td className="p-4 font-semibold">{student.name}</td>
                        <td className="p-4">{student.courseName}</td>
                        <td className="p-4">
                          <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                            student.fee?.balance === 0
                              ? 'bg-green-500/30 text-green-400 border border-green-500/50'
                              : 'bg-red-500/30 text-red-400 border border-red-500/50'
                          }`}>
                            {student.fee?.balance === 0 ? 'PAID' : 'PENDING'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openStudentModal(student)}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/40 rounded-xl text-blue-400"
                            >
                              <FaEye size={16} />
                            </button>
                            <button
                              onClick={() => openStudentModal(student, true)}
                              className="p-2 bg-yellow-500/20 hover:bg-yellow-500/40 rounded-xl text-yellow-400"
                            >
                              <FaEdit size={16} />
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
        {activeTab === 'attendance' && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="space-y-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-lg font-semibold mb-3">Date</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl text-white focus:ring-4 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => exportAttendanceOnlyPDF(attendanceDate)}
                    disabled={students.length === 0}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white font-bold py-3 px-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 mb-1"
                  >
                    <FaFilePdf /> Export All
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                <div>
                  <label className="block text-lg font-semibold mb-3">From</label>
                  <input
                    type="date"
                    value={attendanceFrom}
                    onChange={(e) => setAttendanceFrom(e.target.value)}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl text-white focus:ring-4 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-lg font-semibold mb-3">To</label>
                  <input
                    type="date"
                    value={attendanceTo}
                    onChange={(e) => setAttendanceTo(e.target.value)}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl text-white focus:ring-4 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    onClick={exportAttendanceRangePDF}
                    disabled={!attendanceFrom || !attendanceTo || students.length === 0}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-4 px-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <FaFilePdf /> Export Range
                  </button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div>
                {loadingAttendance && (
                  <div className="text-gray-300 text-center py-4">
                    Loading attendance...
                  </div>
                )}
              </div>
              <button
                onClick={() => markAttendance()}
                disabled={savingAttendance || students.length === 0}
                className="bg-gradient-to-r from-emerald-500 to-green-600 disabled:opacity-50 text-white font-bold py-4 px-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
              >
                {savingAttendance ? 'Saving...' : `Mark Attendance (${students.filter(s => s.attendance?.present).length})`}
              </button>
              <button
                onClick={() => exportAttendanceOnlyPDF(attendanceDate)}
                disabled={students.length === 0}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white font-bold py-4 px-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
              >
                <FaFilePdf /> Export All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map(student => (
                <div key={student._id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl hover:scale-105 transition-all">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center text-xl font-bold">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-xl mb-2 text-center">{student.name}</h3>
                  <p className="text-gray-400 mb-4 text-center">{student.courseName}</p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => toggleAttendance(student._id)}
                      className={`w-full py-3 px-6 rounded-xl font-bold transition-all ${
                        student.attendance?.present
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                          : 'bg-white/10 hover:bg-white/20 text-gray-300 border border-white/20'
                      }`}
                    >
                      {student.attendance?.present ? 'Present' : 'Mark Present'}
                    </button>
                    <button
                      onClick={() => exportSingleStudentPDF(student)}
                      className="w-full py-2 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-white flex items-center justify-center gap-2"
                    >
                      <FaFilePdf /> Export
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DAILY REPORT TAB */}
        {activeTab === 'report' && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-8">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Daily Report
              </h3>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="p-4 bg-white/10 border border-white/20 rounded-2xl text-white focus:ring-4 focus:ring-emerald-500/50"
              />
              <div className="flex flex-col md:flex-row gap-2">
                <button
                  onClick={() => {
                    fetchAttendanceReport(reportDate);
                    setShowAttendanceReportModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                >
                  <FaEye /> View Daily Report
                </button>
                <button
                  onClick={() => exportDailyReportPDF(reportDate)}
                  disabled={reportSlots.length === 0 && !reportDescription}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-3 px-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                >
                  <FaFilePdf /> Export Report
                </button>
                <button
                  onClick={() => exportAttendanceToPDF(reportDate)}
                  disabled={students.length === 0}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white font-bold py-3 px-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                >
                  <FaFilePdf /> Export PDF
                </button>
              </div>
            </div>

            {loadingReport ? (
              <div className="text-center py-12 text-gray-300">Loading report...</div>
            ) : (
              <>
                <div className="space-y-4 mb-8">
                  {(reportSlots.length ? reportSlots : buildDefaultReportSlots()).map((ts, idx) => (
                    <div
                      key={ts.slot}
                      className="p-4 bg-white/5 rounded-2xl border border-white/20"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={!!ts.completed}
                            onChange={(e) => {
                              const next = [...(reportSlots.length ? reportSlots : buildDefaultReportSlots())];
                              next[idx] = { ...next[idx], completed: e.target.checked };
                              setReportSlots(next);
                            }}
                            className="w-5 h-5 rounded"
                          />
                          <span className="font-semibold">{ts.slot}</span>
                        </label>
                        <input
                          type="text"
                          value={ts.description || ''}
                          onChange={(e) => {
                            const next = [...(reportSlots.length ? reportSlots : buildDefaultReportSlots())];
                            next[idx] = { ...next[idx], description: e.target.value };
                            setReportSlots(next);
                          }}
                          className="flex-1 p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50"
                          placeholder="Description for this time (e.g., Topic covered)"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-8">
                  <label className="block text-lg font-semibold mb-3">Overall Notes (optional)</label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    rows={5}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl text-white focus:ring-4 focus:ring-emerald-500/50"
                    placeholder="Any extra notes for the day..."
                  />
                </div>

                <button
                  onClick={saveDailyReport}
                  disabled={savingReport}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 disabled:opacity-50 text-white font-bold py-4 px-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                >
                  {savingReport ? 'Saving...' : 'Save Daily Report'}
                </button>
              </>
            )}
          </div>
        )}

        {/* EXAMS TAB */}
        {activeTab === 'exams' && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Chapter Exams
              </h3>
              <button
                onClick={() => setShowExamModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 px-8 py-4 rounded-2xl font-bold text-lg glow shadow-2xl transition-all"
              >
                ➕ Create Exam
              </button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teacherExams.map(exam => (
                <div key={exam._id} className="glass-card p-6 hover:scale-105 transition-all">
                  <h4 className="text-xl font-bold mb-2">{exam.chapter}</h4>
                  <p className="text-indigo-400 mb-4">{exam.questions.length} Questions</p>
                  <p className="text-sm text-gray-400 mb-4">{exam.enabledStudents.length} Students Enabled</p>
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
          <div className="glass-card p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                Create Chapter Exam
              </h2>
              <button onClick={() => setShowExamModal(false)} className="text-4xl hover:text-red-400 p-3 rounded-2xl hover:bg-white/10 transition-all">
                ×
              </button>
            </div>
            <form onSubmit={handleExamSubmit}>
              <div className="mb-8">
                <label className="block text-xl font-semibold mb-4 text-indigo-400">Chapter Name</label>
                <input
                  type="text"
                  value={examForm.chapter}
                  onChange={(e) => setExamForm({ ...examForm, chapter: e.target.value })}
                  className="w-full p-6 text-xl rounded-3xl bg-white/10 border-2 border-white/20 focus:ring-4 focus:ring-indigo-400/50"
                  required
                />
              </div>
              
              <div className="space-y-6">
                {examForm.questions.map((q, qIndex) => (
                  <div key={qIndex} className="glass-card p-6">
                    <h4 className="font-bold text-xl mb-4">Question {qIndex + 1}</h4>
                    <input
                      type="text"
                      placeholder="Enter question..."
                      value={q.question}
                      onChange={(e) => {
                        const newQuestions = [...examForm.questions];
                        newQuestions[qIndex].question = e.target.value;
                        setExamForm({ ...examForm, questions: newQuestions });
                      }}
                      className="w-full p-4 mb-4 rounded-2xl bg-white/10 border border-white/20"
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
                              setExamForm({ ...examForm, questions: newQuestions });
                            }}
                            className="w-5 h-5 text-indigo-600"
                          />
                          <label htmlFor={`q${qIndex}o${oIndex}`} className="flex-1 p-3 rounded-xl bg-white/5 border border-white/20">
                            {String.fromCharCode(65 + oIndex)}. {option || `Option ${oIndex + 1}`}
                          </label>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newQuestions = [...examForm.questions];
                              newQuestions[qIndex].options[oIndex] = e.target.value;
                              setExamForm({ ...examForm, questions: newQuestions });
                            }}
                            className="flex-1 p-3 rounded-xl bg-white/5 border border-white/20 focus:ring-2 focus:ring-indigo-400/50"
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
                            questions: prev.questions.filter((_, i) => i !== qIndex),
                          }));
                        }}
                        className="mt-4 text-sm text-red-300 hover:text-red-200"
                      >
                        Remove Question
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 mt-12 pt-8 border-t border-white/20">
                <button
                  type="button"
                  onClick={addQuestion}
                  className="w-full md:w-auto bg-white/10 hover:bg-white/20 px-6 py-4 rounded-2xl font-bold text-lg"
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
          <div className="glass-card p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Enable Students
            </h3>
            <div className="space-y-4 mb-8">
              {students.slice(0, 10).map(student => (
                <label key={student._id} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/20">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudents([...selectedStudents, student._id]);
                      } else {
                        setSelectedStudents(selectedStudents.filter(id => id !== student._id));
                      }
                    }}
                    className="w-5 h-5 text-emerald-600 rounded"
                  />
                  <span>{student.name} - {student.courseName}</span>
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
          <div className="glass-card p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">
                Results: <span className="text-indigo-300">{resultsExam.chapter}</span>
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
              <div className="text-center py-12 text-gray-300">Loading results...</div>
            ) : examResults.length === 0 ? (
              <div className="text-center py-12 text-gray-300">No attempts yet.</div>
            ) : (
              <div className="space-y-3">
                {examResults.map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10"
                  >
                    <div className="font-semibold">{a.studentId?.name || 'Student'}</div>
                    <div className="font-mono text-emerald-300">{Number(a.score).toFixed(2)}%</div>
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
          <div className="glass-card p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">
                {editingStudent ? 'Edit Student:' : 'Student Details:'}{' '}
                <span className="text-indigo-300">{selectedStudent.name}</span>
              </h3>
              <button
                onClick={() => {
                  setShowStudentModal(false);
                  setSelectedStudent(null);
                  setEditingStudent(false);
                  setStudentForm({});
                }}
                className="text-3xl hover:text-red-400"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-gray-400 text-sm mb-1">Email</div>
                {editingStudent ? (
                  <input
                    type="email"
                    value={studentForm.email || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/20"
                  />
                ) : (
                  <div className="font-semibold">{selectedStudent.email || '-'}</div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-gray-400 text-sm mb-1">Course</div>
                  {editingStudent ? (
                    <input
                      type="text"
                      value={studentForm.courseName || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, courseName: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20"
                    />
                  ) : (
                    <div className="font-semibold">{selectedStudent.courseName || '-'}</div>
                  )}
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-gray-400 text-sm mb-1">Batch Time</div>
                  {editingStudent ? (
                    <input
                      type="text"
                      value={studentForm.batchTime || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, batchTime: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20"
                    />
                  ) : (
                    <div className="font-semibold">{selectedStudent.batchTime || '-'}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-gray-400 text-sm mb-1">Personal Contact</div>
                  {editingStudent ? (
                    <input
                      type="text"
                      value={studentForm.personalContact || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, personalContact: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20"
                    />
                  ) : (
                    <div className="font-semibold">{selectedStudent.personalContact || '-'}</div>
                  )}
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-gray-400 text-sm mb-1">Parent Contact</div>
                  {editingStudent ? (
                    <input
                      type="text"
                      value={studentForm.parentContact || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, parentContact: e.target.value })}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20"
                    />
                  ) : (
                    <div className="font-semibold">{selectedStudent.parentContact || '-'}</div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-gray-400 text-sm mb-2">Fee</div>
                <div className="flex flex-wrap gap-3">
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    Total: <span className="font-semibold">{selectedStudent.totalFee ?? '-'}</span>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    Paid: <span className="font-semibold">{selectedStudent.fee?.amountPaid ?? '-'}</span>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    Balance: <span className="font-semibold">{selectedStudent.fee?.balance ?? '-'}</span>
                  </div>
                </div>
              </div>
              {editingStudent && (
                <div className="flex gap-4 pt-6">
                  <button
                    onClick={handleSaveStudent}
                    disabled={savingStudent}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 disabled:opacity-50 text-white font-bold py-4 px-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                  >
                    {savingStudent ? 'Saving...' : 'Save Changes'}
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
          <div className="glass-card p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <label className="block text-gray-400 text-sm mb-1">Name</label>
                <input
                  type="text"
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Personal Contact</label>
                <input
                  type="text"
                  value={teacherForm.personalContact}
                  onChange={(e) => setTeacherForm({ ...teacherForm, personalContact: e.target.value })}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20"
                />
              </div>
            </div>
            <div className="flex gap-4 pt-6">
              <button
                onClick={handleSaveTeacher}
                disabled={savingTeacher}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 disabled:opacity-50 text-white font-bold py-4 px-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
              >
                {savingTeacher ? 'Saving...' : 'Save Profile'}
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
          <div className="glass-card p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
              <div className="text-center py-12 text-gray-300">Loading report...</div>
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
                            className="p-4 bg-white/5 rounded-2xl border border-white/20"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1">
                                <div className={`w-6 h-6 rounded flex items-center justify-center ${ts.completed ? 'bg-green-500' : 'bg-gray-600'}`}>
                                  {ts.completed && <span className="text-white text-sm">✓</span>}
                                </div>
                                <span className="font-semibold min-w-max">{ts.slot}</span>
                              </div>
                              <span className="text-gray-300">{ts.description || '-'}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          No report data for this date
                        </div>
                      )}
                    </div>

                    {attendanceReportDescription && (
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/20">
                        <h4 className="font-semibold mb-2 text-indigo-400">Overall Notes</h4>
                        <p className="text-gray-300 whitespace-pre-wrap">{attendanceReportDescription}</p>
                      </div>
                    )}

                    <div className="flex gap-4 pt-4 border-t border-white/20">
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
                      {(attendanceReportSlots.length ? attendanceReportSlots : buildDefaultReportSlots()).map((ts, idx) => (
                        <div
                          key={ts.slot}
                          className="p-4 bg-white/5 rounded-2xl border border-white/20"
                        >
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <label className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={!!ts.completed}
                                onChange={(e) => {
                                  const next = [...(attendanceReportSlots.length ? attendanceReportSlots : buildDefaultReportSlots())];
                                  next[idx] = { ...next[idx], completed: e.target.checked };
                                  setAttendanceReportSlots(next);
                                }}
                                className="w-5 h-5 rounded"
                              />
                              <span className="font-semibold">{ts.slot}</span>
                            </label>
                            <input
                              type="text"
                              value={ts.description || ''}
                              onChange={(e) => {
                                const next = [...(attendanceReportSlots.length ? attendanceReportSlots : buildDefaultReportSlots())];
                                next[idx] = { ...next[idx], description: e.target.value };
                                setAttendanceReportSlots(next);
                              }}
                              className="flex-1 p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50"
                              placeholder="Description for this time (e.g., Topic covered)"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-lg font-semibold mb-3">Overall Notes (optional)</label>
                      <textarea
                        value={attendanceReportDescription}
                        onChange={(e) => setAttendanceReportDescription(e.target.value)}
                        rows={5}
                        className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl text-white focus:ring-4 focus:ring-emerald-500/50"
                        placeholder="Any extra notes for the day..."
                      />
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-white/20">
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
                        {savingAttendance ? 'Saving...' : 'Save Report'}
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
