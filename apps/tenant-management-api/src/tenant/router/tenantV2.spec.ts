import express = require('express');
import { It, Mock } from 'moq.ts';
import * as request from 'supertest';
import { TenantEntity } from '../models';
import { TenantRepository } from '../repository';
import { createTenantV2Router } from './tenantV2';

describe('Service Option Router', () => {
  const app = express();
  app.use(
    createTenantV2Router()
  );

  describe('GET /tenants', () => {
    it('returns returns a 401', async () => {
      const res = await request(app).get('/tenants');
      expect(res.statusCode).toBe(401);
    });
  });
});
