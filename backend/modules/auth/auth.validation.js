const ROLE_SET = new Set([
  'intern',
  'team_lead',
  'team_lead_intern',
  'manager',
  'manager_intern',
  'admin',
  'cto',
  'cfo',
  'coo',
  'ceo',
]);

const ALLOWED_EMAIL_DOMAIN = (
  process.env.ALLOWED_EMAIL_DOMAIN || 'omnexiatechnology.in'
).toLowerCase();

const normalizeRole = (role = '') => String(role).trim().toLowerCase();

const validateEmail = (email = '') => {
  const trimmed = String(email).trim().toLowerCase();
  const parts = trimmed.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1] || !parts[1].includes('.')) {
    throw new Error('Valid email is required');
  }

  const [, domain = ''] = trimmed.split('@');
  if (domain !== ALLOWED_EMAIL_DOMAIN) {
    throw new Error(`Only @${ALLOWED_EMAIL_DOMAIN} email addresses are allowed`);
  }

  return trimmed;
};

const validatePassword = (password = '') => {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasLetter || !hasNumber) {
    throw new Error('Password must include at least one letter and one number');
  }

  return password;
};

const validatePasswordConfirmation = (password, confirmPassword = '') => {
  if (typeof confirmPassword !== 'string' || !confirmPassword.length) {
    throw new Error('Password confirmation is required');
  }

  if (password !== confirmPassword) {
    throw new Error('Password and confirm password do not match');
  }
};

const validateRole = (role) => {
  if (!role) return 'intern';
  const normalized = normalizeRole(role);
  if (!ROLE_SET.has(normalized)) {
    throw new Error(
      `Invalid role. Allowed roles: ${Array.from(ROLE_SET).join(', ')}`
    );
  }
  return normalized;
};

const validateRegisterInput = ({ email, password, confirmPassword, name, role }) => {
  const validatedEmail = validateEmail(email);
  const validatedPassword = validatePassword(password);
  validatePasswordConfirmation(validatedPassword, confirmPassword);
  const validatedRole = validateRole(role);

  return {
    email: validatedEmail,
    password: validatedPassword,
    name: name ? String(name).trim() : null,
    role: validatedRole,
  };
};

const validateLoginInput = ({ email, password }) => {
  if (!password) throw new Error('Password is required');
  return {
    email: validateEmail(email),
    password: String(password).trim(),
  };
};

const validateVerificationToken = (token = '') => {
  const normalizedToken = String(token).trim();
  if (!normalizedToken || normalizedToken.length < 32) {
    throw new Error('Valid verification token is required');
  }
  return normalizedToken;
};

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  validateVerificationToken,
  validateRole,
  normalizeRole,
  ROLE_SET,
  ALLOWED_EMAIL_DOMAIN,
};
