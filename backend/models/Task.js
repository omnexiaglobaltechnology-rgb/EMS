const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: false,
    default: null,
  },
  assignedToId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  priority: {
    type: String,
    default: 'medium',
    enum: ['low', 'medium', 'high'],
  },
  status: {
    type: String,
    default: 'assigned',
    enum: ['assigned', 'delegated', 'submitted', 'under_review', 'completed', 'rejected', 'in_progress'],
  },
  currentResponsibleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  versionNo: {
    type: Number,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  history: [
    {
      status: String,
      changedById: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      note: String,
      at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

taskSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

taskSchema.index({ departmentId: 1 });
taskSchema.index({ assignedToId: 1 });
taskSchema.index({ assignedById: 1 });
taskSchema.index({ status: 1 });

module.exports = mongoose.model('Task', taskSchema);
