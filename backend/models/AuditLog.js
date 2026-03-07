const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema(
  {
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditSchema);
