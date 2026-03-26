const mongoose = require('mongoose');

const taskVersionSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  versionNo: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  changedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

taskVersionSchema.index({ taskId: 1 });
taskVersionSchema.index({ changedById: 1 });

module.exports = mongoose.model('TaskVersion', taskVersionSchema);
