import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaMoon, FaSun } from "react-icons/fa";

function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableExams, setAvailableExams] = useState([]);
  const [currentExam, setCurrentExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [examLoading, setExamLoading] = useState(false);
  const [myResults, setMyResults] = useState([]);
  const [myResultsLoading, setMyResultsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  // TASK state for students
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submissions, setSubmissions] = useState({});
  const [activeTab, setActiveTab] = useState("exams");
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API}/users/profile`, {
        headers: { Authorization: token },
      });
      setUser(res.data);
    } catch (err) {
      toast.error("Error loading profile");
      localStorage.clear();
      window.location.href = "/";
    }
  };

  const fetchAvailableExams = async () => {
    try {
      const res = await axios.get(`${API}/exams/available`, {
        headers: { Authorization: token },
      });
      setAvailableExams(res.data);
    } catch (err) {
      console.error("Exam fetch error:", err);
    }
  };

  const fetchMyResults = async () => {
    try {
      setMyResultsLoading(true);
      const res = await axios.get(`${API}/exams/my-results`, {
        headers: { Authorization: token },
      });
      setMyResults(res.data || []);
    } catch (err) {
      console.error("My results fetch error:", err);
    } finally {
      setMyResultsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetchProfile(),
      fetchAvailableExams(),
      fetchMyResults(),
      fetchStudentTasks(),
    ]).finally(() => setLoading(false));
  }, []);

  const startExam = (exam) => {
    setCurrentExam(exam);
    setAnswers(new Array(exam.questions.length).fill(null));
    setTimeLeft(exam.questions.length * 30 * 1000); // 30s per question
    setShowResults(false);
  };

  useEffect(() => {
    let interval;
    if (timeLeft > 0 && currentExam) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1000) {
            submitExam();
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeLeft, currentExam]);

  const handleAnswer = (questionIndex, answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const submitExam = async () => {
    try {
      setExamLoading(true);
      const res = await axios.post(
        `${API}/exams/submit/${currentExam._id}`,
        { answers },
        { headers: { Authorization: token } },
      );
      setResults(res.data);
      setShowResults(true);
      toast.success(`Score: ${res.data.score.toFixed(2)}% 🎉`);
      fetchAvailableExams();
      fetchMyResults();
    } catch (err) {
      toast.error(err.response?.data || "Submit failed");
    } finally {
      setExamLoading(false);
      setCurrentExam(null);
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      toast.success("Logged out successfully!");
      setTimeout(() => (window.location.href = "/"), 1500);
    }
  };

  const fetchStudentTasks = async () => {
    try {
      setLoadingTasks(true);
      const res = await axios.get(`${API}/teacher/student/tasks`, {
        headers: { Authorization: token },
      });
      setTasks(res.data || []);
      // prepare submission map
      const map = {};
      (res.data || []).forEach((t) => {
        map[t._id] = t.submission?.content || "";
      });
      setSubmissions(map);
    } catch (err) {
      console.error("Task fetch error:", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const submitTask = async (taskId) => {
    try {
      const submissionData = submissions[taskId] || {};
      const formData = new FormData();

      formData.append("description", submissionData.description || "");
      formData.append("code", submissionData.code || "");
      formData.append("gitLink", submissionData.gitLink || "");
      formData.append("linkedinLink", submissionData.linkedinLink || "");

      if (
        submissionData.screenshot &&
        Array.isArray(submissionData.screenshot)
      ) {
        submissionData.screenshot.forEach((file, index) => {
          formData.append("screenshots", file);
        });
      } else if (submissionData.screenshot) {
        formData.append("screenshot", submissionData.screenshot);
      }

      const res = await axios.post(
        `${API}/teacher/tasks/${taskId}/submit`,
        formData,
        {
          headers: {
            Authorization: token,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      toast.success("Submission sent");
      fetchStudentTasks();
    } catch (err) {
      toast.error(err.response?.data || "Submit failed");
    }
  };

  if (loading) {
    return (
      <div className="bg-0f172a text-white min-h-screen flex items-center justify-center">
        <div className="glass-card p-12 text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-0f172a text-white min-h-screen flex items-center justify-center">
        <div className="glass-card p-12 text-center">
          <p className="text-2xl text-gray-400">
            Please login to view your dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${darkMode ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100" : "bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 text-gray-900"} min-h-screen p-8`}
    >
      {/* NAVIGATION */}
      <div
        className={`flex flex-wrap gap-4 mb-12 ${darkMode ? "bg-white/5 backdrop-blur-sm" : "bg-white/60 backdrop-blur-sm border border-green-200"} p-6 rounded-3xl shadow-2xl`}
      >
        <button
          onClick={() => setActiveTab("exams")}
          className={`px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all flex-1 md:flex-none ${
            activeTab === "exams"
              ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white"
              : darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          My Exams
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={`px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all flex-1 md:flex-none ${
            activeTab === "tasks"
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
              : darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          My Tasks
        </button>
        <button
          onClick={() => {
            const newMode = !darkMode;
            setDarkMode(newMode);
            localStorage.setItem("theme", newMode ? "dark" : "light");
          }}
          className={`px-6 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex items-center gap-2 ${
            darkMode
              ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
              : "bg-green-200 hover:bg-green-300 text-green-600"
          }`}
          title={darkMode ? "Light mode" : "Dark mode"}
        >
          {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
        </button>
        <button
          onClick={handleLogout}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 font-bold text-lg shadow-lg text-white shadow-red-500/25 hover:shadow-xl hover:scale-105 transition-all ml-auto"
        >
          Logout
        </button>
      </div>

      {/* PROFILE HEADER */}
      <div className="max-w-4xl mx-auto">
        <div
          className={`${darkMode ? "glass-card" : "bg-white border border-green-200"} p-10 text-center mb-12 rounded-3xl shadow-2xl`}
        >
          <h1
            className={`text-5xl font-bold ${darkMode ? "bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent" : "bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent"} mb-4`}
          >
            Welcome, {user.name}!
          </h1>
          <p
            className={`text-2xl mb-8 ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}
          >
            {user.courseName} - {user.batchTime}
          </p>
        </div>

        {/* TAB CONTENT */}
        <div className="space-y-12">
          {/* EXAM SECTION */}
          {activeTab === "exams" && (
            <>
              {/* Available Exams */}
              <div
                className={`${darkMode ? "glass-card" : "bg-white border border-green-200"} p-8 rounded-3xl shadow-2xl`}
              >
                <h3
                  className={`text-3xl font-bold mb-8 ${darkMode ? "bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent" : "bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent"} text-center`}
                >
                  Available Exams
                </h3>
                {examLoading ? (
                  <div
                    className={`text-center py-12 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xl">Processing exam...</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableExams.map((exam) => (
                      <div
                        key={exam._id}
                        className="glass-card p-6 text-center hover:scale-105 transition-all cursor-pointer"
                        onClick={() => startExam(exam)}
                      >
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                          📚
                        </div>
                        <h4 className="text-2xl font-bold mb-2">
                          {exam.chapter}
                        </h4>
                        <p className="text-indigo-400 mb-4">
                          {exam.questions.length} Questions
                        </p>
                        <p className="text-sm text-gray-400">
                          30s per question
                        </p>
                      </div>
                    ))}
                    {availableExams.length === 0 && (
                      <div className="text-center py-12 col-span-full">
                        <p className="text-2xl text-gray-400 mb-4">
                          No exams available
                        </p>
                        <p className="text-gray-500">
                          Contact your teacher for permissions
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* My Results */}
              <div className="glass-card p-8">
                <h3 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent text-center">
                  My Results
                </h3>
                {myResultsLoading ? (
                  <div className="text-center py-12 text-gray-300">
                    Loading results...
                  </div>
                ) : myResults.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    No results yet
                  </div>
                ) : (
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {myResults.map((a) => (
                      <div
                        key={a._id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10"
                      >
                        <div className="font-semibold">
                          {a.examId?.chapter || "Exam"}
                        </div>
                        <div className="font-mono text-emerald-300">
                          {Number(a.score).toFixed(2)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TASKS SECTION */}
          {activeTab === "tasks" && (
            <div className="glass-card p-8 rounded-3xl">
              <h3 className="text-3xl font-bold mb-6 text-center">
                Assigned Tasks
              </h3>
              {loadingTasks ? (
                <div className="text-center py-8 text-gray-300">
                  Loading tasks...
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No tasks assigned.
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Left Column: Task List */}
                  <div className="w-full md:w-1/3 flex flex-col gap-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                    {tasks.map((t) => (
                      <div
                        key={t._id}
                        onClick={() => setSelectedTask(t)}
                        className={`p-5 border rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${
                          selectedTask?._id === t._id
                            ? darkMode
                              ? "bg-blue-900/40 border-blue-400"
                              : "bg-blue-100 border-blue-500 shadow-md"
                            : darkMode
                              ? "bg-white/5 border-white/20 hover:bg-white/10"
                              : "bg-white border-gray-300 hover:shadow-md"
                        }`}
                      >
                        <div
                          className={`font-bold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}
                        >
                          {t.title}
                        </div>
                        {t.dueDate && (
                          <div
                            className={`text-sm mt-1 font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                          >
                            Due: {new Date(t.dueDate).toLocaleDateString()}
                          </div>
                        )}
                        <div className="mt-3">
                          {t.submission?.submittedAt ? (
                            <span
                              className={`px-3 py-1 text-xs rounded-full font-bold inline-flex items-center gap-1 ${darkMode ? "bg-green-900/40 text-green-300" : "bg-green-100 text-green-800"}`}
                            >
                              ✓ Submitted
                            </span>
                          ) : (
                            <span
                              className={`px-3 py-1 text-xs rounded-full font-bold inline-flex items-center gap-1 ${darkMode ? "bg-yellow-900/40 text-yellow-300" : "bg-yellow-100 text-yellow-800"}`}
                            >
                              ⏳ Pending
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right Column: Task Details */}
                  <div
                    className={`w-full md:w-2/3 p-6 border rounded-3xl ${darkMode ? "bg-white/5 border-white/20" : "bg-white border-gray-200 shadow-md"} min-h-[500px]`}
                  >
                    {selectedTask ? (
                      (() => {
                        const t = selectedTask;
                        // Update submission state if needed
                        const currentSubmission = submissions[t._id];

                        return (
                          <div className="animate-fadeIn">
                            <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200 dark:border-white/10">
                              <div>
                                <h4 className="text-3xl font-bold">
                                  {t.title}
                                </h4>
                                {t.dueDate && (
                                  <p className="text-gray-500 mt-2 font-medium">
                                    Due Date:{" "}
                                    {new Date(t.dueDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <div>
                                {t.submission?.submittedAt ? (
                                  <span
                                    className={`px-4 py-2 text-sm rounded-xl font-bold shadow-sm inline-flex items-center gap-2 ${darkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"}`}
                                  >
                                    ✓ Submitted
                                  </span>
                                ) : (
                                  <span
                                    className={`px-4 py-2 text-sm rounded-xl font-bold shadow-sm inline-flex items-center gap-2 ${darkMode ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-800"}`}
                                  >
                                    ⏳ Pending
                                  </span>
                                )}
                              </div>
                            </div>

                            <div
                              className={`prose max-w-none mb-8 ${darkMode ? "prose-invert" : ""}`}
                            >
                              <h5 className="text-xl font-semibold mb-3">
                                Task Description
                              </h5>
                              <p
                                className={`whitespace-pre-wrap p-6 rounded-2xl border ${darkMode ? "bg-gray-800/50 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-100 text-gray-700"}`}
                              >
                                {t.description}
                              </p>
                            </div>

                            {/* Submission Details */}
                            <div className="space-y-6">
                              {(t.submission?.description ||
                                t.submission?.content) && (
                                <div
                                  className={`p-6 rounded-2xl border ${darkMode ? "bg-blue-900/20 border-blue-800/50" : "bg-blue-50 border-blue-100"}`}
                                >
                                  <strong
                                    className={`block mb-3 text-lg ${darkMode ? "text-blue-300" : "text-blue-900"}`}
                                  >
                                    Your Notes:
                                  </strong>
                                  <p
                                    className={`whitespace-pre-wrap ${darkMode ? "text-gray-200" : "text-gray-800"}`}
                                  >
                                    {t.submission.description ||
                                      t.submission.content}
                                  </p>
                                </div>
                              )}

                              {t.submission?.code && (
                                <div className="p-6 rounded-2xl bg-gray-900 text-gray-100 mt-4 overflow-hidden border border-gray-800">
                                  <div className="flex items-center justify-between mb-3 border-b border-gray-700 pb-3">
                                    <strong className="text-gray-300 text-lg">
                                      Source Code
                                    </strong>
                                  </div>
                                  <div className="overflow-x-auto max-h-96 custom-scrollbar">
                                    <pre className="text-sm font-mono leading-relaxed">
                                      {t.submission.code}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {(t.submission?.screenshots ||
                                t.submission?.screenshot) && (
                                <div
                                  className={`p-6 rounded-2xl border mt-4 ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100"}`}
                                >
                                  <strong
                                    className={`block mb-4 text-lg ${darkMode ? "text-gray-200" : "text-gray-800"}`}
                                  >
                                    Attachments:
                                  </strong>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(Array.isArray(t.submission.screenshots)
                                      ? t.submission.screenshots
                                      : t.submission.screenshot
                                        ? [t.submission.screenshot]
                                        : []
                                    ).map((screenshot, index) => (
                                      <div
                                        key={index}
                                        className={`flex flex-col items-center p-3 rounded-xl shadow-sm border transition-transform hover:scale-[1.03] ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                                      >
                                        {screenshot.match(
                                          /\.(jpg|jpeg|png|gif|webp)$/i,
                                        ) ? (
                                          <img
                                            src={`${API}${screenshot}`}
                                            alt={`Attachment ${index + 1}`}
                                            className="w-full h-40 object-cover rounded-lg mb-3"
                                          />
                                        ) : (
                                          <div
                                            className={`w-full h-40 flex flex-col items-center justify-center gap-3 rounded-lg mb-3 ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}
                                          >
                                            <span className="text-4xl">📄</span>
                                            <span className="font-medium">
                                              Document File
                                            </span>
                                          </div>
                                        )}
                                        <a
                                          href={`${API}${screenshot}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-500 hover:text-blue-600 font-semibold underline mt-auto pb-1 text-center w-full"
                                        >
                                          View/Download
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {(t.submission?.gitLink ||
                                t.submission?.linkedinLink) && (
                                <div
                                  className={`p-6 rounded-2xl border mt-4 flex flex-col gap-3 ${darkMode ? "bg-indigo-900/20 border-indigo-800/50" : "bg-indigo-50 border-indigo-100"}`}
                                >
                                  {t.submission?.gitLink && (
                                    <div
                                      className={`flex items-center gap-3 ${darkMode ? "text-indigo-300" : "text-indigo-900"}`}
                                    >
                                      <span className="text-xl">🐙</span>
                                      <strong className="min-w-[100px]">
                                        Git Repo:
                                      </strong>
                                      <a
                                        href={t.submission.gitLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline font-medium break-all"
                                      >
                                        {t.submission.gitLink}
                                      </a>
                                    </div>
                                  )}
                                  {t.submission?.linkedinLink && (
                                    <div
                                      className={`flex items-center gap-3 ${darkMode ? "text-indigo-300" : "text-indigo-900"}`}
                                    >
                                      <span className="text-xl">💼</span>
                                      <strong className="min-w-[100px]">
                                        LinkedIn:
                                      </strong>
                                      <a
                                        href={t.submission.linkedinLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline font-medium break-all"
                                      >
                                        {t.submission.linkedinLink}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}

                              {t.review?.feedback && (
                                <div
                                  className={`p-6 mt-8 rounded-2xl border shadow-inner ${darkMode ? "bg-green-900/20 border-green-800" : "bg-green-50 border-green-200"}`}
                                >
                                  <h5
                                    className={`font-bold text-xl mb-4 flex items-center gap-3 ${darkMode ? "text-green-400" : "text-green-800"}`}
                                  >
                                    <span className="text-2xl">👨‍🏫</span> Teacher
                                    Review
                                  </h5>
                                  <p
                                    className={`text-lg leading-relaxed p-4 rounded-xl ${darkMode ? "bg-black/20 text-green-300" : "bg-white/50 text-green-900"}`}
                                  >
                                    {t.review.feedback}
                                  </p>
                                  {t.review.mark !== undefined && (
                                    <div
                                      className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg shadow-sm ${darkMode ? "bg-green-800 text-green-100" : "bg-green-200 text-green-900"}`}
                                    >
                                      <span>Score:</span>
                                      <span className="text-2xl">
                                        {t.review.mark}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Submission Form Section */}
                              <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
                                <div className="flex justify-between items-center mb-6">
                                  <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                    {t.submission?.submittedAt
                                      ? "Update Your Work"
                                      : "Submit Your Work"}
                                  </h4>
                                  {t.submission?.submittedAt &&
                                    !currentSubmission && (
                                      <button
                                        onClick={() => {
                                          setSubmissions({
                                            ...submissions,
                                            [t._id]: {
                                              description:
                                                t.submission.description || "",
                                              code: t.submission.code || "",
                                              screenshot:
                                                t.submission.screenshots ||
                                                (t.submission.screenshot
                                                  ? [t.submission.screenshot]
                                                  : []),
                                              gitLink:
                                                t.submission.gitLink || "",
                                              linkedinLink:
                                                t.submission.linkedinLink || "",
                                            },
                                          });
                                        }}
                                        className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                                      >
                                        ✏️ Edit Submission
                                      </button>
                                    )}
                                </div>

                                {(!t.submission?.submittedAt ||
                                  currentSubmission) && (
                                  <div className="space-y-6 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                                    <div>
                                      <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                                        Notes / Comments
                                      </label>
                                      <textarea
                                        rows={3}
                                        value={
                                          submissions[t._id]?.description || ""
                                        }
                                        onChange={(e) =>
                                          setSubmissions({
                                            ...submissions,
                                            [t._id]: {
                                              ...submissions[t._id],
                                              description: e.target.value,
                                            },
                                          })
                                        }
                                        className={`w-full p-4 rounded-xl border transition-colors focus:ring-2 focus:ring-blue-500 outline-none resize-y ${darkMode ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"}`}
                                        placeholder="Share any thoughts or notes with your teacher..."
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                                        Code Snippet (Optional)
                                      </label>
                                      <textarea
                                        rows={6}
                                        value={submissions[t._id]?.code || ""}
                                        onChange={(e) =>
                                          setSubmissions({
                                            ...submissions,
                                            [t._id]: {
                                              ...submissions[t._id],
                                              code: e.target.value,
                                            },
                                          })
                                        }
                                        className={`w-full p-4 rounded-xl border font-mono text-sm transition-colors focus:ring-2 focus:ring-blue-500 outline-none resize-y custom-scrollbar ${darkMode ? "bg-gray-900 border-gray-700 text-green-400 placeholder-gray-600" : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"}`}
                                        placeholder="Paste raw code here..."
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                        <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                                          Git Repository Link
                                        </label>
                                        <input
                                          type="url"
                                          value={
                                            submissions[t._id]?.gitLink || ""
                                          }
                                          onChange={(e) =>
                                            setSubmissions({
                                              ...submissions,
                                              [t._id]: {
                                                ...submissions[t._id],
                                                gitLink: e.target.value,
                                              },
                                            })
                                          }
                                          className={`w-full p-4 rounded-xl border transition-colors focus:ring-2 focus:ring-blue-500 outline-none ${darkMode ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"}`}
                                          placeholder="https://github.com/..."
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                                          LinkedIn Post Link
                                        </label>
                                        <input
                                          type="url"
                                          value={
                                            submissions[t._id]?.linkedinLink ||
                                            ""
                                          }
                                          onChange={(e) =>
                                            setSubmissions({
                                              ...submissions,
                                              [t._id]: {
                                                ...submissions[t._id],
                                                linkedinLink: e.target.value,
                                              },
                                            })
                                          }
                                          className={`w-full p-4 rounded-xl border transition-colors focus:ring-2 focus:ring-blue-500 outline-none ${darkMode ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"}`}
                                          placeholder="https://linkedin.com/..."
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                                        Upload Files (Screenshots/Documents)
                                      </label>
                                      <div
                                        className={`p-4 border-2 border-dashed rounded-xl transition-colors ${darkMode ? "border-gray-600 bg-gray-900/50 hover:bg-gray-800" : "border-gray-300 bg-white hover:bg-gray-50"}`}
                                      >
                                        <input
                                          type="file"
                                          multiple
                                          onChange={(e) =>
                                            setSubmissions({
                                              ...submissions,
                                              [t._id]: {
                                                ...submissions[t._id],
                                                screenshot: Array.from(
                                                  e.target.files,
                                                ),
                                              },
                                            })
                                          }
                                          className={`w-full text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} file:mr-4 file:py-2 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-500 file:text-white hover:file:bg-blue-600 file:cursor-pointer file:transition-colors`}
                                        />
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => submitTask(t._id)}
                                      className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all text-lg flex justify-center items-center gap-2"
                                    >
                                      <span>🚀</span>{" "}
                                      {t.submission?.submittedAt
                                        ? "Update Submission"
                                        : "Submit Work"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-12 text-gray-400 dark:text-gray-500">
                        <div className="text-8xl mb-6 opacity-30 grayscale">
                          📋
                        </div>
                        <h4 className="text-3xl font-bold mb-3 text-gray-600 dark:text-gray-300">
                          No Task Selected
                        </h4>
                        <p className="text-lg max-w-sm">
                          Choose a task from the list on the left to view
                          instructions, submit your work, or check your
                          teacher's feedback.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Current Exam */}
          {activeTab === "exams" && currentExam && !showResults && (
            <div className="glass-card p-8 max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-bold">{currentExam.chapter}</h3>
                <div className="text-2xl font-mono bg-red-500/20 px-4 py-2 rounded-xl">
                  {Math.floor(timeLeft / 1000 / 60)}:
                  {((timeLeft / 1000) % 60).toString().padStart(2, "0")}
                </div>
              </div>

              <div className="space-y-6 max-h-96 overflow-y-auto">
                {currentExam.questions.map((q, qIndex) => (
                  <div key={qIndex} className="glass-card p-6">
                    <h4 className="font-bold text-xl mb-4">
                      Q{qIndex + 1}: {q.question}
                    </h4>
                    <div className="space-y-2">
                      {q.options.map((option, oIndex) => (
                        <button
                          key={oIndex}
                          onClick={() => handleAnswer(qIndex, oIndex)}
                          className={`w-full p-4 rounded-xl text-left transition-all ${
                            answers[qIndex] === oIndex
                              ? "bg-emerald-500/30 border-2 border-emerald-400 text-emerald-100 shadow-lg"
                              : "bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 hover:shadow-lg"
                          }`}
                        >
                          {String.fromCharCode(65 + oIndex)}. {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 mt-8 pt-8 border-t border-white/20">
                <button
                  onClick={submitExam}
                  disabled={answers.some((a) => a === null)}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 disabled:opacity-50 disabled:cursor-not-allowed hover:from-emerald-600 hover:to-green-700 px-8 py-4 rounded-2xl font-bold text-xl shadow-2xl glow transition-all"
                >
                  ✅ Submit Exam
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {activeTab === "exams" && showResults && results && (
            <div className="glass-card p-8 text-center max-w-2xl mx-auto">
              <div className="w-32 h-32 bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl mx-auto mb-8 flex flex-col items-center justify-center text-3xl font-bold shadow-2xl">
                {results.score.toFixed(0)}%
              </div>
              <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                {results.score >= 80
                  ? "Excellent!"
                  : results.score >= 60
                    ? "Good!"
                    : "Keep Practicing!"}
              </h3>
              <p className="text-xl text-gray-300 mb-8">
                You scored {results.score.toFixed(2)}%
              </p>
              <button
                onClick={() => {
                  setShowResults(false);
                  fetchAvailableExams();
                }}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-12 py-4 rounded-2xl font-bold text-xl glow transition-all"
              >
                📚 View More Exams
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
