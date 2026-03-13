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

exports.setupAdmin = async (req, res) => {
  try {
    const authService = require('./auth.service');
    console.log('[setupAdmin] Starting bootstrap process...');
    
    // Create Admin
    const adminResult = await authService.adminCreateUser({
      email: 'admin@omnexiatechnology.in',
      password: 'admin123',
      name: 'System Admin',
      role: 'admin',
      userType: 'employee'
    }).catch(err => {
      if (err.message === 'Email is already registered') return { message: 'Admin already exists' };
      throw err;
    });

    // Create CEO
    const ceoResult = await authService.adminCreateUser({
      email: 'ceo@omnexiatechnology.in',
      password: 'ceo123',
      name: 'Company CEO',
      role: 'ceo',
      username: 'CEO001',
      userType: 'employee'
    }).catch(err => {
      if (err.message === 'Email is already registered') return { message: 'CEO already exists' };
      throw err;
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
