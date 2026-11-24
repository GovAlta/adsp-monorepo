import { adspId, AdspId, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler, NotFoundError } from '@core-services/core-common';
import { randomBytes } from 'crypto';
import * as express from 'express';
import type { Request } from 'express';
import * as request from 'supertest';
import { Logger } from 'winston';
import { CredentialRepository, CredentialStore, parseEncryptionKey, StoredCredential } from './credentials';
import {
  CredentialNotSetError,
  CredentialUnreadableError,
  DestinationDisabledError,
  DestinationNotSetUpError,
  DetailRowsFailedError,
  SharePointError,
} from './errors';
import { SharePointFileService } from './files';
import { ListNameTakenError, SharePointSetup } from './setup';
import { GraphTokenProvider } from './graph';
import { RowIdentityMissingError } from './mapper';
import { SharePointPusher } from './push';
import { ServiceRoles } from './roles';
import { createSharePointRouter } from './router';
import { SharePointConfiguration } from './types';

class MemoryCredentialRepository implements CredentialRepository {
  private records = new Map<string, StoredCredential>();

  async get(tenantId: AdspId, connectionId: string) {
    return this.records.get(`${tenantId}|${connectionId}`) ?? null;
  }

  async save(credential: StoredCredential) {
    this.records.set(`${credential.tenantId}|${credential.connectionId}`, credential);
    return credential;
  }

  async delete(tenantId: AdspId, connectionId: string) {
    return this.records.delete(`${tenantId}|${connectionId}`);
  }

  async findNotOnKeyVersion() {
    return [];
  }

  async replaceIfUnchanged() {
    return false;
  }
}

const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
const SECRET = 'Secret-Value-5150';
const SENTINEL = 'Sentinel-Value-8231';

const configuration: SharePointConfiguration = {
  connections: {
    'hr-site': {
      id: 'hr-site',
      name: 'HR site',
      entraTenantId: 'entra-tenant',
      clientId: 'client-1',
      siteId: 'contoso.sharepoint.com,site,web',
    },
  },
  destinations: {
    'hr-intake': {
      id: 'hr-intake',
      name: 'HR intake',
      connectionId: 'hr-site',
      listId: 'list-1',
      fieldMappings: [{ source: 'applicant.firstName', target: 'FirstName' }],
      idempotencyFields: ['_adsp.key'],
    },
  },
};

