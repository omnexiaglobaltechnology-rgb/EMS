jest.mock('../models/Task', () => ({
  create: jest.fn(async (data) => ({ _id: 't1', ...data })),
  find: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([{ _id: 't1', title: 'Test Task' }])
    })
  }),
  findById: jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue({ _id: 't1', versionNo: 1, title: 'Test Task', description: 'd', dueDate: new Date() })
  }),
  findByIdAndUpdate: jest.fn(async (id, data) => ({ _id: id, ...data }))
}));

jest.mock('../models/TaskVersion', () => ({
  create: jest.fn(async () => ({ _id: 'v1' }))
}));

const request = require('supertest');
const app = require('../app');
const { signAccessToken } = require('../utils/jwt');

const authHeader = () =>
  `Bearer ${signAccessToken({ id: 'u2', email: 'lead@owms.com', role: 'team_lead' })}`;

describe('Tasks API', () => {
  test('POST /api/tasks creates a task', async () => {
    const payload = {
      title: 'Test Task',
      description: 'd',
      departmentId: 'dep1',
      assignedToId: 'u1',
      priority: 'low',
      dueDate: new Date().toISOString()
    };
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', authHeader())
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body.title).toBe(payload.title);
  });

  test('GET /api/tasks returns list', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', authHeader());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('PATCH /api/tasks/:id updates a task', async () => {
    const res = await request(app)
      .patch('/api/tasks/t1')
      .set('Authorization', authHeader())
      .send({ title: 'Updated Title' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Title');
  });
});

