const mongoose = require('mongoose');
const { toISTISOString } = require('../utils/time');

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeLog',
      index: true,
    },
    activityType: {
      type: String,
      required: true,
      enum: [
        'page_visit',
        'idle_start',
        'idle_end',
        'focus_loss',
        'focus_gain',
        'click',
        'scroll',
      ],
    },
    pagePath: {
      type: String,
    },
    pageTitle: {
      type: String,
    },
    duration: {
      type: Number, // in milliseconds
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    timestampIST: {
      type: String,
    },
  },
  {
    collection: 'pageactivities',
  }
);

activityLogSchema.pre('save', function (next) {
  if (this.timestamp) {
    this.timestampIST = toISTISOString(this.timestamp);
  }
  next();
});

activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ sessionId: 1, timestamp: -1 });
activityLogSchema.index({ activityType: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
