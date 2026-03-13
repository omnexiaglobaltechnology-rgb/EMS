const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true,
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  senderRole: {
    type: String,
  },
  content: {
    type: String,
    default: '',
  },
  imageUrl: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    enum: ['text', 'image', 'announcement'],
    default: 'text',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL index: auto-delete messages after 30 days
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Message', messageSchema);
