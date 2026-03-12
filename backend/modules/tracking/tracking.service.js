const TimeLog = require('../../models/TimeLog');
const ActivityLog = require('../../models/ActivityLog');
const ProductivityScore = require('../../models/ProductivityScore');
const Submission = require('../../models/Submission');
const Task = require('../../models/Task');
const {
  getISTTime,
  getISTStartOfDay,
  getISTEndOfDay,
  toISTISOString,
} = require('../../utils/time');

const toSafeLimit = (value, fallback = 100, max = 500) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

const calculateScoreValue = ({
  totalActiveTime,
  totalIdleTime,
  totalFocusTime,
  focusLossCount,
  tasksCompleted,
  submissionsCount,
}) => {
  const totalTime = totalActiveTime + totalIdleTime;
  if (totalTime <= 0) return 0;

  const activeTimeRatio = totalActiveTime / totalTime;
  const focusTimeRatio = totalFocusTime / totalTime;
  const idlePenalty = totalIdleTime / totalTime;
  const focusLossPenalty = Math.min(focusLossCount / 50, 0.3);

  const baseScore =
    activeTimeRatio * 40 +
    focusTimeRatio * 30 +
    (1 - idlePenalty) * 20 +
    (1 - focusLossPenalty) * 10;

  const taskBonus = Math.min(tasksCompleted * 2, 10);
  const submissionBonus = Math.min(submissionsCount * 3, 10);

  return Math.min(Math.round(baseScore + taskBonus + submissionBonus), 100);
};

// ==================== TIME TRACKING ====================

const recordLogin = async (userId, ipAddress, userAgent) => {
  const User = require('../../models/User');
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const loginAt = getISTTime();
  return TimeLog.create({
    userId,
    userName: user.name,
    userRole: user.role || 'intern',
    loginTimeIST: toISTISOString(loginAt),
    ipAddress,
    userAgent,
    isActive: true,
    createdAtIST: toISTISOString(loginAt),
  });
};

const recordLogout = async (userId) => {
  const activeSession = await TimeLog.findOne({ userId, isActive: true }).sort({
    loginTimeIST: -1,
  });

  if (!activeSession) {
    throw new Error('No active session found');
  }

  const logoutAt = getISTTime();
  activeSession.logoutTimeIST = toISTISOString(logoutAt);
  const loginDate = new Date(activeSession.loginTimeIST);
  activeSession.duration = logoutAt - loginDate;
  activeSession.isActive = false;

  await activeSession.save();
  return activeSession;
};

const getActiveSession = async (userId) => {
  return TimeLog.findOne({ userId, isActive: true }).sort({
    loginTimeIST: -1,
  });
};

const getTimeLogs = async (userId, filters = {}) => {
  const query = { userId };

  if (filters.startDate || filters.endDate) {
    query.loginTimeIST = {};
    if (filters.startDate) {
      const startIST = toISTISOString(new Date(filters.startDate));
      query.loginTimeIST.$gte = startIST;
    }
    if (filters.endDate) {
      const endIST = toISTISOString(new Date(filters.endDate));
      query.loginTimeIST.$lte = endIST;
    }
  }

  const logs = await TimeLog.find(query)
    .sort({ loginTimeIST: -1 })
    .limit(toSafeLimit(filters.limit));

  const totalDuration = logs.reduce(
    (sum, log) => sum + (log.duration || 0),
    0
  );

  return {
    logs,
    totalDuration,
    totalSessions: logs.length,
  };
};

// ==================== PAGE ACTIVITY TRACKING ====================

const logPageActivity = async (userId, activityData) => {
  const { activityType, pagePath, pageTitle, duration, metadata } =
    activityData;

  const activeSession = await getActiveSession(userId);
  const activityAt = getISTTime();

  return ActivityLog.create({
    userId,
    sessionId: activeSession ? activeSession._id : null,
    activityType,
    pagePath,
    pageTitle,
    duration: duration || 0,
    metadata: metadata || {},
    timestamp: activityAt,
    timestampIST: toISTISOString(activityAt),
  });
};

const logPageVisit = async (userId, pagePath, pageTitle, duration = 0) => {
  return logPageActivity(userId, {
    activityType: 'page_visit',
    pagePath,
    pageTitle,
    duration,
  });
};

const getPageActivity = async (userId, filters = {}) => {
  const query = { userId };

  if (filters.activityType) query.activityType = filters.activityType;

  if (filters.startDate || filters.endDate) {
    query.timestamp = {};
    if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
    if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
  }

  return ActivityLog.find(query)
    .sort({ timestamp: -1 })
    .limit(toSafeLimit(filters.limit));
};

// ==================== IDLE & FOCUS TRACKING ====================

const logIdleStart = async (userId) => {
  return logPageActivity(userId, {
    activityType: 'idle_start',
    metadata: { note: 'User became idle' },
  });
};

const logIdleEnd = async (userId, idleDuration) => {
  return logPageActivity(userId, {
    activityType: 'idle_end',
    duration: idleDuration,
    metadata: { note: 'User became active again' },
  });
};

