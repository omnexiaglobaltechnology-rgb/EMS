const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  submittedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  versionNo: {
    type: Number,
    required: true,
  },
  fileUrl: {
    type: String,
  },
  externalLink: {
    type: String,
  },
  comment: {
    type: String,
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'approved', 'rejected'],
  },
  reviewedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewComment: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

submissionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

submissionSchema.index({ taskId: 1 });
submissionSchema.index({ submittedById: 1 });
submissionSchema.index({ reviewedById: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
