import { AdspId, adspId, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler } from '@core-services/core-common';
import * as express from 'express';
import * as request from 'supertest';
import { createLogger, transports } from 'winston';
import * as HttpStatusCodes from 'http-status-codes';
import { AuditServiceRoles } from '../roles';
import { assertWriteScope, getWriterClientId } from './write-access';
import { requireAuditRole } from './authorization';

describe('audit write access', () => {
  const tenantA = adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`;
  const tenantB = adspId`urn:ads:platform:tenant-service:v2:/tenants/payment-team`;
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const user: User = {
    id: 'case-writer',
    name: 'Case writer',
    email: '',
    isCore: false,
    roles: [AuditServiceRoles.Writer],
    tenantId: tenantA,
    token: {
      azp: 'urn:ads:case-team:case-service',
      aud: 'urn:ads:platform:audit-service',
      iss: 'tenant-issuer',
      bearer: 'test',
      email_verified: false,
    },
  };
  const coreUser: User = { ...user, isCore: true, tenantId: undefined };

  function createApp(caller: User, tenantId?: AdspId) {
    const app = express();
    app.use((req, _res, next) => {
      req.user = caller;
      if (tenantId) req.tenant = { id: tenantId, name: 'Audit tenant', realm: 'audit-tenant' };
      next();
    });
    app.post('/:namespace/events', requireAuditRole(AuditServiceRoles.Writer), assertWriteScope, (_req, res) =>
      res.sendStatus(HttpStatusCodes.NO_CONTENT),
    );
    app.use(createErrorHandler(logger));
    return app;
  }

  it('resolves the authenticated service client URN', () => {
    const clientId = getWriterClientId(user);

    expect(clientId.toString()).toBe('urn:ads:case-team:case-service');
  });

  it.each(['', 'case-service', 'urn:ads:case-team:case-service:v1', 'urn:ads:case-team:case-service:v1:/cases'])(
    'rejects a client ID that is not a service URN: %s',
    (azp) => {
      const caller = { ...user, token: { ...user.token, azp } };

      expect(() => getWriterClientId(caller)).toThrow(UnauthorizedUserError);
    },
  );

  it('permits a writer in its own tenant and namespace', async () => {
    const response = await request(createApp(user, tenantA)).post('/case-service/events');

    expect(response.status).toBe(HttpStatusCodes.NO_CONTENT);
  });

  it('refuses another resolved tenant even when the caller has the writer role', async () => {
    const response = await request(createApp(user, tenantB)).post('/case-service/events');

    expect(response.status).toBe(HttpStatusCodes.FORBIDDEN);
  });

  it('refuses another namespace for a tenant writer', async () => {
    const response = await request(createApp(user, tenantA)).post('/payment-service/events');

    expect(response.status).toBe(HttpStatusCodes.FORBIDDEN);
  });

  it.each([user, coreUser])('refuses a caller without the writer role in a resolved tenant %#', async (caller) => {
    const response = await request(createApp({ ...caller, roles: [] }, tenantA)).post('/case-service/events');

    expect(response.status).toBe(HttpStatusCodes.FORBIDDEN);
  });

  it('permits a Core writer in another namespace and tenant', async () => {
    const response = await request(createApp(coreUser, tenantB)).post('/payment-service/events');

    expect(response.status).toBe(HttpStatusCodes.NO_CONTENT);
  });

  it('requires a resolved tenant for a Core writer', async () => {
    const response = await request(createApp(coreUser)).post('/case-service/events');

    expect(response.status).toBe(HttpStatusCodes.BAD_REQUEST);
  });
});
