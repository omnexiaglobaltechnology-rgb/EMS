const express = require('express');

const authController = require('./auth.controller');
const usersController = require('./users.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');

const router = express.Router();

// Public login/logout
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.patch('/profile', authenticate, usersController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);

// Admin-only user management
router.post(
  '/admin/users',
  authenticate,
  authorizeRoles('admin'),
  authController.adminCreateUser
);
router.patch(
  '/admin/users/:id/password',
  authenticate,
  authorizeRoles('admin'),
  authController.adminUpdatePassword
);
router.delete(
  '/admin/users/:id',
  authenticate,
  authorizeRoles('admin'),
  authController.adminDeleteUser
);

// Get users (for list displays)
router.get('/users', authenticate, usersController.getUsers);
router.get('/users/:id', authenticate, usersController.getUserById);

// Migration/Fix route
router.post('/fix-data', authenticate, authorizeRoles('admin'), usersController.fixUserData);

// Temporary bootstrap route (Public) - Supports both for ease of use
router.all('/setup-admin', usersController.setupAdmin);

module.exports = router;
