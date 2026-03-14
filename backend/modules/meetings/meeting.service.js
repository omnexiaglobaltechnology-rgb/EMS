const Meeting = require('../../models/Meeting');
const User = require('../../models/User');
const Department = require('../../models/Department');

const CEO_ROLE = 'ceo';
const C_LEVEL_ROLES = ['cto', 'cfo', 'coo'];

/**
 * Generate a unique 10-character meeting code (abc-defg-hij)
 */
const generateMeetingCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const getPart = (len) => Array.from({ length: len }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `${getPart(3)}-${getPart(4)}-${getPart(3)}`;
};

/**
 * Create a new meeting with invitee list.
 */
const createMeeting = async (creatorId, data) => {
  const {
    title,
    description,
    date,
    time,
    duration,
    platform,
    link,
    topic,
    departmentId,
    invitees,
  } = data;

  if (!title || !date || !time) {
    throw new Error('Title, date, and time are required');
  }

  const creator = await User.findById(creatorId);
  const meetingConfigService = require('./meetingConfig.service');
  const canCreate = await meetingConfigService.checkCreationPermission(creator.role);
  if (!canCreate) {
    throw new Error('You do not have permission to schedule meetings');
  }

  if (!link && platform === 'EMS Meet') {
    data.link = generateMeetingCode();
  }

  const meeting = await Meeting.create({
    title,
    description: description || '',
    date,
    time,
    duration: duration || '30 min',
    platform: platform || 'EMS Meet',
    link: data.link || '',
    topic: topic || '',
    creatorId,
    departmentId: departmentId || creator.departmentId || null,
    invitees: invitees || [],
    status: 'scheduled',
  });

  const populatedMeeting = await meeting.populate([
    { path: 'creatorId', select: 'name email username role' },
    { path: 'departmentId', select: 'name type' },
    { path: 'invitees', select: 'name email username role personalEmail' },
  ]);

  // Trigger Email Notifications
  if (populatedMeeting.invitees && populatedMeeting.invitees.length > 0) {
    const emailService = require('../../utils/emailService');
    emailService.sendBulkMeetingNotifications(
      populatedMeeting.invitees,
      {
        title: populatedMeeting.title,
        date: populatedMeeting.date,
        time: populatedMeeting.time,
        link: populatedMeeting.link,
        platform: populatedMeeting.platform,
        description: populatedMeeting.description
      },
      populatedMeeting.creatorId
    ).catch(err => console.error('[MeetingService] Bulk email error:', err.message));
  }

  return populatedMeeting;
};

/**
 * Get all meetings for a user (created by them or invited to).
 * CEO sees all meetings.
 */
const getMeetings = async (user) => {
  let query;

  if (user.role === CEO_ROLE) {
    // CEO sees all meetings
    query = {};
  } else if (C_LEVEL_ROLES.includes(user.role)) {
    // C-level sees meetings in their department + they created + invited to
    const departments = user.departmentId
      ? await Department.find({
          _id: user.departmentId,
        })
      : [];
    const deptIds = departments.map((d) => d._id);

    query = {
      $or: [
        { creatorId: user.id },
        { invitees: user.id },
        { departmentId: { $in: deptIds } },
      ],
    };
  } else {
    // Everyone else sees meetings they created or are invited to
    query = {
      $or: [{ creatorId: user.id }, { invitees: user.id }],
    };
  }

  const meetings = await Meeting.find(query)
    .populate('creatorId', 'name email username role')
    .populate('departmentId', 'name type')
    .populate('invitees', 'name email username role')
    .sort({ date: -1 });

  return meetings;
};

/**
 * Get a single meeting by ID.
 */
const getMeetingById = async (idOrCode) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrCode);
  const query = isObjectId ? { _id: idOrCode } : { link: idOrCode };

  const meeting = await Meeting.findOne(query)
    .populate('creatorId', 'name email username role')
    .populate('departmentId', 'name type')
    .populate('invitees', 'name email username role');

  if (!meeting) throw new Error('Meeting not found');
  return meeting;
};

/**
 * Update a meeting.
 */
const updateMeeting = async (id, data, userId) => {
  const meeting = await Meeting.findById(id);
  if (!meeting) throw new Error('Meeting not found');

  // Only creator or CEO can update
  if (
    meeting.creatorId.toString() !== userId.toString()
  ) {
    const user = await User.findById(userId);
    if (user.role !== CEO_ROLE) {
      throw new Error('Only the meeting creator or CEO can update');
    }
  }

  const allowedFields = [
    'title', 'description', 'date', 'time', 'duration',
    'platform', 'link', 'topic', 'status',
  ];
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) meeting[field] = data[field];
  });

  await meeting.save();
  return meeting.populate([
    { path: 'creatorId', select: 'name email username role' },
    { path: 'departmentId', select: 'name type' },
    { path: 'invitees', select: 'name email username role' },
  ]);
};

/**
 * Delete/cancel a meeting.
 */
const deleteMeeting = async (id, userId) => {
  const meeting = await Meeting.findById(id);
  if (!meeting) throw new Error('Meeting not found');

  if (meeting.creatorId.toString() !== userId.toString()) {
    const user = await User.findById(userId);
    if (user.role !== CEO_ROLE) {
      throw new Error('Only the meeting creator or CEO can delete');
    }
  }

  await Meeting.findByIdAndDelete(id);
  return { message: 'Meeting deleted successfully' };
};

/**
 * Update invitees list for a meeting.
 */
const updateInvitees = async (id, invitees, userId) => {
  const meeting = await Meeting.findById(id);
  if (!meeting) throw new Error('Meeting not found');

  if (meeting.creatorId.toString() !== userId.toString()) {
    const user = await User.findById(userId);
    if (user.role !== CEO_ROLE) {
      throw new Error('Only the meeting creator or CEO can manage invitees');
    }
  }

  meeting.invitees = invitees;
  await meeting.save();

  return meeting.populate([
    { path: 'creatorId', select: 'name email username role' },
    { path: 'invitees', select: 'name email username role' },
  ]);
};

/**
 * Search users for meeting invitations.
 * Supports filtering by department, role, and search text (username/name).
 * Enforces department restrictions for TLs and Managers.
 */
const searchInvitees = async (requestingUser, filters = {}) => {
  const query = {};

  // Hierarchy/Permission enforcement
  if (['team_lead', 'team_lead_intern', 'manager', 'manager_intern'].includes(requestingUser.role)) {
    const meetingConfigService = require('./meetingConfig.service');
    const canInviteAcross = await meetingConfigService.checkInvitePermission(requestingUser.role);
    
    if (!canInviteAcross) {
      // Strictly restrict to user's own department
      if (!requestingUser.departmentId) {
        throw new Error('User must belong to a department to search for invitees');
      }
      query.departmentId = requestingUser.departmentId;
    } else if (filters.departmentId) {
      query.departmentId = filters.departmentId;
    }
  } else if (filters.departmentId) {
    query.departmentId = filters.departmentId;
  }

  if (filters.role) query.role = filters.role;
  if (filters.reportsTo) query.reportsTo = filters.reportsTo;
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { username: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
    ];
  }

  const users = await User.find(query)
    .select('name email username role departmentId reportsTo')
    .populate('departmentId', 'name type')
    .sort({ name: 1 })
    .limit(50);

  return users;
};

module.exports = {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  updateInvitees,
  searchInvitees,
};
