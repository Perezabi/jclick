import { useState, useEffect } from "react";
import axios from "axios";
import AOS from "aos";
import "aos/dist/aos.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaMoon, FaSun } from "react-icons/fa";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  // also keep body class in sync so the page background is correct
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  const handleLogin = async () => {
    try {
      const API = import.meta.env.VITE_API_URL;
      const res = await axios.post(`${API}/auth/login`, { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("userName", res.data.user.name || "");

      // IMMEDIATE REDIRECT
      const role = res.data.user.role;
      if (role === "super") window.location.href = "/dashboard";
      else if (role === "teacher") window.location.href = "/teacher-dashboard";
      else if (role === "student") window.location.href = "/student-dashboard";
    } catch (err) {
      toast.error(err.response?.data || "Login failed");
    }
  };

  return (
    <div
      className={`h-screen flex items-center justify-center ${darkMode ? "bg-animated" : "bg-gradient-to-br from-blue-50 to-indigo-100"} relative`}
    >
      {/* Background Blur Circles */}
      {darkMode && (
        <>
          <div className="absolute w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-30 top-10 left-10"></div>
          <div className="absolute w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-30 bottom-10 right-10"></div>
        </>
      )}

      <div
        data-aos="zoom-in"
        className={`${darkMode ? "glass-card border border-white/20 shadow-2xl" : "bg-white border border-blue-200 shadow-2xl"} p-10 w-[400px] z-10 rounded-3xl`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2
            className={`text-4xl font-bold tracking-wide ${darkMode ? "" : "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"}`}
          >
            Welcome Back
          </h2>
          <button
            onClick={() => {
              const newMode = !darkMode;
              setDarkMode(newMode);
              localStorage.setItem("theme", newMode ? "dark" : "light");
            }}
            className={`p-2 rounded-full transition-all ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-yellow-400" : "bg-blue-100 hover:bg-blue-200 text-blue-600"}`}
            title={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            className={`w-full p-3 rounded-xl ${darkMode ? "bg-white/10 border-white/20 text-white placeholder-gray-400" : "bg-blue-50 border-blue-300 text-gray-900 placeholder-gray-600"} border focus:outline-none focus:ring-2 focus:ring-indigo-400 transition`}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            className={`w-full p-3 rounded-xl ${darkMode ? "bg-white/10 border-white/20 text-white placeholder-gray-400" : "bg-blue-50 border-blue-300 text-gray-900 placeholder-gray-600"} border focus:outline-none focus:ring-2 focus:ring-indigo-400 transition`}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className={`w-full py-3 rounded-xl ${darkMode ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700" : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"} text-white font-semibold transition-all duration-300 glow`}
          >
            Sign In
          </button>
        </div>

        <p
          className={`text-center text-sm mt-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
        >
          Super / Teacher / Student Login
        </p>
      </div>
    </div>
  );
}

export default Login;
