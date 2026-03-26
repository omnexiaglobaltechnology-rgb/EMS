const User = require('../../models/User');

/**
 * GET /api/auth/users?role=intern&departmentId=xxx&reportsTo=xxx&userType=employee&search=xxx
 * Returns users filtered by various criteria. Authenticated endpoint.
 */
exports.getUsers = async (req, res) => {
  try {
    const { role, departmentId, reportsTo, userType, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (departmentId && role !== 'ceo') filter.departmentId = departmentId;
    if (reportsTo) filter.reportsTo = reportsTo;
    
    // Support searching for users with null userType or specific userType
    if (userType) {
      filter.$or = [
        { userType: userType },
        { userType: { $exists: false } } // Fallback for old users until migration is run
      ];
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('_id name email username role userType departmentId reportsTo managerId teamLeadId')
      .populate('departmentId', 'name type')
      .populate('reportsTo', 'name email username role')
      .populate('managerId', 'name email username role')
      .populate('teamLeadId', 'name email username role')
      .lean();

    const mapped = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      username: u.username || null,
      role: u.role,
      userType: u.userType || (u.role === 'intern' ? 'intern' : 'employee'),
      department: u.departmentId
        ? { id: u.departmentId._id.toString(), name: u.departmentId.name, type: u.departmentId.type }
        : null,
      reportsTo: u.reportsTo
        ? { id: u.reportsTo._id.toString(), name: u.reportsTo.name, role: u.reportsTo.role }
        : null,
      manager: u.managerId
        ? { id: u.managerId._id.toString(), name: u.managerId.name, role: u.managerId.role }
        : null,
      teamLead: u.teamLeadId
        ? { id: u.teamLeadId._id.toString(), name: u.teamLeadId.name, role: u.teamLeadId.role }
        : null,
    }));

    return res.json(mapped);
  } catch (error) {
    console.error('[getUsers] ERROR:', error.message);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('_id name email username role userType departmentId')
      .populate('departmentId', 'name type')
      .lean();

    if (!user) return res.status(404).json({ error: 'User not found' });

    const mapped = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      username: user.username || null,
      role: user.role,
      userType: user.userType || (user.role === 'intern' ? 'intern' : 'employee'),
      department: user.departmentId
        ? { id: user.departmentId._id.toString(), name: user.departmentId.name, type: user.departmentId.type }
        : null,
    };

    return res.json(mapped);
  } catch (error) {
    console.error('[getUserById] ERROR:', error.message);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
};

exports.setupAdmin = async (req, res) => {
  try {
    const authService = require('./auth.service');
    console.log('[setupAdmin] Starting bootstrap process...');
    
    // Helper to create or reset user
    const ensureUser = async (email, data) => {
      const existing = await User.findOne({ email });
      if (existing) {
        await authService.adminUpdatePassword(existing._id, data.password);
        return { message: `${data.role} password reset successfully` };
      }
      return authService.adminCreateUser(data);
    };

    // Create/Reset Admin
    const adminResult = await ensureUser('admin@omnexiatechnology.in', {
      email: 'admin@omnexiatechnology.in',
      password: 'AdminPassword123',
      name: 'System Admin',
      role: 'admin',
      userType: 'employee'
    });

    // Create/Reset CEO
    const ceoResult = await ensureUser('ceo@omnexiatechnology.in', {
      email: 'ceo@omnexiatechnology.in',
      password: 'CeoPassword123',
      name: 'Company CEO',
      role: 'ceo',
      username: 'CEO001',
      userType: 'employee'
    });

    console.log('[setupAdmin] Results:', { admin: adminResult.message, ceo: ceoResult.message });
    
    return res.status(201).json({
      success: true,
      message: 'System bootstrap completed',
      results: {
        admin: adminResult.message,
        ceo: ceoResult.message
      }
    });
  } catch (error) {
    console.error('[setupAdmin] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Migration/Fix: Set userType for all users who don't have it.
 */
exports.fixUserData = async (req, res) => {
  try {
    const result = await User.updateMany(
      {},
      {
        $set: {
          userType: { $ifNull: ["$userType", "employee"] },
          departmentId: { $ifNull: ["$departmentId", null] },
          managerId: { $ifNull: ["$managerId", null] },
          teamLeadId: { $ifNull: ["$teamLeadId", null] },
          reportsTo: { $ifNull: ["$reportsTo", null] }
        }
      }
    );

    return res.json({
      success: true,
      message: `Updated documents with default fields if missing`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Allows users to update their personal email for meeting notifications.
 */
exports.updateProfile = async (req, res) => {
  try {
    const { personalEmail } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (personalEmail !== undefined) {
      user.personalEmail = personalEmail;
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      personalEmail: user.personalEmail
    });
  } catch (error) {
    console.error('[updateProfile] ERROR:', error.message);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};
