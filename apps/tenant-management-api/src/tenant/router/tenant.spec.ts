import { User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import * as express from 'express';
import { Express } from 'express';
import * as request from 'supertest';
import { Logger } from 'winston';
import { createTenantRouter } from './tenant';

jest.mock('../../keycloak', () => ({ createkcAdminClient: jest.fn() }));

describe('tenant router lookups', () => {
  const tenant = { id: 'tenant-1', name: 'Tenant', realm: 'realm-1', adminEmail: 'admin@test.co' };
  const repositoryMock = { find: jest.fn() };
  const loggerMock = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;

  function createApp(): Express {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { id: 'user', roles: [], isCore: false } as unknown as User;
      next();
    });
    app.use(
      '/',
      createTenantRouter({
        tenantRepository: repositoryMock as never,
        realmService: {} as never,
        eventService: { send: jest.fn() },
        auditService: { audit: jest.fn() } as never,
      }),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  beforeEach(() => {
    repositoryMock.find.mockReset();
    repositoryMock.find.mockResolvedValue([tenant]);
  });

  it.each([
    ['email', 'admin@test.co', { adminEmailEquals: 'admin@test.co', excludeArchived: true }],
    ['name', 'Tenant', { nameEquals: 'Tenant', excludeArchived: true }],
  ])('finds a tenant by %s with a string value', async (path, value, criteria) => {
    const res = await request(createApp())
      .post(`/${path}`)
      .send({ [path]: value });

    expect(res.status).toBe(200);
    expect(repositoryMock.find).toHaveBeenCalledWith(criteria);
  });

  it.each([
    ['email', { $ne: null }],
    ['email', ''],
    ['name', { $regex: '.*' }],
    ['name', ''],
  ])('responds 400 for %s %j without querying the repository', async (path, value) => {
    const res = await request(createApp())
      .post(`/${path}`)
      .send({ [path]: value });

    expect(res.status).toBe(400);
    expect(repositoryMock.find).not.toHaveBeenCalled();
  });
});
