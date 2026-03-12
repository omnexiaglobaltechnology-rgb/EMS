const { hasPermission, normalizeRole } = require('../config/permissions');

const authorizeRoles = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map(normalizeRole);

  return (req, res, next) => {
    const role = normalizeRole(req.user?.role);
    if (!role) return res.status(403).json({ error: 'Access denied' });

    if (!normalizedAllowed.includes(role)) {
      return res.status(403).json({ error: 'Insufficient role permissions' });
    }

    return next();
  };
};

const authorizePermission = (permission) => {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !hasPermission(role, permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    return next();
  };
};

module.exports = { authorizeRoles, authorizePermission };
