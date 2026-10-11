'use strict';

// Prevent dotenv from loading actual .env during tests
jest.mock('dotenv', () => ({ config: jest.fn() }));

const request = require('supertest');
const { app } = require('./server');

describe('local-dev server', () => {
  describe('GET /health', () => {
    it('returns 200 with healthy: true', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.healthy).toBe(true);
      expect(res.body.db).toBe(true);
    });
  });

  describe('GET /health/live', () => {
    it('returns 200 with status: alive', async () => {
      const res = await request(app).get('/health/live');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('alive');
    });
  });

  describe('GET /dev-login', () => {
    it('returns a JWT token for default persona', async () => {
      const res = await request(app).get('/dev-login');
      expect(res.status).toBe(200);
      expect(typeof res.body.token).toBe('string');
      expect(res.body.token.split('.').length).toBe(3);
    });

    it('returns admin persona when requested', async () => {
      const res = await request(app).get('/dev-login?persona=admin');
      expect(res.status).toBe(200);
      expect(res.body.claims.roles).toContain('planner-admin');
    });
  });

  describe('GET /api/v1/sessions (no auth)', () => {
    it('returns 200 with sessions list when no token provided (dev fallback)', async () => {
      const res = await request(app).get('/api/v1/sessions');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(Array.isArray(res.body.items)).toBe(true);
    });
  });

  describe('POST /api/v1/sessions', () => {
    it('creates a new session and returns 201', async () => {
      const loginRes = await request(app).get('/dev-login?persona=user');
      const { token } = loginRes.body;
      const res = await request(app)
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test Session' });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test Session');
      expect(typeof res.body.id).toBe('string');
    });
  });

  describe('GET /api/v1/patterns', () => {
    it('returns patterns array', async () => {
      const res = await request(app).get('/api/v1/patterns');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items.length).toBeGreaterThan(0);
    });
  });

  describe('GET /info', () => {
    it('returns server info', async () => {
      const res = await request(app).get('/info');
      expect(res.status).toBe(200);
      expect(res.body.name).toBeDefined();
    });
  });
});
