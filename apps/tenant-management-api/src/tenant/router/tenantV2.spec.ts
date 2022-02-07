import express = require('express');
import * as request from 'supertest';
import { TenantRepository } from '..';
import { createTenantV2Router } from './tenantV2';

describe('Service Option Router', () => {
  const repositoryMock: TenantRepository = {
    save: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
    findBy: jest.fn(),
    findByName: jest.fn(),
    isTenantAdmin: jest.fn(),
  };
  const app = express();
  app.use(createTenantV2Router({ tenantRepository: repositoryMock }));

  describe('GET /tenants', () => {
    it('returns returns a 401', async () => {
      const res = await request(app).get('/tenants');
      expect(res.statusCode).toBe(401);
    });
  });
});
