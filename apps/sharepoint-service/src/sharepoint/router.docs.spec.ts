import { adspId, AuditService, EventService, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import type { Request } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { CredentialStore } from './credentials';
import {
  CredentialNotSetError,
  DestinationDisabledError,
  DestinationNotFoundError,
  DetailRowsFailedError,
  SharePointError,
} from './errors';
import { SharePointFileService } from './files';
import { GraphTokenProvider } from './graph';
import { RowIdentityMissingError } from './mapper';
import { SharePointPusher } from './push';
import { ServiceRoles } from './roles';
import { createSharePointRouter } from './router';
import { ListNameTakenError, SharePointSetup } from './setup';
import { SharePointConfiguration } from './types';

// Verifies the request validation, roles, and error responses documented in router.swagger.yml by sending requests
// through the router as mounted in the service (authenticated, then the router, then the error handler).
describe('SharePoint router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const documented = createDocumentedResponseRecorder(join(__dirname, 'router.swagger.yml'));

  const configuration: SharePointConfiguration = {
    connections: {
      'intake-site': {
        id: 'intake-site',
        name: 'Intake site',
        entraTenantId: 'entra-tenant',
        clientId: 'client-1',
        siteId: 'contoso.sharepoint.com,site,web',
      },
    },
    destinations: {
      'grant-applications': {
        id: 'grant-applications',
        name: 'Grant applications',
        connectionId: 'intake-site',
        listId: 'list-1',
        fieldMappings: [{ source: 'applicant.firstName', target: 'FirstName' }],
        idempotencyFields: ['_adsp.key'],
      },
    },
  };

  const user = (id: string, roles: string[], isCore = false) =>
    ({ id, name: id, tenantId: isCore ? undefined : tenantId, roles, isCore }) as unknown as User;
  const admin = user('admin', [ServiceRoles.Admin]);
  const writer = user('writer', [ServiceRoles.Writer]);
  const coreWriter = user('form-service', [ServiceRoles.Writer], true);
  const reader = user('reader', []);

  const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as Logger;
  const credentialStore = { set: jest.fn(), status: jest.fn(), remove: jest.fn() };
  const tokens = { evict: jest.fn() };
  const pusher = { push: jest.fn(), test: jest.fn() };
  const fileService = { upload: jest.fn(), checkDocumentLibrary: jest.fn() };
  const setup = { verify: jest.fn(), setUp: jest.fn() };
  const auditService = { record: jest.fn() };
  const eventService = { send: jest.fn() };

  function createApp(currentUser: User | null, hasTenant = true) {
    const app = express();
    app.use(documented.middleware);
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = currentUser;
      req.isAuthenticated = (() => !!currentUser) as typeof req.isAuthenticated;
      req.tenant = hasTenant ? ({ id: tenantId } as Request['tenant']) : undefined;
      req.getConfiguration = (async () => [configuration, undefined]) as unknown as Request['getConfiguration'];
      next();
    });
    app.use(
      '/sharepoint/v1',
      assertAuthenticatedHandler,
      createSharePointRouter({
        logger,
        credentialStore: credentialStore as unknown as CredentialStore,
        tokens: tokens as unknown as GraphTokenProvider,
        pusher: pusher as unknown as SharePointPusher,
        fileService: fileService as unknown as SharePointFileService,
        setup: setup as unknown as SharePointSetup,
        auditService: auditService as unknown as AuditService,
        eventService: eventService as unknown as EventService,
      }),
    );
    app.use(createErrorHandler(logger));
    return app;
  }

  const notFound = () => new DestinationNotFoundError('missing');
  const tooLongId = 'a'.repeat(51);
  const data = { applicant: { firstName: 'Test' }, _adsp: { key: 'submission-1' } };

  beforeEach(() => {
    jest.clearAllMocks();
    credentialStore.set.mockResolvedValue({ isSet: true, updatedAt: new Date() });
    credentialStore.status.mockResolvedValue({ isSet: false });
    credentialStore.remove.mockResolvedValue(true);
    pusher.push.mockResolvedValue({ itemId: '42', outcome: 'created' });
    pusher.test.mockResolvedValue({ itemId: '43', outcome: 'created' });
    fileService.upload.mockResolvedValue({ files: [], row: { written: true, dataId: '42', outcome: 'created' } });
    auditService.record.mockResolvedValue({ status: 'recorded', eventId: 'event-1' });
    setup.verify.mockResolvedValue({ ready: true, lists: [] });
    setup.setUp.mockResolvedValue({
      createdLists: [],
      createdColumns: [],
      indexedColumns: [],
      failures: [],
      permissionDenied: false,
      report: { ready: true, lists: [] },
    });
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  it('responds 401 when there is no authenticated user', async () => {
    const res = await request(createApp(null)).get('/sharepoint/v1/connections/intake-site/credentials');
    expect(res.status).toBe(401);
  });

  describe('/connections/{connectionId}/credentials', () => {
    const path = '/sharepoint/v1/connections/intake-site/credentials';
    const invalidIdPath = `/sharepoint/v1/connections/${tooLongId}/credentials`;

    it('gets the status for an admin', async () => {
      const res = await request(createApp(admin)).get(path);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ isSet: false });
    });

    it('responds 400 for an invalid connection ID', async () => {
      const res = await request(createApp(admin)).get(invalidIdPath);
      expect(res.status).toBe(400);
    });

    it('responds 403 to a user without sharepoint-admin', async () => {
      const res = await request(createApp(writer)).get(path);
      expect(res.status).toBe(403);
    });

    it('sets the secret for an admin', async () => {
      const res = await request(createApp(admin)).put(path).send({ clientSecret: 'secret' });
      expect(res.status).toBe(200);
      expect(res.body.isSet).toBe(true);
    });

    it('responds 400 to a set without a secret', async () => {
      const res = await request(createApp(admin)).put(path).send({});
      expect(res.status).toBe(400);
    });

    it('responds 403 to a set by a user without sharepoint-admin', async () => {
      const res = await request(createApp(reader)).put(path).send({ clientSecret: 'secret' });
      expect(res.status).toBe(403);
    });

    it('responds 404 to a set for a connection that is not configured', async () => {
      const res = await request(createApp(admin))
        .put('/sharepoint/v1/connections/other-site/credentials')
        .send({ clientSecret: 'secret' });
      expect(res.status).toBe(404);
    });

    it('deletes the secret for an admin', async () => {
      const res = await request(createApp(admin)).delete(path);
      expect(res.status).toBe(204);
    });

    it('responds 400 to a delete with an invalid connection ID', async () => {
      const res = await request(createApp(admin)).delete(invalidIdPath);
      expect(res.status).toBe(400);
    });

    it('responds 403 to a delete by a user without sharepoint-admin', async () => {
      const res = await request(createApp(writer)).delete(path);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /destinations/{destinationId}/data', () => {
    const path = '/sharepoint/v1/destinations/grant-applications/data';

    it('pushes data for a tenant writer', async () => {
      const res = await request(createApp(writer)).post(path).send(data);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ dataId: '42', outcome: 'created' });
    });

    it('pushes data for a core writer acting on a tenant', async () => {
      const res = await request(createApp(coreWriter)).post(path).send(data);
      expect(res.status).toBe(200);
    });

    it('responds 400 to a core writer without a tenant', async () => {
      const res = await request(createApp(coreWriter, false)).post(path).send(data);
      expect(res.status).toBe(400);
    });

    it('responds 400 when the data has no row identity value', async () => {
      pusher.push.mockRejectedValueOnce(new RowIdentityMissingError('_adsp.key'));
      const res = await request(createApp(writer))
        .post(path)
        .send({ applicant: { firstName: 'Test' } });
      expect(res.status).toBe(400);
    });

    it('responds 403 to a user without sharepoint-writer', async () => {
      const res = await request(createApp(admin)).post(path).send(data);
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown destination', async () => {
      pusher.push.mockRejectedValueOnce(notFound());
      const res = await request(createApp(writer)).post(path).send(data);
      expect(res.status).toBe(404);
    });

    it('responds 409 for a disabled destination', async () => {
      pusher.push.mockRejectedValueOnce(new DestinationDisabledError('grant-applications'));
      const res = await request(createApp(writer)).post(path).send(data);
      expect(res.status).toBe(409);
      expect(res.body).toEqual({ errorCode: 'destination-disabled' });
    });

    it('responds 502 when Graph fails', async () => {
      pusher.push.mockRejectedValueOnce(new SharePointError('graph:TooManyRequests', true));
      const res = await request(createApp(writer)).post(path).send(data);
      expect(res.status).toBe(502);
      expect(res.body).toEqual({ errorCode: 'graph:TooManyRequests', retryable: true });
    });

    it('responds 502 with the main row when detail rows fail', async () => {
      pusher.push.mockRejectedValueOnce(
        new DetailRowsFailedError(
          '42',
          'created',
          [{ listId: 'details', indexes: [1] }],
          'graph:invalidRequest',
          false,
        ),
      );
      const res = await request(createApp(writer)).post(path).send(data);
      expect(res.status).toBe(502);
      expect(res.body).toMatchObject({ dataId: '42', detailFailures: [{ listId: 'details', indexes: [1] }] });
    });
  });

  describe('POST /destinations/{destinationId}/files', () => {
    const path = '/sharepoint/v1/destinations/grant-applications/files';
    const body = { submissionId: 'submission-1', files: [{ field: 'proofOfIncome', fileId: 'file-1' }], data };

    it('uploads files for a writer', async () => {
      const res = await request(createApp(writer)).post(path).send(body);
      expect(res.status).toBe(200);
    });

    it('responds 400 to a request without files', async () => {
      const res = await request(createApp(writer))
        .post(path)
        .send({ ...body, files: [] });
      expect(res.status).toBe(400);
    });

    it('responds 400 when updateRowOnly is not a boolean', async () => {
      const res = await request(createApp(writer))
        .post(path)
        .send({ ...body, updateRowOnly: 'yes' });
      expect(res.status).toBe(400);
    });

    it('responds 403 to a user without sharepoint-writer', async () => {
      const res = await request(createApp(admin)).post(path).send(body);
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown destination', async () => {
      fileService.upload.mockRejectedValueOnce(notFound());
      const res = await request(createApp(writer)).post(path).send(body);
      expect(res.status).toBe(404);
    });

    it('responds 409 when the connection has no secret', async () => {
      fileService.upload.mockRejectedValueOnce(new CredentialNotSetError('intake-site'));
      const res = await request(createApp(writer)).post(path).send(body);
      expect(res.status).toBe(409);
    });

    it('responds 502 with the per-file result when a file fails', async () => {
      fileService.upload.mockResolvedValueOnce({
        files: [
          { field: 'proofOfIncome', fileId: 'file-1', status: 'failed', errorCode: 'file:not-ready', retryable: true },
        ],
      });
      const res = await request(createApp(writer)).post(path).send(body);
      expect(res.status).toBe(502);
      expect(res.body.files[0].errorCode).toBe('file:not-ready');
    });

    it('responds 502 when sign-in fails before any file', async () => {
      fileService.upload.mockRejectedValueOnce(new SharePointError('entra:AADSTS7000222', false));
      const res = await request(createApp(writer)).post(path).send(body);
      expect(res.status).toBe(502);
      expect(res.body).toEqual({ errorCode: 'entra:AADSTS7000222', retryable: false });
    });
  });

  describe('POST /destinations/{destinationId}/test', () => {
    const path = '/sharepoint/v1/destinations/grant-applications/test';

    it('reports a successful push', async () => {
      const res = await request(createApp(admin)).post(path).send(data);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true, outcome: 'created' });
    });

    it('reports a failed push in the body', async () => {
      pusher.test.mockRejectedValueOnce(new SharePointError('graph:invalidRequest', false, 'ProgramName'));
      const res = await request(createApp(admin)).post(path).send(data);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: false, errorCode: 'graph:invalidRequest', column: 'ProgramName' });
    });

    it('responds 400 when the body is not an object', async () => {
      const res = await request(createApp(admin)).post(path).send([data]);
      expect(res.status).toBe(400);
    });

    it('responds 403 to a user without sharepoint-admin', async () => {
      const res = await request(createApp(writer)).post(path).send(data);
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown destination', async () => {
      pusher.test.mockRejectedValueOnce(notFound());
      const res = await request(createApp(admin)).post(path).send(data);
      expect(res.status).toBe(404);
    });
  });

  describe('POST /destinations/{destinationId}/verify', () => {
    const path = '/sharepoint/v1/destinations/grant-applications/verify';

    it('reports the lists for an admin', async () => {
      const res = await request(createApp(admin)).post(path);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ready: true, lists: [] });
    });

    it('responds 400 for an invalid destination ID', async () => {
      const res = await request(createApp(admin)).post(`/sharepoint/v1/destinations/${tooLongId}/verify`);
      expect(res.status).toBe(400);
    });

    it('responds 403 to a user without sharepoint-admin', async () => {
      const res = await request(createApp(writer)).post(path);
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown destination', async () => {
      setup.verify.mockRejectedValueOnce(notFound());
      const res = await request(createApp(admin)).post(path);
      expect(res.status).toBe(404);
    });

    it('responds 409 when the connection has no secret', async () => {
      setup.verify.mockRejectedValueOnce(new CredentialNotSetError('intake-site'));
      const res = await request(createApp(admin)).post(path);
      expect(res.status).toBe(409);
    });

    it('responds 502 when Graph fails', async () => {
      setup.verify.mockRejectedValueOnce(new SharePointError('graph:accessDenied', false));
      const res = await request(createApp(admin)).post(path);
      expect(res.status).toBe(502);
    });
  });

  describe('POST /destinations/{destinationId}/setup', () => {
    const path = '/sharepoint/v1/destinations/grant-applications/setup';

    it('sets up the destination for an admin', async () => {
      const res = await request(createApp(admin)).post(path);
      expect(res.status).toBe(200);
      expect(res.body.permissionDenied).toBe(false);
    });

    it('responds 400 for an invalid destination ID', async () => {
      const res = await request(createApp(admin)).post(`/sharepoint/v1/destinations/${tooLongId}/setup`);
      expect(res.status).toBe(400);
    });

    it('responds 403 to a user without sharepoint-admin', async () => {
      const res = await request(createApp(writer)).post(path);
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown destination', async () => {
      setup.setUp.mockRejectedValueOnce(notFound());
      const res = await request(createApp(admin)).post(path);
      expect(res.status).toBe(404);
    });

    it('responds 409 when a list with the same name exists', async () => {
      const lists = [{ index: 0, dataPath: 'dependents', listName: 'Grant dependents', listId: 'list-2' }];
      setup.setUp.mockRejectedValueOnce(new ListNameTakenError(lists));
      const res = await request(createApp(admin)).post(path);
      expect(res.status).toBe(409);
      expect(res.body).toEqual({ errorCode: 'list-name-taken', lists });
    });

    it('responds 502 when Graph fails', async () => {
      setup.setUp.mockRejectedValueOnce(new SharePointError('graph:serviceNotAvailable', true));
      const res = await request(createApp(admin)).post(path);
      expect(res.status).toBe(502);
    });
  });
});
