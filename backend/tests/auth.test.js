const request = require('supertest');

jest.mock('../models/User', () => {
  const users = [];

  const toUserDocument = (data) => {
    const now = new Date();
    const id = data.id || `u${users.length + 1}`;

    return {
      _id: id,
      id,
      email: data.email,
      name: data.name || null,
      role: data.role || 'intern',
      password: data.password,
      authProvider: data.authProvider || 'local',
      isEmailVerified: Boolean(data.isEmailVerified),
      emailVerificationTokenHash: data.emailVerificationTokenHash || null,
      emailVerificationExpiresAt: data.emailVerificationExpiresAt || null,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      async save() {
        this.updatedAt = new Date();
        return this;
      }
    };
  };

  const findOne = jest.fn(async (query = {}) => {
    if (query.email) {
      return users.find((user) => user.email === query.email) || null;
    }

    if (query.emailVerificationTokenHash) {
      const minDate = query.emailVerificationExpiresAt?.$gt;
      return (
        users.find((user) => {
          const isTokenMatch = user.emailVerificationTokenHash === query.emailVerificationTokenHash;
          const isNotExpired = !minDate || (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt > minDate);
          return isTokenMatch && isNotExpired;
        }) || null
      );
    }

    return null;
  });

  const create = jest.fn(async (data) => {
    const user = toUserDocument(data);
    users.push(user);
    return user;
  });

  const findById = jest.fn(async (id) => {
    return users.find((user) => user.id === id || user._id === id) || null;
  });

  return {
    findOne,
    create,
    findById,
    __reset: () => {
      users.length = 0;
      findOne.mockClear();
      create.mockClear();
      findById.mockClear();
    }
  };
});

const User = require('../models/User');
const app = require('../app');

describe('Auth API', () => {
  beforeEach(() => {
    User.__reset();
  });

  test('rejects non-owms email domain during registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user@gmail.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'intern',
        name: 'Test User'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/@owms\.com/i);
  });

  test('rejects registration when password and confirm password do not match', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'intern@owms.com',
        password: 'password123',
        confirmPassword: 'password321',
        role: 'intern',
        name: 'Test User'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/do not match/i);
  });

  test('blocks login before verification and allows login after verify-email', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'intern@owms.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'intern',
        name: 'Intern User'
      });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.requiresEmailVerification).toBe(true);
    expect(registerRes.body.verificationToken).toBeTruthy();

    const preVerifyLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'intern@owms.com', password: 'password123' });

    expect(preVerifyLoginRes.status).toBe(401);
    expect(preVerifyLoginRes.body.error).toMatch(/not verified/i);

    const verifyRes = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: registerRes.body.verificationToken });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.user.isEmailVerified).toBe(true);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'intern@owms.com', password: 'password123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.email).toBe('intern@owms.com');
    expect(loginRes.headers['set-cookie']).toBeDefined();
    expect(loginRes.headers['set-cookie'].join(';')).toMatch(/owms_auth_token=/);

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', loginRes.headers['set-cookie']);

    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe('intern@owms.com');
  });
});
