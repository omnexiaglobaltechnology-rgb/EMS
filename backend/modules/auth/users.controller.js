const User = require('../../models/User');

/**
 * GET /api/users?role=intern
 * Returns users filtered by role (optional). Authenticated endpoint.
 */
exports.getUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const filter = role ? { role } : {};
        const users = await User.find(filter).select('_id name email role').lean();
        const mapped = users.map((u) => ({
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            role: u.role,
        }));
        return res.json(mapped);
    } catch (error) {
        console.error('[getUsers] ERROR:', error.message);
        return res.status(500).json({ error: 'Failed to fetch users' });
    }
};