const logFocusLoss = async (userId, pagePath) => {
  return logPageActivity(userId, {
    activityType: 'focus_loss',
    pagePath,
    metadata: { note: 'User lost focus (tab/window switch)' },
  });
};

const logFocusGain = async (userId, pagePath) => {
  return logPageActivity(userId, {
    activityType: 'focus_gain',
    pagePath,
    metadata: { note: 'User gained focus back' },
  });
};

// ==================== PRODUCTIVITY ANALYTICS ====================

const calculateProductivityScore = async (userId, date = null) => {
  const targetDate = date ? new Date(date) : getISTTime();
  const startOfDay = getISTStartOfDay(targetDate);
  const endOfDay = getISTEndOfDay(targetDate);

  const activities = await ActivityLog.find({
    userId,
    timestamp: { $gte: startOfDay, $lte: endOfDay },
  });

  let totalIdleTime = 0;
  let totalFocusTime = 0;
  let pageVisits = 0;
  let focusLossCount = 0;

  activities.forEach((activity) => {
    if (activity.activityType === 'idle_end')
      totalIdleTime += activity.duration || 0;
    if (activity.activityType === 'page_visit') {
      pageVisits += 1;
      totalFocusTime += activity.duration || 0;
    }
    if (activity.activityType === 'focus_loss') focusLossCount += 1;
  });

  const timeLogs = await TimeLog.find({
    userId,
    loginTimeIST: {
      $gte: toISTISOString(startOfDay),
      $lte: toISTISOString(endOfDay),
    },
  });

  const now = getISTTime();
  const totalActiveTime = timeLogs.reduce((sum, log) => {
    if (log.logoutTimeIST) {
      const loginDate = new Date(log.loginTimeIST);
      const logoutDate = new Date(log.logoutTimeIST);
      return sum + (logoutDate - loginDate);
    }
    if (log.isActive) {
      const loginDate = new Date(log.loginTimeIST);
      return sum + (now - loginDate);
    }
    return sum;
  }, 0);

  const tasksCompleted = await Task.countDocuments({
    assignedTo: userId,
    status: 'completed',
    updatedAt: { $gte: startOfDay, $lte: endOfDay },
  });

  const submissionsCount = await Submission.countDocuments({
    userId,
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  const productivityScore = calculateScoreValue({
    totalActiveTime,
    totalIdleTime,
    totalFocusTime,
    focusLossCount,
    tasksCompleted,
    submissionsCount,
  });

  const payload = {
    userId,
    date: startOfDay,
    totalActiveTime,
    totalIdleTime,
    totalFocusTime,
    pageVisits,
    focusLossCount,
    tasksCompleted,
    submissionsCount,
    productivityScore,
    updatedAt: now,
  };

  return ProductivityScore.findOneAndUpdate(
    { userId, date: startOfDay },
    { $set: payload, $setOnInsert: { createdAt: now } },
    { upsert: true, new: true }
  );
};

const getProductivityAnalytics = async (userId, filters = {}) => {
  const query = { userId };

  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = new Date(filters.startDate);
    if (filters.endDate) query.date.$lte = new Date(filters.endDate);
  }

  const scores = await ProductivityScore.find(query)
    .sort({ date: -1 })
    .limit(toSafeLimit(filters.limit, 30));

  const avgScore = scores.length
    ? scores.reduce(
        (sum, score) => sum + (score.productivityScore || 0),
        0
      ) / scores.length
    : 0;

  const avgActiveTime = scores.length
    ? scores.reduce(
        (sum, score) => sum + (score.totalActiveTime || 0),
        0
      ) / scores.length
    : 0;

  return {
    scores,
    analytics: {
      averageProductivityScore: Math.round(avgScore),
      averageActiveTime: Math.round(avgActiveTime),
      totalDays: scores.length,
    },
  };
};

const getRealTimeProductivity = async (userId) => {
  const todayStart = getISTStartOfDay();

  let todayScore = await ProductivityScore.findOne({
    userId,
    date: todayStart,
  });
  if (!todayScore) {
    todayScore = await calculateProductivityScore(userId);
  }

  const activeSession = await getActiveSession(userId);
  const oneHourAgo = new Date(getISTTime().getTime() - 60 * 60 * 1000);

  const recentActivities = await ActivityLog.find({
    userId,
    timestamp: { $gte: oneHourAgo },
  })
    .sort({ timestamp: -1 })
    .limit(20);

  return {
    todayScore,
    activeSession,
    recentActivities,
    isActive: Boolean(activeSession),
  };
};

module.exports = {
  recordLogin,
  recordLogout,
  getActiveSession,
  getTimeLogs,
  logPageActivity,
  logPageVisit,
  getPageActivity,
  logIdleStart,
  logIdleEnd,
  logFocusLoss,
  logFocusGain,
  calculateProductivityScore,
  getProductivityAnalytics,
  getRealTimeProductivity,
};
