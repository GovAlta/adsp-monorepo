import { AdspId, adspId, AuditService, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { ServiceRoles } from '../roles';
import { createResourceRouter } from './resource';

// Verifies the responses documented in resource.swagger.yml by sending requests through the resource router as
// mounted in the service (authenticated, then the router, then the error handler).
describe('resource router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const apiId = adspId`urn:ads:platform:directory-service:resource-v1`;
  const resourceUrn = 'urn:ads:platform:file-service:v1:/files/ff118afa-f74e-44ac-8866-7ebd5a43cb4c';
  const encodedUrn = encodeURIComponent(resourceUrn);
  const documented = createDocumentedResponseRecorder(join(__dirname, 'resource.swagger.yml'));

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;
  const directoryMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };
  const eventServiceMock = { send: jest.fn() };
  const auditServiceMock = {
    record: jest.fn().mockResolvedValue({ status: 'recorded' }),
    flush: jest.fn(),
  };
  const repositoryMock = {
    find: jest.fn(),
    getDirectories: jest.fn(),
    exists: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    getTags: jest.fn(),
    getTaggedResources: jest.fn(),
    applyTag: jest.fn(),
    removeTag: jest.fn(),
    deleteTag: jest.fn(),
    getResources: jest.fn(),
    saveResource: jest.fn(),
    deleteResource: jest.fn(),
  };
  const resourceTypeMock = { resolve: jest.fn() };
  const configurationMock = { getResourceType: jest.fn(() => resourceTypeMock) };

  const user = (roles: string[], overrides: Partial<User> = {}) =>
    ({
      id: 'tester',
      name: 'tester',
      tenantId,
      isCore: false,
      roles,
      token: { bearer: 'token' },
      ...overrides,
    }) as User;
  const browser = user([ServiceRoles.ResourceBrowser]);
  const tagger = user([ServiceRoles.ResourceTagger]);
  const admin = user([ServiceRoles.DirectoryAdmin]);
  const plain = user([]);

  const tag = { tenantId, label: 'Priority applications', value: 'priority-applications' };
  const resource = { tenantId, urn: AdspId.parse(resourceUrn), name: 'application-attachment.pdf', type: 'file' };
  const page = { next: 'MTA=', size: 1 };

  function createApp(currentUser: User | null): Express {
    const app = express();
    app.use(documented.middleware);
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = currentUser;
      req.isAuthenticated = (() => !!currentUser) as typeof req.isAuthenticated;
      req.tenant = currentUser?.tenantId ? ({ id: currentUser.tenantId } as typeof req.tenant) : undefined;
      req.getServiceConfiguration = jest.fn().mockResolvedValue(configurationMock) as never;
      next();
    });
    app.use(
      '/resource/v1',
      assertAuthenticatedHandler,
      createResourceRouter({
        apiId,
        logger: loggerMock,
        directory: directoryMock,
        eventService: eventServiceMock,
        auditService: auditServiceMock as unknown as AuditService,
        repository: repositoryMock,
      }),
    );
    app.use(createErrorHandler(loggerMock));
    return app;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await documented.assertDocumented();
  });

  describe('GET /resource/v1/tags', () => {
    it('returns the tags of the tenant', async () => {
      repositoryMock.getTags.mockResolvedValueOnce({ results: [tag], page });

      const res = await request(createApp(browser)).get('/resource/v1/tags').query({ resource: resourceUrn });

      expect(res.status).toBe(200);
      expect(res.body.results[0]).toMatchObject({ value: 'priority-applications' });
      expect(repositoryMock.getTags).toHaveBeenCalledWith(
        10,
        undefined,
        expect.objectContaining({ tenantIdEquals: tenantId }),
      );
    });

    it('returns 400 when top is out of range', async () => {
      const res = await request(createApp(browser)).get('/resource/v1/tags').query({ top: 501 });

      expect(res.status).toBe(400);
    });

    it('returns 401 when the request is not authenticated', async () => {
      const res = await request(createApp(null)).get('/resource/v1/tags');

      expect(res.status).toBe(401);
    });

    it('returns 403 when the user does not have a resource role', async () => {
      const res = await request(createApp(plain)).get('/resource/v1/tags');

      expect(res.status).toBe(403);
    });
  });

  describe('POST /resource/v1/tags', () => {
    const tagRequest = {
      operation: 'tag-resource',
      tag: { label: 'Priority applications' },
      resource: { urn: resourceUrn, name: 'application-attachment.pdf' },
    };

    it('tags the resource', async () => {
      directoryMock.getResourceUrl.mockResolvedValueOnce(new URL('https://file.test.co/file/v1/files/ff118afa'));
      repositoryMock.applyTag.mockResolvedValueOnce({ tag, resource, tagged: true, isNewResource: true });

      const res = await request(createApp(tagger)).post('/resource/v1/tags').send(tagRequest);

      expect(res.status).toBe(200);
      expect(res.body.tagged).toBe(true);
      expect(eventServiceMock.send).toHaveBeenCalled();
    });

    it('untags the resource', async () => {
      directoryMock.getResourceUrl.mockResolvedValueOnce(new URL('https://file.test.co/file/v1/files/ff118afa'));
      repositoryMock.removeTag.mockResolvedValueOnce({ tag, resource, untagged: true });

      const res = await request(createApp(tagger))
        .post('/resource/v1/tags')
        .send({ ...tagRequest, operation: 'untag-resource', tag: { value: 'priority-applications' } });

      expect(res.status).toBe(200);
      expect(res.body.untagged).toBe(true);
    });

    it('returns 400 when the API of the resource is not in the directory', async () => {
      directoryMock.getResourceUrl.mockResolvedValueOnce(null);

      const res = await request(createApp(tagger)).post('/resource/v1/tags').send(tagRequest);

      expect(res.status).toBe(400);
    });

    it('returns 401 when the request is not authenticated', async () => {
      const res = await request(createApp(null)).post('/resource/v1/tags').send(tagRequest);

      expect(res.status).toBe(401);
    });

    it('returns 403 when the user does not have the resource-tagger role', async () => {
      const res = await request(createApp(browser)).post('/resource/v1/tags').send(tagRequest);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /resource/v1/tags/{tag}', () => {
    const path = '/resource/v1/tags/priority-applications';

    it('returns the tag', async () => {
      repositoryMock.getTags.mockResolvedValueOnce({ results: [tag], page });

      const res = await request(createApp(browser)).get(path);

      expect(res.status).toBe(200);
      expect(res.body.urn).toBe(`${apiId}:/tags/priority-applications`);
    });

    it('allows core users with the resource-resolver role', async () => {
      repositoryMock.getTags.mockResolvedValueOnce({ results: [tag], page });

      const res = await request(
        createApp(user([ServiceRoles.ResourceResolver], { isCore: true, tenantId: undefined })),
      ).get(path);

      expect(res.status).toBe(200);
    });

    it('returns 400 when the tag value is not valid', async () => {
      const res = await request(createApp(browser)).get('/resource/v1/tags/Not_Valid');

      expect(res.status).toBe(400);
    });

    it('returns 401 when the request is not authenticated', async () => {
      const res = await request(createApp(null)).get(path);

      expect(res.status).toBe(401);
    });

    it('returns 403 when the user does not have a resource role', async () => {
      const res = await request(createApp(plain)).get(path);

      expect(res.status).toBe(403);
    });

    it('returns 404 when the tag is not found', async () => {
      repositoryMock.getTags.mockResolvedValueOnce({ results: [], page: { size: 0 } });

      const res = await request(createApp(browser)).get(path);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /resource/v1/tags/{tag}', () => {
    const path = '/resource/v1/tags/priority-applications';

    it('deletes the tag', async () => {
      repositoryMock.getTags.mockResolvedValueOnce({ results: [tag], page });
      repositoryMock.deleteTag.mockResolvedValueOnce(true);

      const res = await request(createApp(admin)).delete(path);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: true });
    });

    it('returns 400 when the tag value is not valid', async () => {
      const res = await request(createApp(admin)).delete('/resource/v1/tags/Not_Valid');

      expect(res.status).toBe(400);
    });

    it('returns 401 when the request is not authenticated', async () => {
      const res = await request(createApp(null)).delete(path);

      expect(res.status).toBe(401);
    });

    it('returns 403 when the user does not have the directory-admin role', async () => {
      const res = await request(createApp(tagger)).delete(path);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /resource/v1/tags/{tag}/resources', () => {
    const path = '/resource/v1/tags/priority-applications/resources';

    it('returns the tagged resources with the represented resources', async () => {
      repositoryMock.getTaggedResources.mockResolvedValueOnce({ results: [{ ...resource }], page });
      resourceTypeMock.resolve.mockResolvedValueOnce({ data: { filename: 'application-attachment.pdf' } });

      const res = await request(createApp(browser)).get(path).query({ includeRepresents: true, version: '2' });

      expect(res.status).toBe(200);
      expect(res.body.results[0]._embedded.represents).toEqual({ filename: 'application-attachment.pdf' });
      expect(resourceTypeMock.resolve).toHaveBeenCalledWith('token', expect.anything(), false, { version: '2' });
    });

    it('returns 400 when criteria is not JSON', async () => {
      const res = await request(createApp(browser)).get(path).query({ criteria: 'not-json' });

      expect(res.status).toBe(400);
    });

    it('returns 401 when the request is not authenticated', async () => {
      const res = await request(createApp(null)).get(path);

      expect(res.status).toBe(401);
    });

    it('returns 403 when the user does not have a resource role', async () => {
      const res = await request(createApp(plain)).get(path);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /resource/v1/resources', () => {
    it('returns the resources with their tags', async () => {
      repositoryMock.getResources.mockResolvedValueOnce({ results: [{ ...resource }], page });
      repositoryMock.getTags.mockResolvedValueOnce({ results: [tag], page });

      const res = await request(createApp(browser))
        .get('/resource/v1/resources')
        .query({ includeTags: true, criteria: JSON.stringify({ typeEquals: 'file' }) });

      expect(res.status).toBe(200);
      expect(res.body.results[0]._embedded.tags).toHaveLength(1);
    });

    it('returns the resources with the URNs in the criteria array', async () => {
      repositoryMock.getResources.mockResolvedValueOnce({ results: [{ ...resource }], page });

      const res = await request(createApp(browser))
        .get('/resource/v1/resources')
        .query({ criteria: JSON.stringify([resourceUrn]) });

      expect(res.status).toBe(200);
      expect(res.body.page).toEqual({ size: 1 });
    });

    it('returns 400 when the criteria array has an invalid URN', async () => {
      const res = await request(createApp(browser))
        .get('/resource/v1/resources')
        .query({ criteria: JSON.stringify(['not-a-urn']) });

      expect(res.status).toBe(400);
    });

    it('returns 401 when the request is not authenticated', async () => {
      const res = await request(createApp(null)).get('/resource/v1/resources');

      expect(res.status).toBe(401);
    });

    it('returns 403 for core users', async () => {
      const res = await request(
        createApp(user([ServiceRoles.ResourceBrowser], { isCore: true, tenantId: undefined })),
      ).get('/resource/v1/resources');

      expect(res.status).toBe(403);
    });
  });

  describe('GET /resource/v1/resources/{resource}', () => {
    it('returns the resource', async () => {
      repositoryMock.getResources.mockResolvedValueOnce({ results: [{ ...resource }], page });

      const res = await request(createApp(browser)).get(`/resource/v1/resources/${encodedUrn}`);

      expect(res.status).toBe(200);
      expect(res.body.urn).toBe(resourceUrn);
    });

    it('returns 400 when the resource is not a URN', async () => {
      const res = await request(createApp(browser)).get('/resource/v1/resources/not-a-urn');

      expect(res.status).toBe(400);
    });

    it('returns 401 when the request is not authenticated', async () => {
      const res = await request(createApp(null)).get(`/resource/v1/resources/${encodedUrn}`);

      expect(res.status).toBe(401);
    });

    it('returns 403 when the user does not have a resource role', async () => {
      const res = await request(createApp(plain)).get(`/resource/v1/resources/${encodedUrn}`);

      expect(res.status).toBe(403);
    });

    it('returns 404 when the resource is not found', async () => {
      repositoryMock.getResources.mockResolvedValueOnce({ results: [], page: { size: 0 } });

      const res = await request(createApp(browser)).get(`/resource/v1/resources/${encodedUrn}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /resource/v1/resources/{resource}', () => {
    it('deletes the resource', async () => {
      repositoryMock.getResources.mockResolvedValueOnce({ results: [{ ...resource }], page });
      repositoryMock.deleteResource.mockResolvedValueOnce(true);

      const res = await request(createApp(admin)).delete(`/resource/v1/resources/${encodedUrn}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: true });
    });

    it('returns 400 when the resource is not a URN', async () => {
      const res = await request(createApp(admin)).delete('/resource/v1/resources/not-a-urn');

      expect(res.status).toBe(400);
    });

    it('returns 401 when the request is not authenticated', async () => {
      const res = await request(createApp(null)).delete(`/resource/v1/resources/${encodedUrn}`);

      expect(res.status).toBe(401);
    });

    it('returns 403 when the user does not have the directory-admin role', async () => {
      const res = await request(createApp(browser)).delete(`/resource/v1/resources/${encodedUrn}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /resource/v1/resources/{resource}/tags', () => {
    it('returns the tags of the resource', async () => {
      repositoryMock.getTags.mockResolvedValueOnce({ results: [tag], page });

      const res = await request(createApp(tagger)).get(`/resource/v1/resources/${encodedUrn}/tags`);

      expect(res.status).toBe(200);
      expect(res.body.results).toHaveLength(1);
    });

    it('returns 400 when the resource is not a URN', async () => {
      const res = await request(createApp(tagger)).get('/resource/v1/resources/not-a-urn/tags');

      expect(res.status).toBe(400);
    });

    it('returns 401 when the request is not authenticated', async () => {
      const res = await request(createApp(null)).get(`/resource/v1/resources/${encodedUrn}/tags`);

      expect(res.status).toBe(401);
    });

    it('returns 403 when the user does not have a resource role', async () => {
      const res = await request(createApp(plain)).get(`/resource/v1/resources/${encodedUrn}/tags`);

      expect(res.status).toBe(403);
    });
  });
});
