const chatService = require('./chat.service');

const getRooms = async (req, res, next) => {
  try {
    const rooms = await chatService.getRoomsForUser(req.user);
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const messages = await chatService.getMessages(req.params.id, page, limit);
    res.json(messages);
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const message = await chatService.sendMessage(
      req.params.id,
      req.user.id,
      {
        content: req.body.content,
        imageUrl: req.file
          ? `/uploads/chat/${req.file.filename}`
          : req.body.imageUrl || null,
        type: req.file ? 'image' : req.body.type || 'text',
      }
    );
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};

const sendAnnouncement = async (req, res, next) => {
  try {
    const message = await chatService.sendAnnouncement(req.user.id, {
      content: req.body.content,
      imageUrl: req.file
        ? `/uploads/chat/${req.file.filename}`
        : req.body.imageUrl || null,
    });
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};

const getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await chatService.getAnnouncements(req.user);
    res.json(announcements);
  } catch (err) {
    next(err);
  }
};

const renameRoom = async (req, res, next) => {
  try {
    const room = await chatService.renameRoom(req.params.id, req.body.name);
    res.json(room);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRooms,
  getMessages,
  sendMessage,
  sendAnnouncement,
  getAnnouncements,
  renameRoom,
};
