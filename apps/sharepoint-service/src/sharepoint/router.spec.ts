import { adspId, AdspId, User } from '@abgov/adsp-service-sdk';
import { createErrorHandler, NotFoundError } from '@core-services/core-common';
import { randomBytes } from 'crypto';
import * as express from 'express';
import type { Request } from 'express';
import * as request from 'supertest';
import { Logger } from 'winston';
import { CredentialRepository, CredentialStore, parseEncryptionKey, StoredCredential } from './credentials';
import { CredentialNotSetError, DestinationDisabledError, SharePointError } from './errors';
import { SharePointFileService } from './files';
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
  let fileService: { upload: jest.Mock };
  let tokens: { evict: jest.Mock };
  let currentUser: User;
  let app: express.Application;

  beforeEach(() => {
    logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    pusher = {
      push: jest.fn().mockResolvedValue({ itemId: 'item-7', outcome: 'updated' }),
      test: jest.fn().mockResolvedValue({ itemId: 'item-8', outcome: 'created' }),
    };
    fileService = { upload: jest.fn() };
    tokens = { evict: jest.fn() };
    currentUser = admin;

    const credentialStore = new CredentialStore(
      new MemoryCredentialRepository(),
      parseEncryptionKey(randomBytes(32).toString('base64'), 1),
    );

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

    it('returns the error code and column on failure', async () => {
      pusher.test.mockRejectedValueOnce(new SharePointError('graph:invalidRequest', false, 'Nope'));
      const res = await runTest();
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: false, errorCode: 'graph:invalidRequest', column: 'Nope' });
    });

    it('reports test data with no value for a row identity field', async () => {
      pusher.test.mockRejectedValueOnce(new RowIdentityMissingError('_adsp.key'));
      expect((await runTest()).body).toEqual({ ok: false, errorCode: 'row-identity-missing' });
    });

    it('reports a missing credential', async () => {
      pusher.test.mockRejectedValueOnce(new CredentialNotSetError('hr-site'));
      expect((await runTest()).body).toEqual({ ok: false, errorCode: 'credential-not-set' });
    });

    it('forbids core writers', async () => {
      currentUser = writer;
      expect((await runTest()).status).toBe(403);
      expect(pusher.test).not.toHaveBeenCalled();
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

    it('allows tenant admins', async () => {
      currentUser = admin;
      expect((await upload()).status).toBe(200);
    });

    it('forbids users without a writer or admin role', async () => {
      currentUser = reader;
      expect((await upload()).status).toBe(403);
      expect(fileService.upload).not.toHaveBeenCalled();
    });

    it('returns 207 when some files fail', async () => {
      fileService.upload.mockResolvedValueOnce({ files: [uploaded, failed] });
      const res = await upload();

      expect(res.status).toBe(207);
      expect(res.body.files).toEqual([uploaded, failed]);
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
      ['an unknown link format', { ...body, linkFormat: 'url' }],
    ])('returns 400 for %s', async (_name, payload) => {
      expect((await upload(payload)).status).toBe(400);
      expect(fileService.upload).not.toHaveBeenCalled();
    });

    it('accepts a request without data and the text link format', async () => {
      const res = await upload({ submissionId: 'submission-1', files: body.files, linkFormat: 'text' });

      expect(res.status).toBe(200);
      expect(fileService.upload).toHaveBeenCalledWith(tenantId, configuration, 'hr-intake', {
        submissionId: 'submission-1',
        files: body.files,
        linkFormat: 'text',
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
