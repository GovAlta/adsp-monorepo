import { adspId } from '@abgov/adsp-service-sdk';
import type { User } from '@abgov/adsp-service-sdk';
import * as express from 'express';
import type { Request } from 'express';
import * as request from 'supertest';
import { Logger } from 'winston';
import { createSharePointRouter } from './router';
import { SharePointServiceRoles } from './roles';
import * as connections from './connections';
import * as graphAuth from './graphAuth';

jest.mock('./connections');
jest.mock('./graphAuth');

const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

const makeUser = (roles: string[]): User =>
  ({ id: 'user-1', name: 'Tester', tenantId, roles, isCore: false }) as unknown as User;

describe('sharepoint router', () => {
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  } as unknown as Logger;

  const buildApp = (user: User | null) => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = user as User;
      req.tenant = { id: tenantId } as unknown as Request['tenant'];
      next();
    });
    app.use('/sharepoint/v1/sharepoint', createSharePointRouter({ logger }));
    app.use((err: { extra?: { statusCode?: number }; message: string }, _req, res, _next) => {
      res.status(err.extra?.statusCode || 500).json({ errorMessage: err.message });
    });
    return app;
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /connections/:destinationId', () => {
    it('registers a connection for a user with the admin role', async () => {
      const admin = makeUser([SharePointServiceRoles.Admin]);

      const res = await request(buildApp(admin))
        .post('/sharepoint/v1/sharepoint/connections/intake-form')
        .send({ azureTenantId: 'entra-tenant-1', clientId: 'client-1', clientSecret: 'secret-1' });

      expect(res.status).toBe(200);
    });

    it('passes the tenant context and body to registerConnection', async () => {
      const admin = makeUser([SharePointServiceRoles.Admin]);

      await request(buildApp(admin))
        .post('/sharepoint/v1/sharepoint/connections/intake-form')
        .send({ azureTenantId: 'entra-tenant-1', clientId: 'client-1', clientSecret: 'secret-1' });

      expect(connections.registerConnection).toHaveBeenCalledWith(tenantId.toString(), 'intake-form', {
        azureTenantId: 'entra-tenant-1',
        clientId: 'client-1',
        clientSecret: 'secret-1',
      });
    });

    it('rejects a user without the admin role', async () => {
      const writer = makeUser([SharePointServiceRoles.Writer]);

      const res = await request(buildApp(writer))
        .post('/sharepoint/v1/sharepoint/connections/intake-form')
        .send({ azureTenantId: 'entra-tenant-1', clientId: 'client-1', clientSecret: 'secret-1' });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /destinations/:destinationId/data', () => {
    it('rejects a user without the writer role', async () => {
      const admin = makeUser([SharePointServiceRoles.Admin]);

      const res = await request(buildApp(admin))
        .post('/sharepoint/v1/sharepoint/destinations/intake-form/data')
        .send({ applicant: { name: 'Jordan' } });

      expect(res.status).toBe(403);
    });

    it('returns not found when no connection is registered for the destination', async () => {
      const writer = makeUser([SharePointServiceRoles.Writer]);
      (connections.getConnection as jest.Mock).mockReturnValue(undefined);

      const res = await request(buildApp(writer))
        .post('/sharepoint/v1/sharepoint/destinations/intake-form/data')
        .send({ applicant: { name: 'Jordan' } });

      expect(res.status).toBe(404);
    });

    it('acquires a Graph token for the registered connection', async () => {
      const writer = makeUser([SharePointServiceRoles.Writer]);
      const connection = { azureTenantId: 'entra-tenant-1', clientId: 'client-1', clientSecret: 'secret-1' };
      (connections.getConnection as jest.Mock).mockReturnValue(connection);
      (graphAuth.acquireGraphToken as jest.Mock).mockResolvedValue(undefined);

      await request(buildApp(writer))
        .post('/sharepoint/v1/sharepoint/destinations/intake-form/data')
        .send({ applicant: { name: 'Jordan' } });

      expect(graphAuth.acquireGraphToken).toHaveBeenCalledWith(tenantId.toString(), 'intake-form', connection, logger);
    });

    it('returns ok once the Graph token is acquired', async () => {
      const writer = makeUser([SharePointServiceRoles.Writer]);
      (connections.getConnection as jest.Mock).mockReturnValue({
        azureTenantId: 'entra-tenant-1',
        clientId: 'client-1',
        clientSecret: 'secret-1',
      });
      (graphAuth.acquireGraphToken as jest.Mock).mockResolvedValue(undefined);

      const res = await request(buildApp(writer))
        .post('/sharepoint/v1/sharepoint/destinations/intake-form/data')
        .send({ applicant: { name: 'Jordan' } });

      expect(res.status).toBe(200);
    });

    it('propagates a Graph authentication failure as an error response', async () => {
      const writer = makeUser([SharePointServiceRoles.Writer]);
      (connections.getConnection as jest.Mock).mockReturnValue({
        azureTenantId: 'entra-tenant-1',
        clientId: 'client-1',
        clientSecret: 'secret-1',
      });
      (graphAuth.acquireGraphToken as jest.Mock).mockRejectedValue(
        Object.assign(new Error('Unable to authenticate to Microsoft Graph for this connection.'), {
          extra: { statusCode: 502 },
        }),
      );

      const res = await request(buildApp(writer))
        .post('/sharepoint/v1/sharepoint/destinations/intake-form/data')
        .send({ applicant: { name: 'Jordan' } });

      expect(res.status).toBe(502);
    });
  });

  describe('POST /destinations/:destinationId/file/:fileUrl', () => {
    it('rejects a user without the writer role', async () => {
      const admin = makeUser([SharePointServiceRoles.Admin]);

      const res = await request(buildApp(admin)).post(
        '/sharepoint/v1/sharepoint/destinations/intake-form/file/https%3A%2F%2Ffile-service%2Fdoc.pdf',
      );

      expect(res.status).toBe(403);
    });

    it('returns not found when no connection is registered for the destination', async () => {
      const writer = makeUser([SharePointServiceRoles.Writer]);
      (connections.getConnection as jest.Mock).mockReturnValue(undefined);

      const res = await request(buildApp(writer)).post(
        '/sharepoint/v1/sharepoint/destinations/intake-form/file/https%3A%2F%2Ffile-service%2Fdoc.pdf',
      );

      expect(res.status).toBe(404);
    });

    it('returns ok once the Graph token is acquired for the registered connection', async () => {
      const writer = makeUser([SharePointServiceRoles.Writer]);
      (connections.getConnection as jest.Mock).mockReturnValue({
        azureTenantId: 'entra-tenant-1',
        clientId: 'client-1',
        clientSecret: 'secret-1',
      });
      (graphAuth.acquireGraphToken as jest.Mock).mockResolvedValue(undefined);

      const res = await request(buildApp(writer)).post(
        '/sharepoint/v1/sharepoint/destinations/intake-form/file/https%3A%2F%2Ffile-service%2Fdoc.pdf?delete=true',
      );

      expect(res.status).toBe(200);
    });
  });

  it('has no route for reading destination data back', async () => {
    const writer = makeUser([SharePointServiceRoles.Writer]);

    const res = await request(buildApp(writer)).get('/sharepoint/v1/sharepoint/destinations/intake-form/data');

    expect(res.status).toBe(404);
  });
});
