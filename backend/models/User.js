const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
  },
  personalEmail: {
    type: String,
    lowercase: true,
    trim: true,
    default: null,
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  role: {
    type: String,
    default: 'intern',
    enum: [
      'intern',
      'employee',
      'team_lead',
      'team_lead_intern',
      'manager',
      'manager_intern',
      'admin',
      'cto',
      'cfo',
      'coo',
      'ceo',
    ],
  },
  userType: {
    type: String,
    enum: ['employee', 'intern'],
    default: 'employee',
  },
  password: {
    type: String,
  },
  authProvider: {
    type: String,
    enum: ['local'],
    default: 'local',
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationTokenHash: {
    type: String,
    default: null,
  },
  emailVerificationExpiresAt: {
    type: Date,
    default: null,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  subDepartmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  // Hierarchy: who does this user report to?
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  teamLeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  needsPasswordChange: {
    type: Boolean,
    default: false,
  },
});

userSchema.index({ departmentId: 1 });
userSchema.index({ reportsTo: 1 });
userSchema.index({ managerId: 1 });
userSchema.index({ teamLeadId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ userType: 1 });

userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
