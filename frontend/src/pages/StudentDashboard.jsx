import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

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

  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API}/users/profile`, {
        headers: { Authorization: token }
      });
      setUser(res.data);
    } catch (err) {
      toast.error('Error loading profile');
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const fetchAvailableExams = async () => {
    try {
      const res = await axios.get(`${API}/exams/available`, {
        headers: { Authorization: token }
      });
      setAvailableExams(res.data);
    } catch (err) {
      console.error('Exam fetch error:', err);
    }
  };

  const fetchMyResults = async () => {
    try {
      setMyResultsLoading(true);
      const res = await axios.get(`${API}/exams/my-results`, {
        headers: { Authorization: token }
      });
      setMyResults(res.data || []);
    } catch (err) {
      console.error('My results fetch error:', err);
    } finally {
      setMyResultsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    Promise.all([fetchProfile(), fetchAvailableExams(), fetchMyResults()]).finally(() =>
      setLoading(false),
    );
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
        setTimeLeft(prev => {
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
      const res = await axios.post(`${API}/exams/submit/${currentExam._id}`, 
        { answers }, 
        { headers: { Authorization: token } }
      );
      setResults(res.data);
      setShowResults(true);
      toast.success(`Score: ${res.data.score.toFixed(2)}% 🎉`);
      fetchAvailableExams();
      fetchMyResults();
    } catch (err) {
      toast.error(err.response?.data || 'Submit failed');
    } finally {
      setExamLoading(false);
      setCurrentExam(null);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      toast.success('Logged out successfully!');
      setTimeout(() => window.location.href = '/', 1500);
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
          <p className="text-2xl text-gray-400">Please login to view your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-0f172a text-white min-h-screen p-8">
      {/* NAVIGATION */}
      <div className="flex flex-wrap gap-4 mb-12 bg-white/5 backdrop-blur-sm p-6 rounded-3xl glass-card shadow-2xl">
        <button className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 glow text-white font-bold text-lg shadow-lg hover:bg-white/10 hover:shadow-xl hover:scale-105 transition-all flex-1 md:flex-none">
          My Exams
        </button>
        <button
          onClick={handleLogout}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 font-bold text-lg shadow-lg glow shadow-red-500/25 hover:shadow-xl hover:scale-105 transition-all ml-auto"
        >
          Logout
        </button>
      </div>

      {/* PROFILE HEADER */}
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-10 text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent mb-4">
            Welcome, {user.name}!
          </h1>
          <p className="text-2xl text-indigo-400 mb-8">{user.courseName} - {user.batchTime}</p>
        </div>

        {/* EXAM SECTION */}
        <div className="space-y-12">
          {/* Available Exams */}
          <div className="glass-card p-8">
            <h3 className="text-3xl font-bold mb-8 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent text-center">
              Available Exams
            </h3>
            {examLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xl">Processing exam...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableExams.map(exam => (
                  <div
                    key={exam._id}
                    className="glass-card p-6 text-center hover:scale-105 transition-all cursor-pointer"
                    onClick={() => startExam(exam)}
                  >
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                      📚
                    </div>
                    <h4 className="text-2xl font-bold mb-2">{exam.chapter}</h4>
                    <p className="text-indigo-400 mb-4">{exam.questions.length} Questions</p>
                    <p className="text-sm text-gray-400">30s per question</p>
                  </div>
                ))}
                {availableExams.length === 0 && (
                  <div className="text-center py-12 col-span-full">
                    <p className="text-2xl text-gray-400 mb-4">No exams available</p>
                    <p className="text-gray-500">Contact your teacher for permissions</p>
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
              <div className="text-center py-12 text-gray-300">Loading results...</div>
            ) : myResults.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No results yet</div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {myResults.map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10"
                  >
                    <div className="font-semibold">{a.examId?.chapter || 'Exam'}</div>
                    <div className="font-mono text-emerald-300">{Number(a.score).toFixed(2)}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Exam */}
          {currentExam && !showResults && (
            <div className="glass-card p-8 max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-bold">{currentExam.chapter}</h3>
                <div className="text-2xl font-mono bg-red-500/20 px-4 py-2 rounded-xl">
                  {Math.floor(timeLeft / 1000 / 60)}:{((timeLeft / 1000) % 60).toString().padStart(2, '0')}
                </div>
              </div>
              
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {currentExam.questions.map((q, qIndex) => (
                  <div key={qIndex} className="glass-card p-6">
                    <h4 className="font-bold text-xl mb-4">Q{qIndex + 1}: {q.question}</h4>
                    <div className="space-y-2">
                      {q.options.map((option, oIndex) => (
                        <button
                          key={oIndex}
                          onClick={() => handleAnswer(qIndex, oIndex)}
                          className={`w-full p-4 rounded-xl text-left transition-all ${
                            answers[qIndex] === oIndex
                              ? 'bg-emerald-500/30 border-2 border-emerald-400 text-emerald-100 shadow-lg'
                              : 'bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 hover:shadow-lg'
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
                  disabled={answers.some(a => a === null)}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 disabled:opacity-50 disabled:cursor-not-allowed hover:from-emerald-600 hover:to-green-700 px-8 py-4 rounded-2xl font-bold text-xl shadow-2xl glow transition-all"
                >
                  ✅ Submit Exam
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {showResults && results && (
            <div className="glass-card p-8 text-center max-w-2xl mx-auto">
              <div className="w-32 h-32 bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl mx-auto mb-8 flex flex-col items-center justify-center text-3xl font-bold shadow-2xl">
                {results.score.toFixed(0)}%
              </div>
              <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                {results.score >= 80 ? 'Excellent!' : results.score >= 60 ? 'Good!' : 'Keep Practicing!'}
              </h3>
              <p className="text-xl text-gray-300 mb-8">You scored {results.score.toFixed(2)}%</p>
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
