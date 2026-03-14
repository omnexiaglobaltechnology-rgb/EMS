const express = require('express');
const multer = require('multer');
const path = require('path');
const chatController = require('./chat.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

// Image-only upload filter (PNG/JPG only)
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/chat');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const imageFilter = (req, file, cb) => {
  const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG and JPG images are allowed'), false);
  }
};

const upload = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// All routes require authentication
router.use(authenticate);

// Chat rooms
router.get('/rooms', chatController.getRooms);
router.get('/rooms/:id/messages', chatController.getMessages);
router.post(
  '/rooms/:id/messages',
  upload.single('image'),
  chatController.sendMessage
);
router.patch('/rooms/:id/rename', chatController.renameRoom);
router.patch('/rooms/:id', chatController.updateRoom);
router.post('/admin/create', chatController.adminCreateRoom);

// Announcements
router.get('/announcements', chatController.getAnnouncements);
router.post(
  '/announcements',
  upload.single('image'),
  chatController.sendAnnouncement
);

console.log('Chat routes loaded');

module.exports = router;
