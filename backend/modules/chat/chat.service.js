const ChatRoom = require('../../models/ChatRoom');
const Message = require('../../models/Message');
const User = require('../../models/User');
const Department = require('../../models/Department');

const C_LEVEL_ROLES = ['cto', 'cfo', 'coo'];
const CEO_ROLE = 'ceo';

/**
 * Determine which department a C-level maps to (by convention).
 * CTO→Technical, CFO→Finance, COO→Operations
 */
const getCLevelDepartmentName = (role) => {
  const map = { cto: 'Technical', cfo: 'Finance', coo: 'Operations' };
  return map[role] || null;
};

/**
 * Get all chat rooms visible to the current user based on hierarchy.
 */
const getRoomsForUser = async (user) => {
  let rooms;

  if (user.role === CEO_ROLE) {
    // CEO sees all rooms
    rooms = await ChatRoom.find()
      .populate('departmentId', 'name type')
      .populate('teamLeadId', 'name username')
      .populate('managerId', 'name username')
      .sort({ name: 1 });
  } else if (C_LEVEL_ROLES.includes(user.role)) {
    // C-level sees all rooms in their department
    const deptName = getCLevelDepartmentName(user.role);
    const departments = deptName
      ? await Department.find({ name: { $regex: new RegExp(deptName, 'i') } })
      : [];
    const deptIds = departments.map((d) => d._id);

    rooms = await ChatRoom.find({ departmentId: { $in: deptIds } })
      .populate('departmentId', 'name type')
      .populate('teamLeadId', 'name username')
      .populate('managerId', 'name username')
      .sort({ name: 1 });
  } else if (['manager', 'manager_intern'].includes(user.role)) {
    // Manager sees rooms where they are the manager or participant
    rooms = await ChatRoom.find({
      $or: [
        { managerId: user.id },
        { participants: user.id },
      ],
    })
      .populate('departmentId', 'name type')
      .populate('teamLeadId', 'name username')
      .populate('managerId', 'name username')
      .sort({ name: 1 });
  } else if (['team_lead', 'team_lead_intern'].includes(user.role)) {
    // TL sees rooms where they are the TL or participant
    rooms = await ChatRoom.find({
      $or: [
        { teamLeadId: user.id },
        { participants: user.id },
      ],
    })
      .populate('departmentId', 'name type')
      .populate('teamLeadId', 'name username')
      .populate('managerId', 'name username')
      .sort({ name: 1 });
  } else {
    // Employees/Interns only see rooms they are participants in
    rooms = await ChatRoom.find({ participants: user.id })
      .populate('departmentId', 'name type')
      .populate('teamLeadId', 'name username')
      .populate('managerId', 'name username')
      .sort({ name: 1 });
  }

  return rooms;
};

/**
 * Get messages for a chat room (paginated).
 */
