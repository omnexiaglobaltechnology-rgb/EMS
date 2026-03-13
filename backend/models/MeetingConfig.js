const mongoose = require("mongoose");

const meetingConfigSchema = new mongoose.Schema({
  allowedRoles: {
    type: [String],
    default: ["CEO", "CTO", "CFO", "COO", "manager", "team_lead"],
  },
  canInviteAcrossDepartments: {
    type: [String],
    default: ["CEO", "CTO", "CFO", "COO"], // Top level and HR usually
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }
}, { timestamps: true });

module.exports = mongoose.model("MeetingConfig", meetingConfigSchema);
