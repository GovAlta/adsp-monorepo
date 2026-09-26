import { adspId, AdspId, User } from '@abgov/adsp-service-sdk';
import { AjvValidationService, createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { ConfigurationEntity } from '../model';
import { ConfigurationServiceRoles, DirectoryServiceRoles, ExportServiceRoles } from '../roles';
import { createConfigurationRouter } from './configuration';

// Verifies the request validation, roles, and error responses documented in configuration.swagger.yml by sending
// requests through the router with the real error handler.
describe('configuration router documented behaviour', () => {
  const serviceId = adspId`urn:ads:platform:configuration-service`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const documented = createDocumentedResponseRecorder(join(__dirname, 'configuration.swagger.yml'));

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const repositoryMock = {
    find: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    getRevisions: jest.fn(),
    saveRevision: jest.fn(),
    getActiveRevision: jest.fn(),
    setActiveRevision: jest.fn(),
  };
  const eventServiceMock = { send: jest.fn() };
  const validationService = new AjvValidationService(loggerMock);

  // Definitions registered in the core configuration of the configuration service.
  const definitions = {
    'app:public-settings': { anonymousRead: true, configurationSchema: { type: 'object' } },
    'app:settings': {
      configurationSchema: {
        type: 'object',
        properties: { theme: { type: 'string' } },
        additionalProperties: false,
      },
    },
  };

  const entity = <C>(namespace: string, name: string, configuration: C, entityTenantId?: AdspId) =>
    new ConfigurationEntity(
      namespace,
      name,
      loggerMock,
      repositoryMock as never,
      validationService,
      { revision: 1, created: new Date(), lastUpdated: new Date(), configuration },
      entityTenantId,
      definitions[`${namespace}:${name}`],
    );

  const user = (id: string, roles: string[], overrides: Partial<User> = {}) =>
    ({ id, name: id, tenantId, isCore: false, roles, ...overrides }) as User;
  const admin = user('admin', [ConfigurationServiceRoles.ConfigurationAdmin]);
  const configuredService = user('service', [ConfigurationServiceRoles.ConfiguredService]);
  const reader = user('reader', [ConfigurationServiceRoles.Reader]);
  const plain = user('plain', []);

  function createApp(currentUser: User | null): Express {
    const app = express();
    app.use(documented.middleware);
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = currentUser;
      // Passport always sets isAuthenticated on the request, including for anonymous requests.
      req.isAuthenticated = (() => !!currentUser) as typeof req.isAuthenticated;
      req.tenant = currentUser ? ({ id: tenantId } as typeof req.tenant) : undefined;
      next();
    });
    app.use(
      '/configuration/v2',
      createConfigurationRouter({
        serviceId,
        logger: loggerMock,
        eventService: eventServiceMock,
        configuration: repositoryMock as never,
      } as never),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  afterEach(async () => {
    await documented.assertDocumented();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repositoryMock.get.mockImplementation((namespace: string, name: string, getTenantId?: AdspId) =>
      Promise.resolve(
        namespace === serviceId.namespace && name === serviceId.service
          ? entity(namespace, name, getTenantId ? {} : definitions)
          : entity(namespace, name, { theme: 'dark' }, getTenantId),
      ),
    );
    repositoryMock.find.mockResolvedValue({ results: [], page: { size: 0 } });
    repositoryMock.getRevisions.mockResolvedValue({ results: [], page: { size: 0 } });
    repositoryMock.saveRevision.mockImplementation((_entity, revision) => Promise.resolve(revision));
    repositoryMock.getActiveRevision.mockResolvedValue(null);
    repositoryMock.setActiveRevision.mockImplementation((_entity, revision) =>
      Promise.resolve({ revision, configuration: {} }),
    );
    repositoryMock.delete.mockResolvedValue(true);
  });

  describe('GET /configuration/:namespace', () => {
    it.each([
      ['configuration-admin', admin],
      ['configured-service', configuredService],
      ['export-job', user('export', [ExportServiceRoles.ExportJob])],
    ])('allows the %s role and defaults top to 10', async (_role, currentUser) => {
      const res = await request(createApp(currentUser)).get('/configuration/v2/configuration/app');
      expect(res.status).toBe(200);
      expect(repositoryMock.find).toHaveBeenCalledWith(
        expect.objectContaining({ namespaceEquals: 'app', tenantIdEquals: tenantId }),
        10,
        undefined,
      );
    });

    it('responds 403 for the configuration-reader role', async () => {
      const res = await request(createApp(reader)).get('/configuration/v2/configuration/app');
      expect(res.status).toBe(403);
    });

    it.each(['top=0', 'top=1001', 'includeActive=yes', 'criteria=not-json'])('responds 400 for %s', async (query) => {
      const res = await request(createApp(admin)).get(`/configuration/v2/configuration/app?${query}`);
      expect(res.status).toBe(400);
    });

    it('accepts top=1000', async () => {
      const res = await request(createApp(admin)).get('/configuration/v2/configuration/app?top=1000');
      expect(res.status).toBe(200);
    });

    it('responds 400 for a namespace with invalid characters', async () => {
      const res = await request(createApp(admin)).get('/configuration/v2/configuration/app.settings');
      expect(res.status).toBe(400);
    });

    it('responds 401 without an authenticated user', async () => {
      const res = await request(createApp(null)).get('/configuration/v2/configuration/app');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /configuration/:namespace/:name', () => {
    it.each([
      ['configuration-reader', reader],
      ['configuration-admin', admin],
      ['configured-service', configuredService],
      ['resource-resolver', user('resolver', [DirectoryServiceRoles.ResourceResolver])],
      ['export-job', user('export', [ExportServiceRoles.ExportJob])],
    ])('allows the %s role', async (_role, currentUser) => {
      const res = await request(createApp(currentUser)).get('/configuration/v2/configuration/app/settings');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ namespace: 'app', name: 'settings', active: null });
    });

    it('responds 403 without a configuration role', async () => {
      const res = await request(createApp(plain)).get('/configuration/v2/configuration/app/settings');
      expect(res.status).toBe(403);
    });

    it('reads core configuration with the core query parameter', async () => {
      await request(createApp(admin)).get('/configuration/v2/configuration/app/settings?core');
      expect(repositoryMock.get).toHaveBeenLastCalledWith('app', 'settings', null, expect.anything());
    });

    it('responds 400 for a name longer than 50 characters', async () => {
      const res = await request(createApp(admin)).get(`/configuration/v2/configuration/app/${'a'.repeat(51)}`);
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /configuration/:namespace/:name', () => {
    it.each([
      ['configuration-admin', admin],
      ['configured-service', configuredService],
    ])('allows the %s role to update the latest revision without creating a revision', async (_role, currentUser) => {
      const res = await request(createApp(currentUser))
        .patch('/configuration/v2/configuration/app/settings')
        .send({ operation: 'UPDATE', update: { theme: 'light' } });
      expect(res.status).toBe(200);
      expect(res.body.latest).toMatchObject({ revision: 1, configuration: { theme: 'light' } });
    });

    it('responds 403 for the configuration-reader role', async () => {
      const res = await request(createApp(reader))
        .patch('/configuration/v2/configuration/app/settings')
        .send({ operation: 'REPLACE', configuration: { theme: 'light' } });
      expect(res.status).toBe(403);
    });

    it('responds 400 when the result does not match the definition schema', async () => {
      const res = await request(createApp(admin))
        .patch('/configuration/v2/configuration/app/settings')
        .send({ operation: 'UPDATE', update: { unexpected: true } });
      expect(res.status).toBe(400);
      expect(repositoryMock.saveRevision).not.toHaveBeenCalled();
    });

    it.each([
      ['an unrecognized operation', { operation: 'MERGE' }],
      ['REPLACE without configuration', { operation: 'REPLACE' }],
      ['UPDATE without update', { operation: 'UPDATE' }],
      ['DELETE without property', { operation: 'DELETE' }],
    ])('responds 400 for %s', async (_case, body) => {
      const res = await request(createApp(admin)).patch('/configuration/v2/configuration/app/settings').send(body);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /configuration/:namespace/:name', () => {
    it('allows the configuration-admin role to create a revision', async () => {
      const res = await request(createApp(admin))
        .post('/configuration/v2/configuration/app/settings')
        .send({ operation: 'CREATE-REVISION' });
      expect(res.status).toBe(200);
      expect(res.body.latest.revision).toBe(2);
    });

    it('allows the configuration-admin role to set the active revision', async () => {
      const res = await request(createApp(admin))
        .post('/configuration/v2/configuration/app/settings')
        .send({ operation: 'SET-ACTIVE-REVISION', revision: 1 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ namespace: 'app', name: 'settings', active: 1 });
    });

    it.each(['CREATE-REVISION', 'SET-ACTIVE-REVISION'])(
      'responds 403 for the configured-service role with %s',
      async (operation) => {
        const res = await request(createApp(configuredService))
          .post('/configuration/v2/configuration/app/settings')
          .send({ operation, revision: 1 });
        expect(res.status).toBe(403);
      },
    );

    it.each([
      ['an unrecognized operation', { operation: 'DELETE' }],
      ['SET-ACTIVE-REVISION without revision', { operation: 'SET-ACTIVE-REVISION' }],
      ['a revision that is not a number', { operation: 'SET-ACTIVE-REVISION', revision: 'one' }],
    ])('responds 400 for %s', async (_case, body) => {
      const res = await request(createApp(admin)).post('/configuration/v2/configuration/app/settings').send(body);
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /configuration/:namespace/:name', () => {
    it('allows the configuration-admin role', async () => {
      const res = await request(createApp(admin)).delete('/configuration/v2/configuration/app/settings');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: true });
    });

    it('responds 403 for the configured-service role', async () => {
      const res = await request(createApp(configuredService)).delete('/configuration/v2/configuration/app/settings');
      expect(res.status).toBe(403);
      expect(repositoryMock.delete).not.toHaveBeenCalled();
    });
  });

  describe.each(['active', 'latest'])('GET /configuration/:namespace/:name/%s', (path) => {
    it('allows the configuration-reader role', async () => {
      const res = await request(createApp(reader)).get(`/configuration/v2/configuration/app/settings/${path}`);
      expect(res.status).toBe(200);
    });

    it('responds 403 without a configuration role', async () => {
      const res = await request(createApp(plain)).get(`/configuration/v2/configuration/app/settings/${path}`);
      expect(res.status).toBe(403);
    });

    it('allows an anonymous request for a definition with anonymousRead, using the tenant query parameter', async () => {
      const res = await request(createApp(null)).get(
        `/configuration/v2/configuration/app/public-settings/${path}?tenant=${encodeURIComponent(tenantId.toString())}`,
      );
      expect(res.status).toBe(200);
      const [namespace, name, getTenantId] = repositoryMock.get.mock.calls.at(-1);
      expect([namespace, name, getTenantId?.toString()]).toEqual(['app', 'public-settings', tenantId.toString()]);
    });

    it('responds 401 for an anonymous request for a definition without anonymousRead', async () => {
      const res = await request(createApp(null)).get(
        `/configuration/v2/configuration/app/settings/${path}?tenant=${encodeURIComponent(tenantId.toString())}`,
      );
      expect(res.status).toBe(401);
    });
  });

  describe('GET /configuration/:namespace/:name/active', () => {
    it('responds with an empty body when there is no active revision', async () => {
      const res = await request(createApp(reader)).get('/configuration/v2/configuration/app/settings/active');
      expect(res.status).toBe(200);
      expect(res.text).toBe('');
    });

    it('responds with the latest revision with orLatest when there is no active revision', async () => {
      const res = await request(createApp(reader)).get(
        '/configuration/v2/configuration/app/settings/active?orLatest=true',
      );
      expect(res.body).toMatchObject({ revision: 1, configuration: { theme: 'dark' } });
    });
  });

  describe('GET /configuration/:namespace/:name/latest', () => {
    it('responds with the configuration of the latest revision', async () => {
      const res = await request(createApp(reader)).get('/configuration/v2/configuration/app/settings/latest');
      expect(res.body).toEqual({ theme: 'dark' });
    });

    it('responds with an empty object when there is no configuration', async () => {
      repositoryMock.get.mockImplementation((namespace: string, name: string, getTenantId?: AdspId) =>
        Promise.resolve(
          namespace === serviceId.namespace
            ? entity(namespace, name, definitions)
            : new ConfigurationEntity(
                namespace,
                name,
                loggerMock,
                repositoryMock as never,
                validationService,
                null,
                getTenantId,
              ),
        ),
      );
      const res = await request(createApp(reader)).get('/configuration/v2/configuration/app/settings/latest');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({});
    });
  });

  describe('GET /configuration/:namespace/:name/revisions', () => {
    it('defaults top to 10', async () => {
      const res = await request(createApp(reader)).get('/configuration/v2/configuration/app/settings/revisions');
      expect(res.status).toBe(200);
      expect(repositoryMock.getRevisions).toHaveBeenCalledWith(expect.anything(), 10, null, {});
    });

    it.each(['top=0', 'top=5001', 'criteria=not-json', 'after=not-a-cursor'])('responds 400 for %s', async (query) => {
      const res = await request(createApp(reader)).get(
        `/configuration/v2/configuration/app/settings/revisions?${query}`,
      );
      expect(res.status).toBe(400);
    });

    it('responds 403 without a configuration role', async () => {
      const res = await request(createApp(plain)).get('/configuration/v2/configuration/app/settings/revisions');
      expect(res.status).toBe(403);
    });
  });

  describe('GET /configuration/:namespace/:name/revisions/:revision', () => {
    it('responds with the configuration of the revision', async () => {
      repositoryMock.getRevisions.mockResolvedValueOnce({
        results: [{ revision: 0, configuration: { theme: 'light' } }],
      });
      const res = await request(createApp(reader)).get('/configuration/v2/configuration/app/settings/revisions/0');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ theme: 'light' });
    });

    it('responds 404 for an unknown revision', async () => {
      const res = await request(createApp(reader)).get('/configuration/v2/configuration/app/settings/revisions/9');
      expect(res.status).toBe(404);
    });

    it.each(['-1', 'one'])('responds 400 for revision %s', async (revision) => {
      const res = await request(createApp(reader)).get(
        `/configuration/v2/configuration/app/settings/revisions/${revision}`,
      );
      expect(res.status).toBe(400);
    });
  });
});
