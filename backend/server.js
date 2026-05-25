const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { sanitize: mongoSanitize } = require('express-mongo-sanitize');
const compression = require("compression");
const morgan = require("morgan");
const logger = require("./utils/logger");
const path = require("path");

// Load environment variables dynamically based on NODE_ENV
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : process.env.NODE_ENV === "staging" ? ".env.staging" : ".env";
dotenv.config({ path: path.resolve(__dirname, envFile) });

const User = require("./models/User");
const teacherRoutes = require("./routes/teacher");
const noCache = require("./middleware/cacheBuster");
const errorHandler = require("./middleware/errorHandler");

// Initialize scheduled jobs
require("./cron");

const app = express();

// Trust proxy (Crucial for rate-limiting behind load balancers like Nginx/AWS/Render)
app.set('trust proxy', 1);

// ✅ FIXED CORS for Vite
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

// Compress all responses to reduce bandwidth usage
app.use(compression());

// HTTP Request Logging (pipes Morgan output into our Winston logger)
app.use(morgan('combined', { 
  stream: { write: message => logger.info(message.trim()) },
  skip: (req, res) => {
    return req.originalUrl.startsWith('/api/uploads') || req.originalUrl === '/';
  }
}));

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Explicitly allow cross-origin requests for static files
  xssFilter: true, // Adds X-XSS-Protection header
  noSniff: true, // Adds X-Content-Type-Options: nosniff
  frameguard: { action: "deny" } // Prevents clickjacking by denying iframe embedding completely
}));

// Data Sanitization against NoSQL query injection and XSS in request bodies/params
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize(req.body);
  if (req.params) req.params = mongoSanitize(req.params);
  if (req.headers) req.headers = mongoSanitize(req.headers);
  const queryDescriptor = Object.getOwnPropertyDescriptor(req, 'query');
  if (req.query && queryDescriptor && queryDescriptor.writable) {
    req.query = mongoSanitize(req.query);
  }
  next();
});

// Rate Limiting (Protects against DDoS and brute force)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per 15 minutes
  message: { error: "Too many requests from this IP, please try again later." }
});
app.use("/api/", apiLimiter);

// Stricter Rate Limiting for Auth Routes (Prevents brute force attacks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per 15 minutes
  message: { error: "Too many authentication attempts from this IP, please try again after 15 minutes." }
});

// Serve uploaded files statically
app.use('/api/uploads', express.static('uploads'));

// Prevent caching for all dynamic API routes globally
app.use('/api', noCache);

// Database + Super Admin
mongoose.connect(process.env.MONGO_URL, {
  maxPoolSize: 50, // Maintain up to 50 socket connections
  minPoolSize: 10, // Keep at least 10 active connections
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
}).then(async () => {
  logger.info("✅ MongoDB Connected");

  // Performance Optimizations: Create compound indexes for fast dashboard queries
  try {
    await mongoose.connection.db.collection('users').createIndex({ role: 1, teacherId: 1 });
    await mongoose.connection.db.collection('tasks').createIndex({ teacherId: 1, studentId: 1 });
    await mongoose.connection.db.collection('tasks').createIndex({ studentId: 1, dueDate: -1 });
    await mongoose.connection.db.collection('attendances').createIndex({ teacherId: 1, date: -1 });
    await mongoose.connection.db.collection('dailyreports').createIndex({ teacherId: 1, date: -1 });
    await mongoose.connection.db.collection('examattempts').createIndex({ studentId: 1, examId: 1 });
    logger.info("⚡ MongoDB Indexes Verified");
  } catch (err) {
    logger.error(`Index creation error: ${err.message}`);
  }

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
    logger.info("🔥 Super Admin Created: admin@gmail.com / 123456");
  }
});

// ROUTES
app.use("/api/auth", authLimiter, require("./routes/auth"));
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

// Health Check Endpoint for Docker
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

app.get("/", (req, res) => res.json({ message: "School API Running!" }));

// Centralized Error Handler (MUST be the last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT}`));

// === Graceful Shutdown Handler ===
const gracefulShutdown = () => {
  logger.info("🛑 Received kill signal, shutting down gracefully...");
  
  // Stop accepting new connections and finish existing ones
  server.close(async () => {
    logger.info("🔒 Closed out remaining HTTP connections.");
    try {
      await mongoose.connection.close(false);
      logger.info("✅ MongoDB connection safely closed.");
      process.exit(0);
    } catch (err) {
      logger.error(`❌ Error closing MongoDB connection: ${err.message}`);
      process.exit(1);
    }
  });

  // Force shutdown if it takes longer than 10 seconds
  setTimeout(() => {
    logger.error("⚠️ Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on("SIGTERM", gracefulShutdown); // Sent by hosting platforms (Render, Heroku, etc.)
process.on("SIGINT", gracefulShutdown);  // Sent by Ctrl+C in terminal
