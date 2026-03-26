const express = require('express');
const router = express.Router();
const submissionsController = require('./submissions.controller');
const upload = require('../../config/multer');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorizePermission } = require('../../middlewares/role.middleware');

router.use(authenticate);

router.post(
  '/',
  authorizePermission('submission.create'),
  (req, res, next) => {
    console.log('[POST /] Incoming submission request');
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('[multer] Error:', err.message);
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      console.log('[multer] File processed, calling controller');
      return submissionsController.create(req, res);
    });
  }
);

router.get(
  '/task/:taskId',
  authorizePermission('submission.read'),
  submissionsController.getByTask
);
router.get(
  '/:id',
  authorizePermission('submission.read'),
  submissionsController.getSubmissionById
);
router.get(
  '/task/:taskId/user/:submittedById',
  authorizePermission('submission.read'),
  submissionsController.getSubmissionHistory
);
router.patch(
  '/:id/review',
  authorizePermission('submission.review'),
  submissionsController.review
);
router.delete(
  '/:id',
  authorizePermission('submission.delete'),
  submissionsController.deleteSubmission
);

module.exports = router;
