console.log('Task routes loaded');

const express = require('express');
const router = express.Router();
const taskController = require('./task.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizePermission } = require('../../middlewares/role.middleware');

router.use(authenticate);

router.post('/', authorizePermission('task.create'), taskController.createTask);
router.get('/', authorizePermission('task.read'), taskController.getTasks);
router.get('/:id', authorizePermission('task.read'), taskController.getTaskById);
router.patch('/:id', authorizePermission('task.update'), taskController.updateTask);
router.delete('/:id', authorizePermission('task.delete'), taskController.deleteTask);
router.get(
  '/:id/versions',
  authorizePermission('task.read'),
  taskController.getTaskVersions
);
router.patch(
  '/:id/assign',
  authorizePermission('task.assign'),
  taskController.assignTask
);
router.patch(
  '/:id/delegate',
  authorizePermission('task.delegate'),
  taskController.delegateTask
);
router.patch(
  '/:id/submit',
  authorizePermission('task.submit'),
  taskController.submitTask
);
router.patch(
  '/:id/review',
  authorizePermission('task.review'),
  taskController.reviewTask
);

module.exports = router;
