import { AdspId, adspId, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { TopicTypeEntity } from '../model';
import { ExportServiceRoles, ServiceRoles } from '../roles';
import { createCommentRouter } from './comment';

// Verifies the roles and error responses documented in comment.swagger.yml by sending requests through the router as
// mounted in the service (authenticated, tenant resolved, then the router, then the error handler).
describe('comment router documented behaviour', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const documented = createDocumentedResponseRecorder(join(__dirname, 'comment.swagger.yml'));

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const repositoryMock = {
    getTopic: jest.fn(),
    getTopics: jest.fn(),
    countTopics: jest.fn(),
    countTopicsByType: jest.fn(),
    getComment: jest.fn(),
    getComments: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    saveComment: jest.fn(),
    deleteComment: jest.fn(),
  };

  const user = (id: string, roles: string[], overrides: Partial<User> = {}) =>
    ({ id, name: id, email: `${id}@test.co`, tenantId, isCore: false, roles, ...overrides }) as User;
  const admin = user('admin', [ServiceRoles.Admin]);
  const exporter = user('exporter', [ExportServiceRoles.ExportJob]);
  const auditor = user('auditor', ['case-auditor']);
  const plain = user('plain', []);
  const coreAdmin = user('core-admin', [ServiceRoles.Admin], { tenantId: undefined, isCore: true });

  const types = {
    'case-notes': new TopicTypeEntity(tenantId, {
      id: 'case-notes',
      name: 'Case notes',
      adminRoles: ['case-supervisor'],
      readerRoles: ['case-auditor'],
      commenterRoles: ['case-worker'],
    }),
  };

  function createApp(currentUser: User | null): Express {
    const server = express();
    server.use(documented.middleware);
    server.use((req, _res, next) => {
      req.user = currentUser;
      req.isAuthenticated = (() => !!currentUser) as typeof req.isAuthenticated;
      req.getConfiguration = jest.fn().mockResolvedValue(types);
      // Resolves the tenant the way the SDK tenantHandler does.
      try {
        const { tenantId: tenantIdValue } = req.query;
        const id = currentUser?.isCore && tenantIdValue ? AdspId.parse(tenantIdValue as string) : currentUser?.tenantId;
        req.tenant = id ? ({ id } as typeof req.tenant) : undefined;
        next();
      } catch (err) {
        next(err);
      }
    });
    server.use('/comment/v1', assertAuthenticatedHandler, createCommentRouter({ repository: repositoryMock }));
    server.use(createErrorHandler(loggerMock));
    return server;
  }

  afterEach(async () => {
    await documented.assertDocumented();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repositoryMock.getComments.mockResolvedValue({ results: [], page: { size: 0 } });
  });

  it('searches comments of the tenant for a comment admin', async () => {
    const res = await request(createApp(admin))
      .get('/comment/v1/comments')
      .query({ top: 20, criteria: JSON.stringify({ titleOrContentLike: 'address' }) });
    expect(res.status).toBe(200);
    expect(repositoryMock.getComments).toHaveBeenCalledWith(20, undefined, {
      titleOrContentLike: 'address',
      tenantIdEquals: tenantId,
    });
  });

  it('searches comments for an export job', async () => {
    const res = await request(createApp(exporter)).get('/comment/v1/comments');
    expect(res.status).toBe(200);
  });

  it('searches comments of a topic type for a reader of the type', async () => {
    const res = await request(createApp(auditor))
      .get('/comment/v1/comments')
      .query({ criteria: JSON.stringify({ typeIdEquals: 'case-notes' }) });
    expect(res.status).toBe(200);
  });

  it('responds 400 for a core user with an invalid tenantId', async () => {
    const res = await request(createApp(coreAdmin)).get('/comment/v1/comments').query({ tenantId: 'test' });
    expect(res.status).toBe(400);
  });

  it('responds 401 when there is no authenticated user', async () => {
    const res = await request(createApp(null)).get('/comment/v1/comments');
    expect(res.status).toBe(401);
  });

  it('responds 403 without type criteria for a user without the comment-admin or export-job role', async () => {
    const res = await request(createApp(auditor)).get('/comment/v1/comments');
    expect(res.status).toBe(403);
  });

  it('responds 403 for a core comment admin', async () => {
    const res = await request(createApp(coreAdmin))
      .get('/comment/v1/comments')
      .query({ tenantId: tenantId.toString() });
    expect(res.status).toBe(403);
  });

  it('responds 403 with type criteria for a user who cannot read the type', async () => {
    const res = await request(createApp(plain))
      .get('/comment/v1/comments')
      .query({ criteria: JSON.stringify({ typeIdEquals: 'case-notes' }) });
    expect(res.status).toBe(403);
  });

  it('responds 404 for an unknown topic type', async () => {
    const res = await request(createApp(admin))
      .get('/comment/v1/comments')
      .query({ criteria: JSON.stringify({ typeIdEquals: 'unknown' }) });
    expect(res.status).toBe(404);
  });
});
