const request = require('supertest');
const app = require('../app');

// Mocking models to avoid DB connection and isolate logic
jest.mock('../models/User', () => {
    const users = [
        { _id: 'ceo1', id: 'ceo1', name: 'CEO User', role: 'ceo', email: 'ceo@o.in', reportsTo: null },
        { _id: 'manager1', id: 'manager1', name: 'Manager 1', role: 'manager', reportsTo: 'ceo1', email: 'm1@o.in' },
        { _id: 'ee1', id: 'ee1', name: 'Employee 1', role: 'employee', reportsTo: 'manager1', email: 'ee1@o.in' },
        { _id: 'ee2', id: 'ee2', name: 'Employee 2', role: 'employee', reportsTo: 'manager1', email: 'ee2@o.in' },
        { _id: 'ee3', id: 'ee3', name: 'Employee 3', role: 'employee', reportsTo: 'ceo1', email: 'ee3@o.in' },
    ];
    
    // Help identify user by ID for population
    const getUser = (id) => users.find(u => u._id === id);

    return {
        find: jest.fn((filter) => {
            let result = [...users];
            if (filter.reportsTo) result = result.filter(u => u.reportsTo === filter.reportsTo);
            
            // Simulate population for the test expectations
            const populated = result.map(u => ({
                ...u,
                reportsTo: u.reportsTo ? getUser(u.reportsTo) : null
            }));

            return {
                select: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockReturnValue(populated),
            };
        }),
        findOne: jest.fn((query) => {
            if (query.role === 'ceo') return users.find(u => u.role === 'ceo');
            return users.find(u => u.email === query.email || u._id === query._id);
        }),
        exists: jest.fn((query) => {
            return users.some(u => u.reportsTo === query.reportsTo);
        }),
        findById: jest.fn((id) => {
            const user = users.find(u => u._id === id);
            if (!user) return null;
            return {
                ...user,
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockReturnValue(user),
            };
        }),
        updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    };
});

// Mock db.js to avoid MONGODB_URL error
jest.mock('../config/db', () => ({
  connectDB: jest.fn().mockResolvedValue({}),
  mongoose: { connection: { readyState: 1 } }
}));

// Mock JWT utility to bypass token verification
jest.mock('../utils/jwt', () => ({
    verifyAccessToken: jest.fn((token) => {
        if (token === 'ceo-token') return { id: 'ceo1', email: 'ceo@o.in', role: 'ceo' };
        if (token === 'manager-token') return { id: 'manager1', email: 'm1@o.in', role: 'manager' };
        return null;
    }),
    extractBearerToken: jest.fn(h => h ? h.split(' ')[1] : null),
    extractCookieToken: jest.fn(() => null),
    signAccessToken: jest.fn(() => 'mock-token'),
}));

describe('Supervisor Visibility Tests', () => {
    test('CEO should see all employees', async () => {
        const res = await request(app)
            .get('/api/auth/users')
            .set('Authorization', 'Bearer ceo-token');
        
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(5);
    });

    test('Manager should only see their direct reports', async () => {
        const res = await request(app)
            .get('/api/auth/users')
            .set('Authorization', 'Bearer manager-token');
        
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        expect(res.body.every(u => u.reportsTo.id === 'manager1')).toBe(true);
    });

    test('isSupervisor flag should be true for CEO', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer ceo-token');
        
        expect(res.status).toBe(200);
        expect(res.body.isSupervisor).toBe(true);
    });

    test('isSupervisor flag should be true for Manager with reports', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer manager-token');
        
        expect(res.status).toBe(200);
        expect(res.body.isSupervisor).toBe(true);
    });
});
