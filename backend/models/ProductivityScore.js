const mongoose = require('mongoose');
const { getISTTime } = require('../utils/time');

const productivityScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  totalActiveTime: {
    type: Number, // in milliseconds
    default: 0,
  },
  totalIdleTime: {
    type: Number, // in milliseconds
    default: 0,
  },
  totalFocusTime: {
    type: Number, // in milliseconds
    default: 0,
  },
  pageVisits: {
    type: Number,
    default: 0,
  },
  focusLossCount: {
    type: Number,
    default: 0,
  },
  productivityScore: {
    type: Number, // 0–100
    default: 0,
  },
  tasksCompleted: {
    type: Number,
    default: 0,
  },
  submissionsCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: getISTTime,
  },
  updatedAt: {
    type: Date,
    default: getISTTime,
  },
});

// Calculate productivity score before saving
productivityScoreSchema.pre('save', function (next) {
  const totalTime = this.totalActiveTime + this.totalIdleTime;

  if (totalTime === 0) {
    this.productivityScore = 0;
    return next();
  }

  const activeTimeRatio = this.totalActiveTime / totalTime;
  const focusTimeRatio = totalTime > 0 ? this.totalFocusTime / totalTime : 0;
  const idlePenalty = this.totalIdleTime / totalTime;
  const focusLossPenalty = Math.min(this.focusLossCount / 50, 0.3);

  const score =
    activeTimeRatio * 40 +
    focusTimeRatio * 30 +
    (1 - idlePenalty) * 20 +
    (1 - focusLossPenalty) * 10;

  const taskBonus = Math.min(this.tasksCompleted * 2, 10);
  const submissionBonus = Math.min(this.submissionsCount * 3, 10);

  this.productivityScore = Math.min(
    Math.round(score + taskBonus + submissionBonus),
    100
  );
  this.updatedAt = getISTTime();

  next();
});

productivityScoreSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ProductivityScore', productivityScoreSchema);
