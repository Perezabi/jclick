import { useState, useEffect } from "react";
import axios from "axios";
import AOS from "aos";
import "aos/dist/aos.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  const handleLogin = async () => {
    try {
      const API = import.meta.env.VITE_API_URL;
      const res = await axios.post(
        `${API}/auth/login`,
        { email, password },
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("userName", res.data.user.name || '');

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
    <div className="h-screen flex items-center justify-center bg-animated relative">
      {/* Background Blur Circles */}
      <div className="absolute w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-30 top-10 left-10"></div>
      <div className="absolute w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-30 bottom-10 right-10"></div>

      <div data-aos="zoom-in" className="glass-card p-10 w-[400px] z-10">
        <h2 className="text-4xl font-bold text-center mb-6 tracking-wide">
          Welcome Back
        </h2>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-105 transition-all duration-300 font-semibold glow"
          >
            Sign In
          </button>
        </div>

        <p className="text-center text-sm mt-6 text-gray-300">
          Super / Teacher / Student Login
        </p>
      </div>
    </div>
  );
}

export default Login;
