const express = require('express');
const router = express.Router();
const trackingController = require('./tracking.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticate);

// ==================== TIME TRACKING ROUTES ====================

// GET /api/tracking/time - Get user's time logs
router.get('/time', trackingController.getTimeLogs);

// GET /api/tracking/time/active - Get active session
router.get('/time/active', trackingController.getActiveSession);

// POST /api/tracking/time/logout - Record logout
router.post('/time/logout', trackingController.logout);

// ==================== PAGE ACTIVITY ROUTES ====================

// GET /api/tracking/page-activity - Get page activity logs
router.get('/page-activity', trackingController.getPageActivity);

// POST /api/tracking/page-activity - Log a page visit
router.post('/page-activity', trackingController.logPageVisit);

// POST /api/tracking/page-activity/bulk - Bulk log activities
router.post('/page-activity/bulk', trackingController.bulkLogActivities);

// ==================== IDLE & FOCUS ROUTES ====================

// POST /api/tracking/idle - Log idle detection (start/end)
router.post('/idle', trackingController.logIdle);

// POST /api/tracking/focus - Log focus loss/gain
router.post('/focus', trackingController.logFocus);

// ==================== PRODUCTIVITY ROUTES ====================

// GET /api/tracking/productivity - Get productivity analytics
router.get('/productivity', trackingController.getProductivityAnalytics);

// GET /api/tracking/productivity/realtime - Get real-time productivity data
router.get('/productivity/realtime', trackingController.getRealTimeProductivity);

// POST /api/tracking/productivity/calculate - Manually trigger productivity calculation
router.post('/productivity/calculate', trackingController.calculateProductivity);

module.exports = router;
