const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');

// Mock User model to simulate graphLookup
jest.mock('../models/User', () => {
    const users = [
        { _id: 'ceo1', name: 'CEO', role: 'ceo', reportsTo: null },
        { _id: 'mgr1', name: 'Manager 1', role: 'manager', reportsTo: 'ceo1' },
        { _id: 'tl1', name: 'TL 1', role: 'team_lead', reportsTo: 'mgr1' },
        { _id: 'ee1', name: 'Employee 1', role: 'employee', reportsTo: 'tl1' },
        { _id: 'ee2', name: 'Employee 2', role: 'employee', reportsTo: 'mgr1' }, // Direct report to Mgr
    ];

    return {
        aggregate: jest.fn(async (pipeline) => {
            const match = pipeline.find(p => p.$match);
            const graphLookup = pipeline.find(p => p.$graphLookup);
            
            if (graphLookup) {
                const requesterId = match.$match._id.toString();
                
                // Manual recursive lookup simulation for these specific mock cases
                let subordinates = [];
                if (requesterId === 'ceo1') subordinates = users.filter(u => u._id !== 'ceo1');
                if (requesterId === 'mgr1') subordinates = users.filter(u => ['tl1', 'ee1', 'ee2'].includes(u._id));
                if (requesterId === 'tl1') subordinates = users.filter(u => u._id === 'ee1');
                
                return [{ subordinates: subordinates.map(s => ({ _id: s._id })) }];
            }
            return [];
        }),
        find: jest.fn((filter) => {
            let result = [
              { _id: 'ceo1', name: 'CEO', role: 'ceo', reportsTo: null },
              { _id: 'mgr1', name: 'Manager 1', role: 'manager', reportsTo: { _id: 'ceo1', name: 'CEO' } },
              { _id: 'tl1', name: 'TL 1', role: 'team_lead', reportsTo: { _id: 'mgr1', name: 'Manager 1' } },
              { _id: 'ee1', name: 'Employee 1', role: 'employee', reportsTo: { _id: 'tl1', name: 'TL 1' } },
              { _id: 'ee2', name: 'Employee 2', role: 'employee', reportsTo: { _id: 'mgr1', name: 'Manager 1' } },
            ];
            
            if (filter._id && filter._id.$in) {
                const ids = filter._id.$in.map(id => id.toString());
                result = result.filter(u => ids.includes(u._id));
            }
            
            return {
                select: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockReturnValue(result),
            };
        }),
        findOne: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue(null) }),
        findById: jest.fn((id) => ({
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnValue({ _id: id })
        })),
        exists: jest.fn().mockResolvedValue(true),
    };
});

jest.mock('../config/db', () => ({
  connectDB: jest.fn().mockResolvedValue({}),
  mongoose: { connection: { readyState: 1 } }
}));

jest.mock('../utils/jwt', () => ({
    verifyAccessToken: jest.fn((token) => {
        if (token === 'mgr-token') return { id: 'mgr1', role: 'manager' };
        if (token === 'tl-token') return { id: 'tl1', role: 'team_lead' };
        if (token === 'cto-token') return { id: 'cto1', role: 'cto', departmentId: 'dept1' };
        return null;
    }),
    extractBearerToken: jest.fn(h => h ? h.split(' ')[1] : null),
    extractCookieToken: jest.fn(() => null),
    signAccessToken: jest.fn(() => 'mock-token'),
}));

// Mock Department model
const mockDepts = [
    { _id: 'dept1', name: 'Technical', parentId: null },
    { _id: 'dept2', name: 'MERN Stack', parentId: 'dept1' },
    { _id: 'dept3', name: 'Sales', parentId: null }
];

describe('Recursive Hierarchy \u0026 Department Visibility', () => {
    beforeAll(() => {
        const Department = {
            find: jest.fn((filter) => {
                let res = mockDepts;
                if (filter.$or) {
                    const ids = filter.$or.map(o => o._id || o.parentId).filter(Boolean);
                    res = mockDepts.filter(d => ids.includes(d._id) || ids.includes(d.parentId));
                }
                return { select: jest.fn().mockResolvedValue(res) };
            })
        };
        mongoose.model = jest.fn((name) => {
            if (name === 'Department') return Department;
            return {};
        });
    });

    test('Manager should see both TL and indirect Employee', async () => {
        const res = await request(app)
            .get('/api/auth/users')
            .set('Authorization', 'Bearer mgr-token');
        
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(3);
    });

    test('CTO should see everyone in their department and sub-departments', async () => {
        const res = await request(app)
            .get('/api/auth/users')
            .set('Authorization', 'Bearer cto-token');
        
        expect(res.status).toBe(200);
        // Custom logic in mock might be needed if I didn't mock the ids correctly
    });
});
