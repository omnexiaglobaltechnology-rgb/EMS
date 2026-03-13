const express = require('express');
const departmentController = require('./department.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizeRoles } = require('../../middlewares/role.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Anyone authenticated can list departments
router.get('/', departmentController.getAll);
router.get('/:id', departmentController.getById);
router.get('/:id/users', departmentController.getUsers);

// Admin only for CUD
router.post('/', authorizeRoles('admin', 'ceo'), departmentController.create);
router.patch(
  '/:id',
  authorizeRoles('admin', 'ceo'),
  departmentController.update
);
router.delete(
  '/:id',
  authorizeRoles('admin', 'ceo'),
  departmentController.remove
);

console.log('Department routes loaded');

module.exports = router;
