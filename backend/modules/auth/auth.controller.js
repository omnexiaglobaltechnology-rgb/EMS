const authService = require('./auth.service');

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'owms_auth_token';
const AUTH_COOKIE_MAX_AGE_MS = Number(
  process.env.AUTH_COOKIE_MAX_AGE_MS || 7 * 24 * 60 * 60 * 1000
);

const buildAuthCookieOptions = () => {
  const secure = process.env.NODE_ENV === 'production';
  const options = {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
    path: '/',
  };

  if (process.env.AUTH_COOKIE_DOMAIN) {
    options.domain = process.env.AUTH_COOKIE_DOMAIN;
  }

  return options;
};

const buildClearCookieOptions = () => {
  const { maxAge, ...clearCookieOptions } = buildAuthCookieOptions();
  return clearCookieOptions;
};

exports.login = async (req, res) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await authService.login(req.body, ipAddress, userAgent);
    if (result.token) {
      res.cookie(AUTH_COOKIE_NAME, result.token, buildAuthCookieOptions());
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
};

exports.adminCreateUser = async (req, res) => {
  try {
    const result = await authService.adminCreateUser(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.adminUpdatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const result = await authService.adminUpdatePassword(id, password);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.adminDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await authService.adminDeleteUser(id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, buildClearCookieOptions());
  return res.status(200).json({ message: 'Logged out successfully' });
};

exports.me = async (req, res) => {
  try {
    const user = await authService.getMe(req.user.id);
    return res.status(200).json(user);
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
};

