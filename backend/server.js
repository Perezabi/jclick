const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

dotenv.config();

const User = require("./models/User");
const teacherRoutes = require("./routes/teacher");

const app = express();

// ✅ FIXED CORS for Vite
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

// Database + Super Admin
mongoose.connect(process.env.MONGO_URL).then(async () => {
  console.log("✅ MongoDB Connected");

  const adminEmail = "admin@gmail.com";
  const adminPassword = "123456";

  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    await User.create({
      name: "Super Admin",
      email: adminEmail,
      password: hashed,
      role: "super",
    });
    console.log("🔥 Super Admin Created: admin@gmail.com / 123456");
  }
});

// Add this to your server.js BEFORE routes
app.use((err, req, res, next) => {
  console.error("🚨 GLOBAL ERROR:", err);
  res.status(500).json({ error: "Something went wrong!" });
});

// ROUTES
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/fees", require("./routes/fees"));
app.use("/api/salary", require("./routes/salary"));
app.use("/api/idcard", require("./routes/idcard"));
app.use("/api/teacher", require("./routes/teacher"));
app.use("/api/exams", require("./routes/exams"));

// Add this TEST route FIRST (before all other routes)
app.get("/api/teacher/test", (req, res) => {
  res.json({ message: "✅ Teacher routes working!", timestamp: new Date() });
});

app.get("/", (req, res) => res.json({ message: "School API Running!" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server: ${PORT}`));
