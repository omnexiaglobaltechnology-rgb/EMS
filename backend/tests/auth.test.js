jest.mock('../models/User', () => {
  const bcrypt = require('bcryptjs');

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
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      async save() {
        this.updatedAt = new Date();
        return this;
      },
    };
  };

  const findOne = jest.fn(async (query = {}) => {
    if (query.email) {
      return users.find((user) => user.email === query.email) || null;
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

  const findByIdAndDelete = jest.fn(async (id) => {
    const idx = users.findIndex((u) => u.id === id || u._id === id);
    if (idx >= 0) return users.splice(idx, 1)[0];
    return null;
  });

  return {
    findOne,
    create,
    findById,
    findByIdAndDelete,
    __reset: () => {
      users.length = 0;
      findOne.mockClear();
      create.mockClear();
      findById.mockClear();
      findByIdAndDelete.mockClear();
    },
    __seedUser: async (data) => {
      const hashedPassword = await bcrypt.hash(data.password || 'password123', 10);
      const user = toUserDocument({ ...data, password: hashedPassword, isEmailVerified: true });
      users.push(user);
      return user;
    },
  };
});

jest.mock('../models/TimeLog', () => ({
  create: jest.fn(async (data) => ({ _id: 'tl1', ...data })),
}));

const request = require('supertest');
const User = require('../models/User');
const app = require('../app');

describe('Auth API', () => {
  beforeEach(() => {
    User.__reset();
  });

  test('rejects login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@owms.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeTruthy();
  });

  test('rejects login with non-owms email domain', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@gmail.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/@owms\.com/i);
  });

  test('allows login with valid credentials and returns token', async () => {
    await User.__seedUser({
      email: 'intern@owms.com',
      name: 'Intern User',
      role: 'intern',
      password: 'password123',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'intern@owms.com', password: 'password123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
    expect(loginRes.body.user.email).toBe('intern@owms.com');
    expect(loginRes.body.user.role).toBe('intern');
  });

  test('GET /api/auth/me returns user info from token', async () => {
    await User.__seedUser({
      email: 'intern@owms.com',
      name: 'Intern User',
      role: 'intern',
      password: 'password123',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'intern@owms.com', password: 'password123' });

    expect(loginRes.status).toBe(200);

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe('intern@owms.com');
  });

  test('GET /api/auth/me rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
