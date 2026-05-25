const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const Task = require("./models/Task");
const logger = require("./utils/logger");

const uploadsDir = path.join(__dirname, "uploads");

// Run every day at midnight (00:00)
cron.schedule("0 0 * * *", async () => {
  logger.info("🧹 Running daily cleanup job for old task files...");
  
  const now = Date.now();
  const MAX_AGE = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds

  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    let deletedCount = 0;

    files.forEach((file) => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);

      // If the file's last modified time is older than the MAX_AGE, delete it
      if (now - stats.mtimeMs > MAX_AGE) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });

    logger.info(deletedCount > 0 ? `🗑️ Successfully deleted ${deletedCount} old files.` : "✅ No old files needed deletion.");
  }

  try {
    // Clear screenshot references from MongoDB for tasks older than 90 days
    const ninetyDaysAgo = new Date(now - MAX_AGE);
    const result = await Task.updateMany(
      { "submission.submittedAt": { $lt: ninetyDaysAgo } },
      { $set: { "submission.screenshot": "", "submission.screenshots": [] } }
    );
    
    if (result.modifiedCount > 0) {
      logger.info(`🧹 Cleared screenshot references from ${result.modifiedCount} old tasks in the database.`);
    }
  } catch (err) {
    logger.error(`❌ Failed to clear old task screenshot references from database: ${err.message}`);
  }
});