jest.mock('../models/Task', () => ({
  findById: jest.fn().mockResolvedValue({ _id: 't1', versionNo: 1 }),
}));

jest.mock('../models/Submission', () => {
  const mockSubmission = { _id: 's1', taskId: 't1', submittedById: 'u2', versionNo: 1, status: 'pending' };

  return {
    create: jest.fn(async (data) => ({ _id: 's1', ...data })),
    findById: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockSubmission),
    }),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([mockSubmission]),
      }),
    }),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
    }),
  };
});

const request = require('supertest');
const app = require('../app');
const { signAccessToken } = require('../utils/jwt');
const Submission = require('../models/Submission');

const authHeader = () =>
  `Bearer ${signAccessToken({
    id: 'u2',
    email: 'manager@owms.com',
    role: 'manager',
  })}`;

describe('Submissions API', () => {
  test('POST /api/submissions creates a submission (no file)', async () => {
    // Override findById for the populate chain that createSubmission uses
    Submission.findById.mockReturnValueOnce({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 's1',
          taskId: 't1',
          submittedById: 'u2',
          versionNo: 1,
        }),
      }),
    });

    const payload = { taskId: 't1', externalLink: 'https://example.com' };
    const res = await request(app)
      .post('/api/submissions')
      .set('Authorization', authHeader())
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body.taskId).toBe(payload.taskId);
  });

  test('GET /api/submissions/task/:taskId returns submissions', async () => {
    const res = await request(app)
      .get('/api/submissions/task/t1')
      .set('Authorization', authHeader());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('PATCH /api/submissions/:id/review updates review status', async () => {
    // Override findByIdAndUpdate to resolve with populated result
    Submission.findByIdAndUpdate.mockReturnValueOnce({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            _id: 's1',
            status: 'approved',
          }),
        }),
      }),
    });

    const res = await request(app)
      .patch('/api/submissions/s1/review')
      .set('Authorization', authHeader())
      .send({ status: 'approved', reviewComment: 'Good' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
  });
});
