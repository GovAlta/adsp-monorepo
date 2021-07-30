import express = require('express');
import * as request from 'supertest';
import { createTenantV2Router } from './tenantV2';

describe('Service Option Router', () => {
  const app = express();
  app.use(createTenantV2Router());

  describe('GET /tenants', () => {
    it('returns returns a 401', async () => {
      const res = await request(app).get('/tenants');
      expect(res.statusCode).toBe(401);
    });
  });
});
