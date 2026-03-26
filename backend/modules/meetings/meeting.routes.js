const express = require('express');
const meetingController = require('./meeting.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Config (Admin only)
const { authorizeRoles } = require('../../middlewares/role.middleware'); 
router.get('/config', authorizeRoles('ceo', 'admin'), meetingController.getConfig);
router.patch('/config', authorizeRoles('ceo', 'admin'), meetingController.updateConfig);

// Meeting CRUD
router.post('/', meetingController.create);
router.get('/', meetingController.getAll);
router.get('/invitees/search', meetingController.searchInvitees);
router.get('/:id', meetingController.getById);
router.patch('/:id', meetingController.update);
router.delete('/:id', meetingController.remove);
router.patch('/:id/invitees', meetingController.updateInvitees);

console.log('Meeting routes loaded');

module.exports = router;
