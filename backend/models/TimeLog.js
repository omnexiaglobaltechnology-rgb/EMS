const mongoose = require('mongoose');
const { toISTISOString } = require('../utils/time');

const timeLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  userName: {
    type: String,
    required: true,
  },
  userRole: {
    type: String,
    required: true,
  },
  loginTimeIST: {
    type: String,
    required: true,
  },
  logoutTimeIST: {
    type: String,
    default: null,
  },
  duration: {
    type: Number, // in milliseconds
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  createdAtIST: {
    type: String,
    required: true,
  },
});

// Calculate duration when logout time is set
timeLogSchema.pre('save', function (next) {
  if (this.logoutTimeIST && this.loginTimeIST && !this.duration) {
    const loginDate = new Date(this.loginTimeIST);
    const logoutDate = new Date(this.logoutTimeIST);
    this.duration = logoutDate - loginDate;
    this.isActive = false;
  }
  next();
});

timeLogSchema.index({ userId: 1, loginTimeIST: -1 });
timeLogSchema.index({ isActive: 1 });
timeLogSchema.index({ userRole: 1 });

module.exports = mongoose.model('TimeLog', timeLogSchema);