describe('SharePoint router', () => {
  const admin = { id: 'admin', name: 'Admin', tenantId, roles: [ServiceRoles.Admin], isCore: false } as unknown as User;
  const writer = {
    id: 'form-service',
    name: 'Form service',
    roles: [ServiceRoles.Writer],
    isCore: true,
  } as unknown as User;
  const reader = { id: 'reader', name: 'Reader', tenantId, roles: [], isCore: false } as unknown as User;

  let logger: { debug: jest.Mock; info: jest.Mock; warn: jest.Mock; error: jest.Mock };
  let pusher: { push: jest.Mock; test: jest.Mock };
  let fileService: { upload: jest.Mock; checkDocumentLibrary: jest.Mock };
  let setup: { verify: jest.Mock; setUp: jest.Mock };
  let clearConfiguration: jest.Mock;
  let tokens: { evict: jest.Mock };
  let currentUser: User;
  let app: express.Application;

  beforeEach(() => {
    logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    pusher = {
      push: jest.fn().mockResolvedValue({ itemId: 'item-7', outcome: 'updated' }),
      test: jest.fn().mockResolvedValue({ itemId: 'item-8', outcome: 'created' }),
    };
    fileService = { upload: jest.fn(), checkDocumentLibrary: jest.fn().mockResolvedValue(undefined) };
    setup = { verify: jest.fn(), setUp: jest.fn() };
    clearConfiguration = jest.fn();
    tokens = { evict: jest.fn() };
    currentUser = admin;

    const credentialStore = new CredentialStore(new MemoryCredentialRepository(), {
      current: parseEncryptionKey(randomBytes(32).toString('base64'), 1),
    });

    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = currentUser;
      req.tenant = { id: tenantId } as unknown as Request['tenant'];
      req.getConfiguration = (async () => [configuration, undefined]) as unknown as Request['getConfiguration'];
      next();
    });
    app.use(
      '/sharepoint/v1',
      createSharePointRouter({
        logger: logger as unknown as Logger,
        credentialStore,
        tokens: tokens as unknown as GraphTokenProvider,
        pusher: pusher as unknown as SharePointPusher,
        fileService: fileService as unknown as SharePointFileService,
        setup: setup as unknown as SharePointSetup,
        clearConfiguration,
      }),
    );
    app.use(createErrorHandler(logger as unknown as Logger));
  });

  const setSecret = (connectionId = 'hr-site', clientSecret = SECRET) =>
    request(app).put(`/sharepoint/v1/connections/${connectionId}/credentials`).send({ clientSecret });

  const push = (data: unknown = { applicant: { firstName: 'Ada' }, _adsp: { key: 'submission-1' } }) =>
    request(app)
      .post('/sharepoint/v1/destinations/hr-intake/data')
      .send(data as object);

  const runTest = (data: Record<string, unknown> = { applicant: { firstName: 'Ada' } }) =>
    request(app).post('/sharepoint/v1/destinations/hr-intake/test').send(data);

  const loggedText = () =>
    JSON.stringify([logger.debug.mock.calls, logger.info.mock.calls, logger.warn.mock.calls, logger.error.mock.calls]);

  describe('credentials', () => {
    it('sets a credential, clears the cached token and reports status without the secret', async () => {
      const res = await setSecret();
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ isSet: true, updatedAt: expect.any(String) });
      expect(tokens.evict).toHaveBeenCalledWith(tenantId, 'hr-site');

      const status = await request(app).get('/sharepoint/v1/connections/hr-site/credentials');
      expect(status.body).toEqual({ isSet: true, updatedAt: expect.any(String) });
      expect(JSON.stringify([res.body, status.body]) + loggedText()).not.toContain(SECRET);
    });

    it('returns 404 for a connection that is not in the tenant configuration', async () => {
      expect((await setSecret('someone-elses')).status).toBe(404);
    });

    it('rejects an empty secret', async () => {
      expect((await setSecret('hr-site', '')).status).toBe(400);
    });

    it('forbids users without the admin role', async () => {
      currentUser = reader;
      expect((await setSecret()).status).toBe(403);
    });

    it("forbids core service accounts from setting, reading or deleting a tenant's secret, even with the admin role", async () => {
      await setSecret();
      currentUser = {
        id: 'core-service',
        name: 'Core service',
        roles: [ServiceRoles.Admin],
        isCore: true,
      } as unknown as User;

      expect((await setSecret('hr-site', 'replaced')).status).toBe(403);
      expect((await request(app).get('/sharepoint/v1/connections/hr-site/credentials')).status).toBe(403);
      expect((await request(app).delete('/sharepoint/v1/connections/hr-site/credentials')).status).toBe(403);

      currentUser = admin;
      expect((await request(app).get('/sharepoint/v1/connections/hr-site/credentials')).body).toEqual({
        isSet: true,
        updatedAt: expect.any(String),
      });
    });

    it('deletes a credential and clears the cached token', async () => {
      await setSecret();
      tokens.evict.mockClear();
      expect((await request(app).delete('/sharepoint/v1/connections/hr-site/credentials')).status).toBe(204);
      expect(tokens.evict).toHaveBeenCalledWith(tenantId, 'hr-site');
      expect((await request(app).get('/sharepoint/v1/connections/hr-site/credentials')).body).toEqual({
        isSet: false,
      });
    });
  });

  describe('push', () => {
    beforeEach(() => {
      currentUser = writer;
    });

    it('pushes the body as the data and returns the record', async () => {
      const data = { applicant: { firstName: 'Ada' }, _adsp: { key: 'submission-1' } };
      const res = await push(data);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ dataId: 'item-7', outcome: 'updated', date: expect.any(String) });
      expect(pusher.push).toHaveBeenCalledWith(tenantId, configuration, 'hr-intake', data);
    });

    it('returns 400 when the body is not an object', async () => {
      expect((await push([1, 2])).status).toBe(400);
      expect(pusher.push).not.toHaveBeenCalled();
    });

    it('returns 400 when the data has no value for a row identity field', async () => {
      pusher.push.mockRejectedValueOnce(new RowIdentityMissingError('_adsp.key'));
      expect((await push({ applicant: { firstName: 'Ada' } })).status).toBe(400);
    });

    it('returns 409 for a disabled destination', async () => {
      pusher.push.mockRejectedValueOnce(new DestinationDisabledError('hr-intake'));
      const res = await push();
      expect(res.status).toBe(409);
      expect(res.body).toEqual({ errorCode: 'destination-disabled' });
    });

    it('returns 409 when no credential is set', async () => {
      pusher.push.mockRejectedValueOnce(new CredentialNotSetError('hr-site'));
      const res = await push();
      expect(res.status).toBe(409);
      expect(res.body).toEqual({ errorCode: 'credential-not-set' });
    });

    it('returns 409 when the stored credential cannot be decrypted', async () => {
      pusher.push.mockRejectedValueOnce(new CredentialUnreadableError('hr-site'));
      const res = await push();
      expect(res.status).toBe(409);
      expect(res.body).toEqual({ errorCode: 'credential-unreadable' });
    });

    it('returns 502 with the SharePoint error code and whether to retry', async () => {
      pusher.push.mockRejectedValueOnce(new SharePointError('graph:TooManyRequests', true));
      const res = await push();
      expect(res.status).toBe(502);
      expect(res.body).toEqual({ errorCode: 'graph:TooManyRequests', retryable: true });
    });

    it('reports the rejected column', async () => {
      pusher.push.mockRejectedValueOnce(new SharePointError('graph:invalidRequest', false, 'FirstName'));
      const res = await push();
      expect(res.status).toBe(502);
      expect(res.body).toEqual({ errorCode: 'graph:invalidRequest', retryable: false, column: 'FirstName' });
    });

    it('returns the detail rows that were written', async () => {
      const detailRows = [{ listId: 'members', rowIds: ['m-1', 'm-2'] }];
      pusher.push.mockResolvedValueOnce({ itemId: 'item-7', outcome: 'created', detailRows });

      const res = await push();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ dataId: 'item-7', outcome: 'created', date: expect.any(String), detailRows });
    });

    it('returns 502 with the main row ID and the failed items when detail rows fail', async () => {
      const detailFailures = [{ listId: 'members', indexes: [1] }];
      pusher.push.mockRejectedValueOnce(
        new DetailRowsFailedError('item-7', detailFailures, 'graph:serviceNotAvailable', true),
      );

      const res = await push();

      expect(res.status).toBe(502);
      expect(res.body).toEqual({
        errorCode: 'graph:serviceNotAvailable',
        retryable: true,
        dataId: 'item-7',
        detailFailures,
      });
    });

    it('returns 409 when a detail list is not set up yet', async () => {
      pusher.push.mockRejectedValueOnce(new DestinationNotSetUpError('hr-intake'));
      const res = await push();
      expect(res.status).toBe(409);
      expect(res.body).toEqual({ errorCode: 'destination-not-set-up' });
    });

    it('returns 404 for an unknown destination', async () => {
      pusher.push.mockRejectedValueOnce(new NotFoundError('SharePoint destination', 'missing'));
      expect((await push()).status).toBe(404);
    });

    it('forbids users without the writer role', async () => {
      currentUser = reader;
      expect((await push()).status).toBe(403);
    });

    it('forbids tenant admins, who check destinations with Test instead', async () => {
      currentUser = admin;
      expect((await push()).status).toBe(403);
    });

    it('never logs payload values', async () => {
      await push({ applicant: { firstName: SENTINEL }, _adsp: { key: 'submission-1' } });
      pusher.push.mockRejectedValueOnce(new SharePointError('graph:invalidRequest', false, 'FirstName'));
      await push({ applicant: { firstName: SENTINEL }, _adsp: { key: 'submission-1' } });
      currentUser = admin;
      pusher.test.mockRejectedValueOnce(new SharePointError('graph:invalidRequest', false, 'FirstName'));
      await runTest({ applicant: { firstName: SENTINEL } });
      expect(loggedText()).not.toContain(SENTINEL);
    });
  });

  describe('test', () => {
    it('runs the test with the body as the data', async () => {
      const res = await runTest({ applicant: { firstName: 'Ada' } });
      expect(res.body).toEqual({ ok: true, outcome: 'created' });
      expect(pusher.test).toHaveBeenCalledWith(tenantId, configuration, 'hr-intake', {
        applicant: { firstName: 'Ada' },
      });
    });

    it('reads the configuration fresh, so a test right after saving uses the saved destination', async () => {
      await runTest();
      expect(clearConfiguration).toHaveBeenCalledWith(tenantId);
      expect(clearConfiguration.mock.invocationCallOrder[0]).toBeLessThan(pusher.test.mock.invocationCallOrder[0]);
    });

    it('keeps using the cached configuration for pushes', async () => {
      currentUser = writer;
      await push();
      expect(clearConfiguration).not.toHaveBeenCalled();
    });

    it('returns the error code and column on failure', async () => {
      pusher.test.mockRejectedValueOnce(new SharePointError('graph:invalidRequest', false, 'Nope'));
      const res = await runTest();
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: false, errorCode: 'graph:invalidRequest', column: 'Nope' });
    });

    it('reports a stored credential that cannot be decrypted', async () => {
      pusher.test.mockRejectedValueOnce(new CredentialUnreadableError('hr-site'));
      const res = await runTest();
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: false, errorCode: 'credential-unreadable' });
    });

    it('reports test data with no value for a row identity field', async () => {
      pusher.test.mockRejectedValueOnce(new RowIdentityMissingError('_adsp.key'));
      expect((await runTest()).body).toEqual({ ok: false, errorCode: 'row-identity-missing' });
    });

    it('reports a missing credential', async () => {
      pusher.test.mockRejectedValueOnce(new CredentialNotSetError('hr-site'));
      expect((await runTest()).body).toEqual({ ok: false, errorCode: 'credential-not-set' });
    });

    it('shows the detail rows written', async () => {
      const detailRows = [{ listId: 'members', rowIds: ['m-1'] }];
      pusher.test.mockResolvedValueOnce({ itemId: 'item-8', outcome: 'created', detailRows });
      expect((await runTest()).body).toEqual({ ok: true, outcome: 'created', detailRows });
    });

    it('checks the document library before writing the test row', async () => {
      await runTest();
      expect(fileService.checkDocumentLibrary).toHaveBeenCalledWith(tenantId, configuration, 'hr-intake');
      expect(fileService.checkDocumentLibrary.mock.invocationCallOrder[0]).toBeLessThan(
        pusher.test.mock.invocationCallOrder[0],
      );
    });

    it('reports a document library that cannot be used, without writing the test row', async () => {
      fileService.checkDocumentLibrary.mockRejectedValueOnce(new SharePointError('not-a-document-library', false));
      expect((await runTest()).body).toEqual({ ok: false, errorCode: 'not-a-document-library' });
      expect(pusher.test).not.toHaveBeenCalled();
    });

    it('reports detail rows that failed', async () => {
      const detailFailures = [{ listId: 'members', indexes: [0], column: 'ParentItemId' }];
      pusher.test.mockRejectedValueOnce(
        new DetailRowsFailedError('item-8', detailFailures, 'graph:invalidRequest', false),
      );
      expect((await runTest()).body).toEqual({ ok: false, errorCode: 'graph:invalidRequest', detailFailures });
    });

    it('reports a detail list that is not set up yet', async () => {
      pusher.test.mockRejectedValueOnce(new DestinationNotSetUpError('hr-intake'));
      expect((await runTest()).body).toEqual({ ok: false, errorCode: 'destination-not-set-up' });
    });

    it('forbids core writers', async () => {
      currentUser = writer;
      expect((await runTest()).status).toBe(403);
      expect(pusher.test).not.toHaveBeenCalled();
    });
  });

  describe('setup', () => {
    const report = { ready: false, lists: [{ kind: 'main', listId: 'list-1', status: 'ok', columns: [] }] };
    const verify = () => request(app).post('/sharepoint/v1/destinations/hr-intake/verify');
    const runSetup = () => request(app).post('/sharepoint/v1/destinations/hr-intake/setup');

    it('verifies a destination with configuration read fresh, not from the cache', async () => {
      setup.verify.mockResolvedValueOnce(report);

      const res = await verify();

      expect(res.status).toBe(200);
      expect(res.body).toEqual(report);
      expect(setup.verify).toHaveBeenCalledWith(tenantId, configuration, 'hr-intake');
      expect(clearConfiguration).toHaveBeenCalledWith(tenantId);
      expect(clearConfiguration.mock.invocationCallOrder[0]).toBeLessThan(setup.verify.mock.invocationCallOrder[0]);
    });

    it('sets up a destination with configuration read fresh, not from the cache', async () => {
      const result = {
        createdLists: [],
        createdColumns: [],
        indexedColumns: [],
        failures: [],
        permissionDenied: false,
        report,
      };
      setup.setUp.mockResolvedValueOnce(result);

      expect((await runSetup()).body).toEqual(result);
      expect(setup.setUp).toHaveBeenCalledWith(tenantId, configuration, 'hr-intake');
      expect(clearConfiguration.mock.invocationCallOrder[0]).toBeLessThan(setup.setUp.mock.invocationCallOrder[0]);
    });

    it('returns 409 with the lists when a list name is already taken', async () => {
      const lists = [{ index: 0, dataPath: 'members', listName: 'Members', listId: 'existing' }];
      setup.setUp.mockRejectedValueOnce(new ListNameTakenError(lists));

      const res = await runSetup();

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ errorCode: 'list-name-taken', lists });
    });

    it.each([
      ['credential-not-set', new CredentialNotSetError('hr-site'), 409],
      ['credential-unreadable', new CredentialUnreadableError('hr-site'), 409],
    ])('returns %s', async (errorCode, error, status) => {
      setup.verify.mockRejectedValueOnce(error);

      const res = await verify();

      expect(res.status).toBe(status);
      expect(res.body).toEqual({ errorCode });
    });

    it('returns 502 with the SharePoint error code', async () => {
      setup.setUp.mockRejectedValueOnce(new SharePointError('entra:AADSTS7000215', false));

      const res = await runSetup();

      expect(res.status).toBe(502);
      expect(res.body).toEqual({ errorCode: 'entra:AADSTS7000215', retryable: false });
    });

    it.each([
      ['users without the admin role', () => reader],
      ['core writers', () => writer],
    ])('forbids %s', async (_case, user) => {
      currentUser = user();

      expect((await verify()).status).toBe(403);
      expect((await runSetup()).status).toBe(403);
      expect(setup.verify).not.toHaveBeenCalled();
      expect(setup.setUp).not.toHaveBeenCalled();
    });
  });

  describe('files', () => {
    const body = {
      submissionId: 'submission-1',
      files: [{ field: 'proofOfIdentity', fileId: 'local:proof.pdf' }],
      data: { applicant: { firstName: 'Ada' }, _adsp: { key: 'submission-1' } },
    };
    const uploaded = {
      field: 'proofOfIdentity',
      fileId: 'local:proof.pdf',
      status: 'uploaded',
      id: 'item-1',
      name: 'proof.pdf',
      url: 'https://sp.example/proof.pdf',
      size: 10,
    };
    const failed = {
      field: 'statement',
      fileId: 'local:missing.pdf',
      status: 'failed',
      errorCode: 'file:not-found',
      retryable: false,
    };

    const upload = (payload: unknown = body, destination = 'hr-intake') =>
      request(app)
        .post(`/sharepoint/v1/destinations/${destination}/files`)
        .send(payload as object);

    beforeEach(() => {
      currentUser = writer;
      fileService.upload.mockResolvedValue({
        files: [uploaded],
        row: { written: true, dataId: 'item-7', outcome: 'created' },
      });
    });

    it('uploads the files and returns the results', async () => {
      const res = await upload();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ files: [uploaded], row: { written: true, dataId: 'item-7', outcome: 'created' } });
      expect(fileService.upload).toHaveBeenCalledWith(tenantId, configuration, 'hr-intake', body);
    });

    it('forbids tenant admins, who check destinations with Test instead', async () => {
      currentUser = admin;
      expect((await upload()).status).toBe(403);
      expect(fileService.upload).not.toHaveBeenCalled();
    });

    it('forbids users without the writer role', async () => {
      currentUser = reader;
      expect((await upload()).status).toBe(403);
      expect(fileService.upload).not.toHaveBeenCalled();
    });

    it('returns 502 with the per-file results when some files fail', async () => {
      fileService.upload.mockResolvedValueOnce({ files: [uploaded, failed] });
      const res = await upload();

      expect(res.status).toBe(502);
      expect(res.body).toEqual({ files: [uploaded, failed] });
    });

    it('returns 502 when every file fails', async () => {
      fileService.upload.mockResolvedValueOnce({ files: [failed] });
      const res = await upload();

      expect(res.status).toBe(502);
      expect(res.body.files).toEqual([failed]);
    });

    it('returns 502 when the files upload but the row cannot be written', async () => {
      fileService.upload.mockResolvedValueOnce({
        files: [uploaded],
        row: { written: false, errorCode: 'graph:invalidRequest', retryable: false },
      });
      const res = await upload();

      expect(res.status).toBe(502);
      expect(res.body.row).toEqual({ written: false, errorCode: 'graph:invalidRequest', retryable: false });
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('graph:invalidRequest'),
        expect.objectContaining({ context: 'SharePointRouter' }),
      );
    });

    it('returns 409 for a disabled destination', async () => {
      fileService.upload.mockRejectedValueOnce(new DestinationDisabledError('hr-intake'));
      const res = await upload();

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ errorCode: 'destination-disabled' });
    });

    it('returns 409 when no credential is set', async () => {
      fileService.upload.mockRejectedValueOnce(new CredentialNotSetError('hr-site'));
      const res = await upload();

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ errorCode: 'credential-not-set' });
    });

    it('returns 409 when the stored credential cannot be decrypted', async () => {
      fileService.upload.mockRejectedValueOnce(new CredentialUnreadableError('hr-site'));
      const res = await upload();

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ errorCode: 'credential-unreadable' });
    });

    it('returns 409 when a detail list is not set up yet', async () => {
      fileService.upload.mockRejectedValueOnce(new DestinationNotSetUpError('hr-intake'));
      const res = await upload();

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ errorCode: 'destination-not-set-up' });
    });

    it('returns 502 with the error code when Microsoft sign-in fails', async () => {
      fileService.upload.mockRejectedValueOnce(new SharePointError('entra:AADSTS7000215', false));
      const res = await upload();

      expect(res.status).toBe(502);
      expect(res.body).toEqual({ errorCode: 'entra:AADSTS7000215', retryable: false });
    });

    it('returns 404 for an unknown destination', async () => {
      fileService.upload.mockRejectedValueOnce(new NotFoundError('SharePoint destination', 'missing'));
      expect((await upload(body, 'missing')).status).toBe(404);
    });

    it('returns 400 when the data has no value for a row identity field', async () => {
      fileService.upload.mockRejectedValueOnce(new RowIdentityMissingError('_adsp.key'));
      expect((await upload()).status).toBe(400);
    });

    it.each([
      ['no submission ID', { ...body, submissionId: undefined }],
      ['an empty file list', { ...body, files: [] }],
      ['more than 20 files', { ...body, files: Array.from({ length: 21 }, () => body.files[0]) }],
      ['a file without a field', { ...body, files: [{ fileId: 'local:proof.pdf' }] }],
      ['a file without an ID', { ...body, files: [{ field: 'proofOfIdentity' }] }],
      ['data that is not an object', { ...body, data: 'text' }],
      ['updateRowOnly that is not a boolean', { ...body, updateRowOnly: 'yes' }],
    ])('returns 400 for %s', async (_name, payload) => {
      expect((await upload(payload)).status).toBe(400);
      expect(fileService.upload).not.toHaveBeenCalled();
    });

    it('accepts a request without data', async () => {
      const res = await upload({ submissionId: 'submission-1', files: body.files });

      expect(res.status).toBe(200);
      expect(fileService.upload).toHaveBeenCalledWith(tenantId, configuration, 'hr-intake', {
        submissionId: 'submission-1',
        files: body.files,
      });
    });

    it('never logs payload values', async () => {
      await upload({ ...body, data: { applicant: { firstName: SENTINEL }, _adsp: { key: 'submission-1' } } });
      fileService.upload.mockRejectedValueOnce(new SharePointError('graph:invalidRequest', false));
      await upload({ ...body, data: { applicant: { firstName: SENTINEL }, _adsp: { key: 'submission-1' } } });

      expect(loggedText()).not.toContain(SENTINEL);
    });
  });
});
