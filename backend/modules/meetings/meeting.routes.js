const express = require('express');
const meetingController = require('./meeting.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Meeting CRUD
router.post('/', meetingController.create);
router.get('/', meetingController.getAll);
router.get('/invitees/search', meetingController.searchInvitees);
router.get('/:id', meetingController.getById);
router.patch('/:id', meetingController.update);
router.delete('/:id', meetingController.remove);
router.patch('/:id/invitees', meetingController.updateInvitees);

// Config (Admin only)
const { authorizeRoles } = require('../../middleware/auth'); // Check path? In previous files it was ../../middleware/auth
router.get('/config', authorizeRoles('ceo'), meetingController.getConfig);
router.patch('/config', authorizeRoles('ceo'), meetingController.updateConfig);

console.log('Meeting routes loaded');

module.exports = router;
