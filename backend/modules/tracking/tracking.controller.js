const trackingService = require('./tracking.service');
const { getISTTime } = require('../../utils/time');

// ==================== TIME TRACKING ENDPOINTS ====================

const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const session = await trackingService.recordLogout(userId);

    res.json({
      message: 'Logout recorded successfully',
      session: {
        loginTimeIST: session.loginTimeIST,
        logoutTimeIST: session.logoutTimeIST,
        duration: session.duration,
        durationHours: (session.duration / (1000 * 60 * 60)).toFixed(2),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTimeLogs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, limit } = req.query;

    const result = await trackingService.getTimeLogs(userId, {
      startDate,
      endDate,
      limit: parseInt(limit),
    });

    res.json({
      ...result,
      totalDurationHours: (result.totalDuration / (1000 * 60 * 60)).toFixed(2),
    });
  } catch (error) {
    next(error);
  }
};

const getActiveSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const session = await trackingService.getActiveSession(userId);

    if (!session) {
      return res.json({ activeSession: null, isActive: false });
    }

    const loginDate = new Date(session.loginTimeIST);
    const currentDuration = getISTTime() - loginDate;

    res.json({
      activeSession: {
        ...session.toObject(),
        currentDuration,
        currentDurationHours: (currentDuration / (1000 * 60 * 60)).toFixed(2),
      },
      isActive: true,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== PAGE ACTIVITY ENDPOINTS ====================

const logPageVisit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { pagePath, pageTitle, duration } = req.body;

    if (!pagePath) {
      return res.status(400).json({ error: 'pagePath is required' });
    }

    const activity = await trackingService.logPageVisit(
      userId,
      pagePath,
      pageTitle,
      duration
    );

    res.json({ message: 'Page visit logged', activity });
  } catch (error) {
    next(error);
  }
};

const getPageActivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { activityType, startDate, endDate, limit } = req.query;

    const activities = await trackingService.getPageActivity(userId, {
      activityType,
      startDate,
      endDate,
      limit: parseInt(limit),
    });

    res.json({ activities, count: activities.length });
  } catch (error) {
    next(error);
  }
};

const bulkLogActivities = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { activities } = req.body;

    if (!Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({ error: 'activities array is required' });
    }

    const results = [];
    for (const activity of activities) {
      const logged = await trackingService.logPageActivity(userId, activity);
      results.push(logged);
    }

    res.json({
      message: `${results.length} activities logged`,
      activities: results,
    });
  } catch (error) {
    next(error);
  }
};

// ==================== IDLE & FOCUS ENDPOINTS ====================

const logIdle = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, duration } = req.body;

    if (status === 'start') {
      const activity = await trackingService.logIdleStart(userId);
      res.json({ message: 'Idle start logged', activity });
    } else if (status === 'end') {
      const activity = await trackingService.logIdleEnd(userId, duration || 0);
      res.json({
        message: 'Idle end logged',
        activity,
        idleDuration: duration,
      });
    } else {
      res.status(400).json({ error: 'status must be "start" or "end"' });
    }
  } catch (error) {
    next(error);
  }
};

const logFocus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, pagePath } = req.body;

    if (status === 'loss') {
      const activity = await trackingService.logFocusLoss(userId, pagePath);
      res.json({ message: 'Focus loss logged', activity });
    } else if (status === 'gain') {
      const activity = await trackingService.logFocusGain(userId, pagePath);
      res.json({ message: 'Focus gain logged', activity });
    } else {
      res.status(400).json({ error: 'status must be "loss" or "gain"' });
    }
  } catch (error) {
    next(error);
  }
};

// ==================== PRODUCTIVITY ENDPOINTS ====================

const calculateProductivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    const score = await trackingService.calculateProductivityScore(
      userId,
      targetDate
    );

    res.json({
      message: 'Productivity score calculated',
      score,
    });
  } catch (error) {
    next(error);
  }
};

const getProductivityAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, limit } = req.query;

    const analytics = await trackingService.getProductivityAnalytics(userId, {
      startDate,
      endDate,
      limit: parseInt(limit),
    });

    res.json(analytics);
  } catch (error) {
    next(error);
  }
};

const getRealTimeProductivity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await trackingService.getRealTimeProductivity(userId);

    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Time tracking
  logout,
  getTimeLogs,
  getActiveSession,

  // Page activity
  logPageVisit,
  getPageActivity,
  bulkLogActivities,

  // Idle & Focus
  logIdle,
  logFocus,

  // Productivity
  calculateProductivity,
  getProductivityAnalytics,
  getRealTimeProductivity,
};
