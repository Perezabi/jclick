import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaPlus, FaTrash } from "react-icons/fa";

function Dashboard() {
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [active, setActive] = useState("dashboard");
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [showLogout, setShowLogout] = useState(false);

  // 🔥 NEW FEE STATES
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
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
    totalFee: "",
    joiningDate: "",
    loginTimeFrom: "",
    loginTimeTo: "",
    specialization: "",
  });

  // ================= FETCH DATA =================
  const fetchData = async () => {
    try {
      const s = await axios.get(`${API}/users/students/all`, {
        headers: { Authorization: token },
      });

      const t = await axios.get(`${API}/users/teachers`, {
        headers: { Authorization: token },
      });

      setStudents(s.data);
      setTeachers(t.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        totalFee: "",
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

  // 🔥 NEW PAYMENT HANDLER
  const handlePayment = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error("Please enter valid amount");
      return;
    }

    if (paymentAmount > (selectedFee.fee?.balance || 0)) {
      toast.error("Amount cannot exceed balance");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${API}/fees/pay/${selectedFee.fee._id}`,
        { amount: Number(paymentAmount), paymentMode },
        { headers: { Authorization: token } },
      );

      toast.success(`₹${paymentAmount} paid successfully!`);
      setSelectedFee(null);
      setPaymentAmount("");
      fetchData(); // Refresh data
    } catch (err) {
      toast.error(err.response?.data || "Payment failed");
    } finally {
      setIsLoading(false);
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
    <div className="bg-[#0f172a] text-white min-h-screen p-8">
      {/* NAVIGATION - ENHANCED */}
      {/* ENHANCED NAVIGATION WITH LOGOUT */}
      <div className="flex flex-wrap gap-4 mb-12 bg-white/5 backdrop-blur-sm p-6 rounded-3xl glass-card shadow-2xl">
        <button
          onClick={() => setActive("dashboard")}
          className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex-1 md:flex-none ${
            active === "dashboard"
              ? "bg-indigo-500 glow text-white shadow-indigo-500/25 scale-105"
              : "hover:bg-white/10 hover:shadow-xl hover:scale-105"
          }`}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setActive("students")}
          className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex-1 md:flex-none ${
            active === "students"
              ? "bg-emerald-500 glow text-white shadow-emerald-500/25 scale-105"
              : "hover:bg-white/10 hover:shadow-xl hover:scale-105"
          }`}
        >
          👨‍🎓 Students
        </button>
        <button
          onClick={() => setActive("teachers")}
          className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex-1 md:flex-none ${
            active === "teachers"
              ? "bg-purple-500 glow text-white shadow-purple-500/25 scale-105"
              : "hover:bg-white/10 hover:shadow-xl hover:scale-105"
          }`}
        >
          👨‍🏫 Teachers
        </button>
        <button
          onClick={() => setActive("fees")}
          className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex-1 md:flex-none ${
            active === "fees"
              ? "bg-green-500 glow text-white shadow-green-500/25 scale-105"
              : "hover:bg-white/10 hover:shadow-xl hover:scale-105"
          }`}
        >
          💰 Fees
        </button>

        {/* 🔥 NEW LOGOUT BUTTON */}
        <button
          onClick={handleLogout}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 font-bold text-lg shadow-lg glow shadow-red-500/25 hover:shadow-xl hover:scale-105 transition-all ml-auto"
        >
          🚪 Logout
        </button>
      </div>

      {/* ================= DASHBOARD ================= */}
      {active === "dashboard" && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-xl opacity-90 mb-2">Total Students</h3>
            <p className="text-4xl font-bold text-indigo-400">
              {students.length}
            </p>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-xl opacity-90 mb-2">Total Teachers</h3>
            <p className="text-4xl font-bold text-purple-400">
              {teachers.length}
            </p>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-xl opacity-90 mb-2">Total Revenue</h3>
            <p className="text-4xl font-bold text-green-400">
              ₹
              {students
                .reduce((sum, s) => sum + (s.fee?.amountPaid || 0), 0)
                .toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* ================= STUDENTS ================= */}
      {active === "students" && (
        <>
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
                personalContact: "",
                parentContact: "",
                totalFee: "",
              });
              setModalOpen(true);
            }}
            className="glass-card inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 mb-8 font-bold text-lg glow shadow-2xl transition-all"
          >
            <FaPlus size={20} /> Add New Student
          </button>

          <div className="grid md:grid-cols-3 gap-6">
            {students.map((s) => (
              <div
                key={s._id}
                className="glass-card p-6 cursor-pointer hover:scale-105 transition-all"
                onClick={() => setViewUser(s)}
              >
                <h3 className="text-xl font-bold mb-2">{s.name}</h3>
                <p className="text-indigo-400 mb-2">{s.courseName}</p>
                <p className="text-sm text-gray-400 mb-4">{s.batchTime}</p>
                <div className="flex gap-2">
                  <FaTrash
                    className="text-red-400 hover:text-red-300 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteUser(s._id);
                    }}
                    size={18}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ================= TEACHERS ================= */}
      {active === "teachers" && (
        <>
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
            className="glass-card inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 mb-8 font-bold text-lg glow shadow-2xl transition-all"
          >
            <FaPlus size={20} /> Add New Teacher
          </button>

          <div className="grid md:grid-cols-3 gap-6">
            {teachers.map((t) => (
              <div
                key={t._id}
                className="glass-card p-6 cursor-pointer hover:scale-105 transition-all"
                onClick={() => setViewUser(t)}
              >
                <h3 className="text-xl font-bold mb-2">{t.name}</h3>
                <p className="text-purple-400 mb-4">{t.specialization}</p>
                <div className="text-sm text-gray-400">
                  {t.loginTimeFrom} - {t.loginTimeTo}
                </div>
                <FaTrash
                  className="text-red-400 hover:text-red-300 mt-4 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteUser(t._id);
                  }}
                  size={18}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* 🔥 COMPLETE FEE TAB */}
      {active === "fees" && (
        <div className="space-y-6">
          {/* Fee Summary Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="glass-card p-6 text-center">
              <h3 className="text-lg opacity-90 mb-2">Total Students</h3>
              <p className="text-3xl font-bold text-indigo-400">
                {students.length}
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <h3 className="text-lg opacity-90 mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-green-400">
                ₹
                {students
                  .reduce((sum, s) => sum + (s.fee?.amountPaid || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <h3 className="text-lg opacity-90 mb-2">Pending Fees</h3>
              <p className="text-3xl font-bold text-red-400">
                ₹
                {students
                  .reduce((sum, s) => sum + (s.fee?.balance || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <h3 className="text-lg opacity-90 mb-2">Avg Payment</h3>
              <p className="text-2xl font-bold text-purple-400">
                ₹
                {Math.round(
                  students.reduce(
                    (sum, s) => sum + (s.fee?.amountPaid || 0),
                    0,
                  ) / (students.length || 1),
                ).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Students Fee Table */}
          <div className="glass-card p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-indigo-500 bg-clip-text text-transparent">
                Fee Management
              </h3>
            </div>

            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-white/20">
                    <th className="py-4 px-6 font-semibold text-lg">Student</th>
                    <th className="py-4 px-6 font-semibold text-lg">
                      Total Fee
                    </th>
                    <th className="py-4 px-6 font-semibold text-lg">Paid</th>
                    <th className="py-4 px-6 font-semibold text-lg">Balance</th>
                    <th className="py-4 px-6 font-semibold text-lg">
                      Last Payment
                    </th>
                    <th className="py-4 px-6 font-semibold text-lg">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr
                      key={s._id}
                      className="border-b border-white/10 hover:bg-white/10 transition-all"
                    >
                      <td className="py-5 px-6">
                        <div className="font-semibold text-lg">{s.name}</div>
                        <div className="text-indigo-400 text-sm">
                          {s.courseName}
                        </div>
                      </td>
                      <td className="py-5 px-6 font-mono text-xl">
                        ₹{s.fee?.totalFee?.toLocaleString() || 0}
                      </td>
                      <td className="py-5 px-6">
                        <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-bold">
                          ₹{s.fee?.amountPaid?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-bold text-lg ${
                            s.fee?.balance > 0
                              ? "bg-red-500/30 text-red-300 border-2 border-red-500/50"
                              : "bg-green-500/30 text-green-300 border-2 border-green-500/50"
                          }`}
                        >
                          ₹{s.fee?.balance?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-sm text-gray-400">
                        {s.fee?.payments?.length > 0
                          ? new Date(
                              s.fee.payments[s.fee.payments.length - 1]
                                .paymentDate,
                            ).toLocaleDateString()
                          : "No payments"}
                      </td>
                      <td className="py-5 px-6">
                        <button
                          onClick={() => setSelectedFee(s)}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-8 py-3 rounded-2xl text-white font-bold glow shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                        >
                          💳 Pay Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW MODAL ================= */}
      {/* FIXED VIEW MODAL - Shows ALL data */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                {viewUser.role === "teacher" ? "👨‍🏫 Teacher" : "👨‍🎓 Student"}{" "}
                Details
              </h3>
              <button
                onClick={() => setViewUser(null)}
                className="text-4xl hover:text-red-400 p-3 rounded-2xl hover:bg-white/10 transition-all"
              >
                ×
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8 text-xl">
              {/* LEFT COLUMN - BASIC INFO */}
              <div className="space-y-4">
                <p>
                  <span className="font-bold text-indigo-400">👤 Name:</span>{" "}
                  {viewUser.name}
                </p>
                <p>
                  <span className="font-bold text-indigo-400">📧 Email:</span>{" "}
                  {viewUser.email}
                </p>
                <p>
                  <span className="font-bold text-indigo-400">🎭 Role:</span>
                  <span
                    className={`ml-2 px-4 py-2 rounded-full text-sm font-bold ${
                      viewUser.role === "super"
                        ? "bg-purple-500/30 text-purple-300"
                        : viewUser.role === "teacher"
                          ? "bg-pink-500/30 text-pink-300"
                          : "bg-emerald-500/30 text-emerald-300"
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
                      <span className="font-bold text-purple-400">
                        🎯 Specialization:
                      </span>
                      <span className="ml-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-2 rounded-2xl">
                        {viewUser.specialization || "Not set"}
                      </span>
                    </p>
                    <p>
                      <span className="font-bold text-purple-400">
                        ⏰ Schedule:
                      </span>
                      {viewUser.loginTimeFrom && viewUser.loginTimeTo
                        ? `${viewUser.loginTimeFrom} - ${viewUser.loginTimeTo}`
                        : "Not set"}
                    </p>
                    <p>
                      <span className="font-bold text-purple-400">
                        📅 Joined:
                      </span>
                      {viewUser.joiningDate
                        ? new Date(viewUser.joiningDate).toLocaleDateString()
                        : "Not set"}
                    </p>
                  </>
                )}

                {viewUser.role === "student" && (
                  <>
                    <p>
                      <span className="font-bold text-emerald-400">
                        📚 Course:
                      </span>{" "}
                      {viewUser.courseName || "Not assigned"}
                    </p>
                    <p>
                      <span className="font-bold text-emerald-400">
                        🕒 Batch Time:
                      </span>
                      <span className="ml-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-xl">
                        {viewUser.batchTime || "Not scheduled"}
                      </span>
                    </p>
                    <p>
                      <span className="font-bold text-emerald-400">
                        📱 Contact:
                      </span>{" "}
                      {viewUser.personalContact}
                    </p>
                    <p>
                      <span className="font-bold text-emerald-400">
                        👨‍👩‍👧 Parent:
                      </span>{" "}
                      {viewUser.parentContact || "Not provided"}
                    </p>
                    {viewUser.fee && (
                      <p>
                        <span className="font-bold text-yellow-400">
                          💰 Total Fee:
                        </span>{" "}
                        ₹{viewUser.fee.totalFee?.toLocaleString() || 0}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-12 pt-8 border-t border-white/20">
              <button
                onClick={() => setViewUser(null)}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 px-8 py-4 rounded-2xl font-bold text-xl glow transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 PAY NOW MODAL */}
      {selectedFee && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-card p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  💳 Pay Fee
                </h3>
                <p className="text-xl font-semibold text-white">
                  {selectedFee.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedFee(null);
                  setPaymentAmount("");
                }}
                className="text-3xl hover:text-red-400 transition-all p-2 rounded-xl hover:bg-white/10"
              >
                ×
              </button>
            </div>

            {/* Fee Summary Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8 p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl border border-green-500/30">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Total Fee</p>
                <p className="text-3xl font-bold text-indigo-400">
                  ₹{selectedFee.fee?.totalFee?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Amount Paid</p>
                <p className="text-3xl font-bold text-green-400">
                  ₹{selectedFee.fee?.amountPaid?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Balance Due</p>
                <p
                  className={`text-4xl font-bold ${
                    selectedFee.fee?.balance > 0
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  ₹{selectedFee.fee?.balance?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Installments</p>
                <p className="text-2xl font-bold text-purple-400">
                  {selectedFee.fee?.payments?.length || 0}
                </p>
              </div>
            </div>

            {/* Payment History */}
            {selectedFee.fee?.payments?.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                  📜 Payment History
                  <span className="text-sm bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                    {selectedFee.fee.payments.length} payments
                  </span>
                </h4>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {selectedFee.fee.payments.slice(-5).map((p, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
                    >
                      <div>
                        <p className="font-bold text-lg text-green-400">
                          ₹{p.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(p.paymentDate).toLocaleString()} •{" "}
                          {p.paymentMode}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-500/30 text-green-400 rounded-full text-sm font-bold">
                        ✓ Paid
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-semibold mb-3">
                  💰 Payment Amount
                </label>
                <input
                  type="number"
                  min="100"
                  max={selectedFee.fee?.balance}
                  placeholder="Enter payment amount"
                  className="w-full p-5 text-xl rounded-2xl bg-white/10 border-2 border-white/20 focus:outline-none focus:ring-4 focus:ring-green-400/50 focus:border-green-400 transition-all shadow-inner no-spin"
                  style={{ MozAppearance: 'textfield' }}
                  onWheel={(e) => e.currentTarget.blur()}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
                {paymentAmount > (selectedFee.fee?.balance || 0) && (
                  <p className="text-red-400 text-sm mt-2 font-medium flex items-center gap-2">
                    ⚠️ Amount cannot exceed balance (₹
                    {selectedFee.fee?.balance?.toLocaleString()})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-lg font-semibold mb-3">
                  💳 Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full p-6 text-2xl rounded-3xl 
             bg-gradient-to-br from-slate-800/95 to-gray-900/95 
             border-2 border-white/40 
             text-white placeholder-gray-300 
             focus:outline-none focus:ring-4 focus:ring-purple-400/60 
             focus:border-purple-400/70 shadow-2xl
             hover:border-white/60 hover:bg-slate-800/100"
                >
                  <option value="Cash">💵 Cash</option>
                  <option value="UPI">📱 UPI</option>
                  <option value="Bank Transfer">🏦 Bank Transfer</option>
                  <option value="Card">💳 Card</option>
                </select>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => {
                    setSelectedFee(null);
                    setPaymentAmount("");
                  }}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 px-8 py-4 rounded-2xl font-bold text-xl shadow-lg transition-all backdrop-blur-sm"
                >
                  ❌ Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={
                    !paymentAmount ||
                    paymentAmount > (selectedFee.fee?.balance || 0) ||
                    isLoading
                  }
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-2xl font-bold text-xl shadow-2xl glow transition-all flex items-center justify-center gap-3 backdrop-blur-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="w-7 h-7 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      💳 Pay ₹{paymentAmount || 0}
                      <span className="text-sm font-normal">(Secure)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ENHANCED CREATE USER MODAL ================= */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="glass-card p-8 w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
              Create {form.role === "teacher" ? "👨‍🏫 Teacher" : "👨‍🎓 Student"}
            </h2>

            {/* COMMON FIELDS */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <input
                type="text"
                placeholder="Full Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="p-4 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full"
                required
              />
              <input
                type="email"
                placeholder="Email *"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="p-4 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full"
                required
              />
            </div>

            <input
              type="password"
              placeholder="Password *"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-4 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-6"
              required
            />

            {/* ============ TEACHER FIELDS ============ */}
            {form.role === "teacher" && (
              <div className="space-y-4 mb-8">
                {/* Specializations */}
                <div>
                  <label className="block text-lg font-semibold mb-3 text-indigo-400">
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
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
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
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      Login Time
                    </label>
                    <input
                      type="time"
                      value={form.loginTimeFrom}
                      onChange={(e) =>
                        setForm({ ...form, loginTimeFrom: e.target.value })
                      }
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">
                      Logout Time
                    </label>
                    <input
                      type="time"
                      value={form.loginTimeTo}
                      onChange={(e) =>
                        setForm({ ...form, loginTimeTo: e.target.value })
                      }
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 focus:ring-2 focus:ring-purple-400"
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
                  className="w-full p-4 rounded-xl bg-white/10 border border-white/20 focus:ring-2 focus:ring-purple-400"
                />
              </div>
            )}

            {/* ============ STUDENT FIELDS ============ */}
            {/* COMPLETE STUDENT FIELDS - Replace your student form section */}
            {form.role === "student" && (
              <div className="space-y-6 mb-12">
                {/* Course Selection */}
                <div>
                  <label className="block text-3xl font-bold mb-6 text-green-400 text-center">
                    📚 IT Courses
                  </label>
                  <select
                    value={form.courseName}
                    onChange={(e) =>
                      setForm({ ...form, courseName: e.target.value })
                    }
                    className="w-full p-6 text-xl rounded-3xl 
             bg-gradient-to-br from-slate-800/90 to-gray-900/90 
             border-2 border-white/30 
             text-white placeholder-gray-300 
             focus:outline-none focus:ring-4 focus:ring-green-400/60 
             focus:border-green-400/70 shadow-2xl
             hover:border-white/50 hover:bg-slate-800/100"
                  >
                    <option value="">📚 Select Course</option>
                    <option>MERN Stack Development</option>
                    <option>Python Full Stack</option>
                    <option>Java Full Stack</option>
                    <option>Digital Marketing</option>
                    <option>AWS DevOps</option>
                    <option>Data Science & AI</option>
                    <option>Cybersecurity</option>
                    <option>Mobile App Development</option>
                  </select>
                </div>

                {/* Batch Time */}
                <div>
                  <label className="block text-3xl font-bold mb-6 text-blue-400 text-center">
                    🕒 Batch Time
                  </label>
                  <select
                    value={form.batchTime}
                    onChange={(e) =>
                      setForm({ ...form, batchTime: e.target.value })
                    }
                    className="w-full p-6 text-xl rounded-3xl 
             bg-gradient-to-br from-slate-800/90 to-gray-900/90 
             border-2 border-white/30 
             text-white placeholder-gray-300 
             focus:outline-none focus:ring-4 focus:ring-blue-400/60 
             focus:border-blue-400/70 shadow-2xl
             hover:border-white/50 hover:bg-slate-800/100"
                  >
                    <option value="">🕒 Select Time Slot</option>
                    <option>9:00 AM - 10:00 AM</option>
                    <option>10:00 AM - 11:00 AM</option>
                    <option>11:00 AM - 12:00 PM</option>
                    <option>12:00 PM - 01:00 PM</option>
                    <option>01:00 PM - 02:00 PM</option>
                    <option>02:00 PM - 03:00 PM</option>
                    <option>03:00 PM - 04:00 PM</option>
                    <option>04:00 PM - 05:00 PM</option>
                    <option>05:00 PM - 06:00 PM</option>
                    <option>06:00 PM - 07:00 PM</option>
                  </select>
                </div>

                {/* ASSIGN TEACHER DROPDOWN - Add after Batch Time */}
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
                    <option value="">👨‍🏫 Select Teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name} - {teacher.specialization || "General"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contact + Fee */}
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

                <input
                  type="number"
                  placeholder="💰 Total Course Fee"
                  value={form.totalFee}
                  onChange={(e) =>
                    setForm({ ...form, totalFee: e.target.value })
                  }
                  className="w-full p-6 text-xl rounded-3xl bg-white/10 border-2 border-white/20 focus:ring-4 focus:ring-yellow-400/50 shadow-xl"
                />
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
                    batchType: "",
                    personalContact: "",
                    parentContact: "",
                    totalFee: "",
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
