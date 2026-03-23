const ROLE_PERMISSIONS = {
  intern: ['task.read', 'task.update', 'task.submit', 'submission.create', 'submission.read', 'submission.read.own'],
  employee: ['task.read', 'task.submit', 'task.delegate', 'submission.create', 'submission.read.own'],
  team_lead: [
    'task.read',
    'task.create',
    'task.update',
    'task.assign',
    'task.delegate',
    'task.review',
    'submission.read',
    'submission.review',
  ],
  team_lead_intern: [
    'task.read',
    'task.create',
    'task.update',
    'task.assign',
    'task.delegate',
    'task.review',
    'submission.read',
    'submission.review',
  ],
  manager_intern: [
    'task.read',
    'task.create',
    'task.update',
    'task.assign',
    'task.delegate',
    'task.review',
    'submission.read',
    'submission.review',
    'analytics.read',
    'reports.read',
  ],
  manager: [
    'task.read',
    'task.create',
    'task.update',
    'task.assign',
    'task.delegate',
    'task.review',
    'task.delete',
    'submission.create',
    'submission.read',
    'submission.review',
    'submission.delete',
  ],
  admin: ['*'],
  cto: ['*'],
  cfo: ['*'],
  coo: ['*'],
  ceo: ['*'],
};

const normalizeRole = (role = '') => String(role).trim().toLowerCase();

const hasPermission = (role, permission) => {
  const normalizedRole = normalizeRole(role);
  const permissions = ROLE_PERMISSIONS[normalizedRole] || [];
  return permissions.includes('*') || permissions.includes(permission);
};

module.exports = { ROLE_PERMISSIONS, normalizeRole, hasPermission };