const getMessages = async (chatRoomId, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  const messages = await Message.find({ chatRoomId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('senderId', 'name username role');

  return messages.reverse();
};

/**
 * Send a message to a chat room.
 */
const sendMessage = async (chatRoomId, senderId, data) => {
  const room = await ChatRoom.findById(chatRoomId);
  if (!room) throw new Error('Chat room not found');

  const sender = await User.findById(senderId).select('name role');
  if (!sender) throw new Error('Sender not found');

  const message = await Message.create({
    chatRoomId,
    senderId,
    senderName: sender.name || sender.email,
    senderRole: sender.role,
    content: data.content || '',
    imageUrl: data.imageUrl || null,
    type: data.type || 'text',
  });

  return message;
};

/**
 * Send an announcement. Flows up and down the hierarchy.
 * - TL announces → goes to their employees + their manager
 * - Manager announces → goes to their TLs, employees, and one level up
 */
const sendAnnouncement = async (senderId, data) => {
  const sender = await User.findById(senderId).populate('departmentId');
  if (!sender) throw new Error('Sender not found');
  if (!sender.departmentId) throw new Error('Sender has no department');

  const { content, imageUrl } = data;

  // Find the announcement room for this department
  let announcementRoom = await ChatRoom.findOne({
    departmentId: sender.departmentId._id || sender.departmentId,
    type: 'announcement',
  });

  if (!announcementRoom) {
    // Create one if it doesn't exist
    announcementRoom = await ChatRoom.create({
      name: `Announcements - ${sender.departmentId.name || 'Department'}`,
      type: 'announcement',
      departmentId: sender.departmentId._id || sender.departmentId,
      createdBy: senderId,
    });
  }

  const message = await Message.create({
    chatRoomId: announcementRoom._id,
    senderId,
    senderName: sender.name,
    senderRole: sender.role,
    content,
    imageUrl: imageUrl || null,
    type: 'announcement',
  });

  return message;
};

/**
 * Get announcements visible to the current user.
 */
const getAnnouncements = async (user) => {
  let departmentIds = [];

  if (user.role === CEO_ROLE) {
    // CEO sees all announcements
    const allDepts = await Department.find();
    departmentIds = allDepts.map((d) => d._id);
  } else if (C_LEVEL_ROLES.includes(user.role)) {
    const deptName = getCLevelDepartmentName(user.role);
    const departments = deptName
      ? await Department.find({ name: { $regex: new RegExp(deptName, 'i') } })
      : [];
    departmentIds = departments.map((d) => d._id);
  } else if (user.departmentId) {
    departmentIds = [user.departmentId];
  }

  const rooms = await ChatRoom.find({
    departmentId: { $in: departmentIds },
    type: 'announcement',
  });

  const roomIds = rooms.map((r) => r._id);

  const messages = await Message.find({
    chatRoomId: { $in: roomIds },
    type: 'announcement',
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('senderId', 'name username role');

  return messages;
};

/**
 * Rename a chat room (manager+ only).
 */
const renameRoom = async (roomId, newName) => {
  const room = await ChatRoom.findById(roomId);
  if (!room) throw new Error('Chat room not found');

  room.customName = newName;
  room.name = newName;
  await room.save();

  return room;
};

/**
 * Auto-create a tech support chat room when a TL is assigned to a team.
 */
const autoCreateTeamRoom = async (teamLeadId, managerId, departmentId) => {
  const tl = await User.findById(teamLeadId);
  const dept = await Department.findById(departmentId);

  const roomName = `Tech Support - ${tl?.name || 'Team'}`;

  // Check if room already exists
  const existing = await ChatRoom.findOne({ teamLeadId, type: 'tech_support' });
  if (existing) return existing;

  // Get all employees under this TL
  const employees = await User.find({ reportsTo: teamLeadId });
  const participantIds = [teamLeadId, ...employees.map((e) => e._id)];
  if (managerId) participantIds.push(managerId);

  const room = await ChatRoom.create({
    name: roomName,
    type: 'tech_support',
    departmentId,
    teamLeadId,
    managerId,
    participants: participantIds,
    createdBy: teamLeadId,
  });

  return room;
};

/**
 * Handle admin-created chat rooms with email-based participants.
 */
const createAdminRoom = async (payload, creatorId) => {
  const { name, type, departmentId, emails = [] } = payload;

  // Resolve emails to user IDs
  const users = await User.find({ email: { $in: emails } }).select('_id email');
  const participantIds = users.map((u) => u._id);

  // Always include the creator if not already there
  if (!participantIds.some(id => id.toString() === creatorId.toString())) {
    participantIds.push(creatorId);
  }

  const room = await ChatRoom.create({
    name,
    type,
    departmentId,
    participants: participantIds,
    createdBy: creatorId,
  });

  return room;
};
module.exports = {
  getRoomsForUser,
  getMessages,
  sendMessage,
  sendAnnouncement,
  getAnnouncements,
  renameRoom,
  autoCreateTeamRoom,
  createAdminRoom,
};
