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

// Admin-only user management
router.post('/admin/users', authenticate, authorizeRoles('admin'), authController.adminCreateUser);
router.patch('/admin/users/:id/password', authenticate, authorizeRoles('admin'), authController.adminUpdatePassword);
router.delete('/admin/users/:id', authenticate, authorizeRoles('admin'), authController.adminDeleteUser);

// Get users (for list displays)
router.get('/users', authenticate, usersController.getUsers);

module.exports = router;

