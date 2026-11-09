import { AdspId, adspId, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import axios from 'axios';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { TopicEntity, TopicTypeEntity } from '../model';
import { ServiceRoles } from '../roles';
import { Comment } from '../types';
import { createTopicRouter } from './topic';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

// Verifies the request validation, roles, and error responses documented in topic.swagger.yml by sending requests
// through the router as mounted in the service (authenticated, tenant resolved, then the router, then the error
// handler).
describe('topic router documented behaviour', () => {
  const apiId = adspId`urn:ads:platform:comment-service:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const documented = createDocumentedResponseRecorder(join(__dirname, 'topic.swagger.yml'));

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
  const eventServiceMock = { send: jest.fn() };
  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('https://configuration-service/configuration/v2'))),
    getResourceUrl: jest.fn(),
  };
  const tokenProviderMock = { getAccessToken: jest.fn(() => Promise.resolve('token')) };
  const clientMock = { getTenantConfiguration: jest.fn(), getCoreConfiguration: jest.fn() };

  const user = (id: string, roles: string[], overrides: Partial<User> = {}) =>
    ({ id, name: id, email: `${id}@test.co`, tenantId, isCore: false, roles, ...overrides }) as User;
  const setter = user('setter', [ServiceRoles.TopicSetter]);
  const coreSetter = user('core-setter', [ServiceRoles.TopicSetter], { tenantId: undefined, isCore: true });
  const supervisor = user('supervisor', ['case-supervisor']);
  const worker = user('worker', ['case-worker']);
  const otherWorker = user('other-worker', ['case-worker']);
  const auditor = user('auditor', ['case-auditor']);
  const plain = user('plain', []);

  const caseNotes = new TopicTypeEntity(tenantId, {
    id: 'case-notes',
    name: 'Case notes',
    adminRoles: ['case-supervisor'],
    readerRoles: ['case-auditor'],
    commenterRoles: ['case-worker'],
    securityClassification: 'protected b',
  });
  const types = { 'case-notes': caseNotes };

  let topic: TopicEntity;
  let comment: Comment;

  function createApp(currentUser: User | null): Express {
    const server = express();
    server.use(documented.middleware);
    server.use(express.json());
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
    server.use(
      '/comment/v1',
      assertAuthenticatedHandler,
      createTopicRouter({
        apiId,
        logger: loggerMock,
        eventService: eventServiceMock,
        repository: repositoryMock,
        directory: directoryMock,
        tokenProvider: tokenProviderMock,
        client: clientMock as never,
      }),
    );
    server.use(createErrorHandler(loggerMock));
    return server;
  }

  afterEach(async () => {
    await documented.assertDocumented();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    topic = new TopicEntity(repositoryMock, caseNotes, {
      tenantId,
      id: 42,
      name: 'Comments on case-123',
      description: 'Notes about the case.',
      resourceId: 'urn:ads:demo:case-service:v1:/cases/case-123',
      securityClassification: 'protected b',
      commenters: [],
      requiresAttention: false,
    });
    comment = {
      topicId: 42,
      id: 1203,
      title: 'Follow up call',
      content: 'Called the applicant.',
      context: {},
      createdBy: { id: worker.id, name: worker.name },
      createdOn: new Date('2026-11-02T16:20:00Z'),
      lastUpdatedBy: { id: worker.id, name: worker.name },
      lastUpdatedOn: new Date('2026-11-02T16:20:00Z'),
    };

    clientMock.getTenantConfiguration.mockResolvedValue(types);
    clientMock.getCoreConfiguration.mockResolvedValue({});
    axiosMock.patch.mockResolvedValue({ data: {} });
    repositoryMock.getTopic.mockImplementation((_types, id: number) => Promise.resolve(id === 42 ? topic : null));
    repositoryMock.getTopics.mockResolvedValue({ results: [topic], page: { size: 1 } });
    repositoryMock.countTopicsByType.mockResolvedValue(0);
    repositoryMock.save.mockImplementation((entity: TopicEntity) => {
      entity.id = entity.id || 43;
      return Promise.resolve(entity);
    });
    repositoryMock.delete.mockResolvedValue(true);
    repositoryMock.getComment.mockImplementation((_topic, id: number) => Promise.resolve(id === 1203 ? comment : null));
    repositoryMock.getComments.mockResolvedValue({ results: [comment], page: { size: 1 } });
    repositoryMock.saveComment.mockImplementation((_topic, value: Comment) => Promise.resolve({ ...value, id: 1203 }));
    repositoryMock.deleteComment.mockResolvedValue(true);
  });

  describe('topic types', () => {
    it('lists tenant and core types for a topic setter', async () => {
      const res = await request(createApp(setter)).get('/comment/v1/topic-types');
      expect(res.status).toBe(200);
      expect(Object.keys(res.body.tenant)).toEqual(['case-notes']);
      expect(res.body.core).toEqual({});
    });

    it('lists types for a core topic setter acting on a tenant', async () => {
      const res = await request(createApp(coreSetter))
        .get('/comment/v1/topic-types')
        .query({ tenantId: tenantId.toString() });
      expect(res.status).toBe(200);
      expect(clientMock.getTenantConfiguration.mock.calls[0][0].toString()).toBe(tenantId.toString());
    });

    it('responds 400 for a core user with an invalid tenantId', async () => {
      const res = await request(createApp(coreSetter)).get('/comment/v1/topic-types').query({ tenantId: 'test' });
      expect(res.status).toBe(400);
    });

    it('responds 401 when there is no authenticated user', async () => {
      const res = await request(createApp(null)).get('/comment/v1/topic-types');
      expect(res.status).toBe(401);
    });

    it('responds 403 without the comment-admin or topic-setter role', async () => {
      const res = await request(createApp(supervisor)).get('/comment/v1/topic-types');
      expect(res.status).toBe(403);
    });

    it('creates a type with writeRoles saved as commenterRoles', async () => {
      const created = {
        id: 'incident-notes',
        name: 'Incident notes',
        adminRoles: [],
        readerRoles: [],
        commenterRoles: ['case-worker'],
      };
      clientMock.getTenantConfiguration.mockResolvedValueOnce({ ...types, 'incident-notes': created });
      const res = await request(createApp(setter))
        .post('/comment/v1/topic-types')
        .send({ id: 'incident-notes', name: 'Incident notes', writeRoles: ['case-worker'] });
      expect(res.status).toBe(200);
      expect(axiosMock.patch.mock.calls[0][1]).toEqual({
        operation: 'UPDATE',
        update: { 'incident-notes': { ...created } },
      });
    });

    it('responds 400 on create for an invalid ID', async () => {
      const res = await request(createApp(setter)).post('/comment/v1/topic-types').send({ id: 'bad/id', name: 'Bad' });
      expect(res.status).toBe(400);
    });

    it('responds 400 on create for a malformed body', async () => {
      const res = await request(createApp(setter))
        .post('/comment/v1/topic-types')
        .set('Content-Type', 'application/json')
        .send('{"id":');
      expect(res.status).toBe(400);
    });

    it('responds 401 on create when there is no authenticated user', async () => {
      const res = await request(createApp(null)).post('/comment/v1/topic-types').send({ id: 'a', name: 'A' });
      expect(res.status).toBe(401);
    });

    it('responds 403 on create without the comment-admin or topic-setter role', async () => {
      const res = await request(createApp(plain)).post('/comment/v1/topic-types').send({ id: 'a', name: 'A' });
      expect(res.status).toBe(403);
    });

    it.each([
      ['ID', { id: 'case-notes', name: 'Other name' }],
      ['name', { id: 'other-id', name: 'Case notes' }],
    ])('responds 409 on create for an existing %s', async (_, body) => {
      const res = await request(createApp(setter)).post('/comment/v1/topic-types').send(body);
      expect(res.status).toBe(409);
      expect(axiosMock.patch).not.toHaveBeenCalled();
    });

    it('gets a tenant type', async () => {
      const res = await request(createApp(setter)).get('/comment/v1/topic-types/case-notes');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 'case-notes', commenterRoles: ['case-worker'] });
    });

    it.each([
      ['get', 'get'],
      ['update', 'patch'],
      ['delete', 'delete'],
    ])('responds 400 on %s for an invalid type ID', async (_, method) => {
      const res = await request(createApp(setter))[method]('/comment/v1/topic-types/bad!id').send({});
      expect(res.status).toBe(400);
    });

    it.each([
      ['get', 'get'],
      ['update', 'patch'],
      ['delete', 'delete'],
    ])('responds 401 on %s when there is no authenticated user', async (_, method) => {
      const res = await request(createApp(null))[method]('/comment/v1/topic-types/case-notes').send({});
      expect(res.status).toBe(401);
    });

    it.each([
      ['get', 'get'],
      ['update', 'patch'],
      ['delete', 'delete'],
    ])('responds 403 on %s without the comment-admin or topic-setter role', async (_, method) => {
      const res = await request(createApp(worker))[method]('/comment/v1/topic-types/case-notes').send({});
      expect(res.status).toBe(403);
    });

    it.each([
      ['get', 'get'],
      ['update', 'patch'],
      ['delete', 'delete'],
    ])('responds 404 on %s for a type the tenant does not have', async (_, method) => {
      const res = await request(createApp(setter))[method]('/comment/v1/topic-types/unknown').send({});
      expect(res.status).toBe(404);
    });

    it('updates a type, keeping properties not in the request', async () => {
      const res = await request(createApp(setter))
        .patch('/comment/v1/topic-types/case-notes')
        .send({ commenterRoles: ['case-worker', 'case-intake'] });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        name: 'Case notes',
        adminRoles: ['case-supervisor'],
        commenterRoles: ['case-worker', 'case-intake'],
      });
    });

    it('responds 400 on update for an invalid security classification', async () => {
      const res = await request(createApp(setter))
        .patch('/comment/v1/topic-types/case-notes')
        .send({ securityClassification: 'secret' });
      expect(res.status).toBe(400);
    });

    it('deletes a type with no topics', async () => {
      const res = await request(createApp(setter)).delete('/comment/v1/topic-types/case-notes');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: true, id: 'case-notes' });
    });

    it('responds 409 on delete while topics of the type exist', async () => {
      repositoryMock.countTopicsByType.mockResolvedValueOnce(3);
      const res = await request(createApp(setter)).delete('/comment/v1/topic-types/case-notes');
      expect(res.status).toBe(409);
      expect(res.body.topics).toBe(3);
    });
  });

  describe('topics', () => {
    it('lists only the topics the user can read', async () => {
      const res = await request(createApp(plain)).get('/comment/v1/topics');
      expect(res.status).toBe(200);
      expect(res.body.results).toEqual([]);
    });

    it('lists readable topics with criteria', async () => {
      const res = await request(createApp(auditor))
        .get('/comment/v1/topics')
        .query({ top: 5, criteria: JSON.stringify({ typeIdEquals: 'case-notes' }) });
      expect(res.status).toBe(200);
      expect(res.body.results[0]).toMatchObject({ id: 42, urn: 'urn:ads:platform:comment-service:v1:/topics/42' });
      expect(repositoryMock.getTopics).toHaveBeenCalledWith(types, 5, undefined, {
        typeIdEquals: 'case-notes',
        tenantIdEquals: tenantId,
      });
    });

    it.each([{ top: 0 }, { top: 5001 }, { after: 'not-a-cursor' }])('responds 400 on list for %p', async (query) => {
      const res = await request(createApp(auditor)).get('/comment/v1/topics').query(query);
      expect(res.status).toBe(400);
    });

    it('responds 401 on list when there is no authenticated user', async () => {
      const res = await request(createApp(null)).get('/comment/v1/topics');
      expect(res.status).toBe(401);
    });

    it('creates a topic with the security classification of its type', async () => {
      const res = await request(createApp(setter))
        .post('/comment/v1/topics')
        .send({ typeId: 'case-notes', name: 'Comments on case-124', securityClassification: 'public' });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 43, securityClassification: 'protected b' });
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'topic-created' }));
    });

    it('responds 400 on create without a name', async () => {
      const res = await request(createApp(setter)).post('/comment/v1/topics').send({ typeId: 'case-notes' });
      expect(res.status).toBe(400);
    });

    it('responds 401 on create when there is no authenticated user', async () => {
      const res = await request(createApp(null)).post('/comment/v1/topics').send({ typeId: 'case-notes', name: 'A' });
      expect(res.status).toBe(401);
    });

    it('responds 403 on create without the comment-admin or topic-setter role', async () => {
      const res = await request(createApp(supervisor))
        .post('/comment/v1/topics')
        .send({ typeId: 'case-notes', name: 'A' });
      expect(res.status).toBe(403);
    });

    it('responds 404 on create for an unknown topic type', async () => {
      const res = await request(createApp(setter)).post('/comment/v1/topics').send({ typeId: 'unknown', name: 'A' });
      expect(res.status).toBe(404);
    });

    it('gets a topic for a reader', async () => {
      const res = await request(createApp(auditor)).get('/comment/v1/topics/42');
      expect(res.status).toBe(200);
      expect(res.body.type).toMatchObject({ id: 'case-notes' });
    });

    it('gets a topic for the directory service resource resolver', async () => {
      const resolver = user('resolver', ['urn:ads:platform:directory-service:resource-resolver'], {
        tenantId: undefined,
        isCore: true,
      });
      const res = await request(createApp(resolver))
        .get('/comment/v1/topics/42')
        .query({ tenantId: tenantId.toString() });
      expect(res.status).toBe(200);
    });

    it('updates a topic for a topic setter', async () => {
      const res = await request(createApp(setter))
        .patch('/comment/v1/topics/42')
        .send({ commenters: ['3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'] });
      expect(res.status).toBe(200);
      expect(res.body.commenters).toEqual(['3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d']);
    });

    it('deletes a topic for a topic setter', async () => {
      const res = await request(createApp(setter)).delete('/comment/v1/topics/42');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: true });
    });

    it.each(['get', 'patch', 'delete'])('responds 400 on %s for a non-integer topic ID', async (method) => {
      const res = await request(createApp(setter))[method]('/comment/v1/topics/abc').send({});
      expect(res.status).toBe(400);
    });

    it('responds 400 on update for a name that is too long', async () => {
      const res = await request(createApp(setter))
        .patch('/comment/v1/topics/42')
        .send({ name: 'x'.repeat(51) });
      expect(res.status).toBe(400);
    });

    it.each(['get', 'patch', 'delete'])('responds 401 on %s when there is no authenticated user', async (method) => {
      const res = await request(createApp(null))[method]('/comment/v1/topics/42').send({});
      expect(res.status).toBe(401);
    });

    it('responds 403 on get for a user who cannot read the topic', async () => {
      const res = await request(createApp(plain)).get('/comment/v1/topics/42');
      expect(res.status).toBe(403);
    });

    it.each(['patch', 'delete'])('responds 403 on %s for a reader without the topic-setter role', async (method) => {
      const res = await request(createApp(supervisor))[method]('/comment/v1/topics/42').send({});
      expect(res.status).toBe(403);
    });

    it.each(['get', 'patch', 'delete'])('responds 404 on %s for a topic not in the tenant', async (method) => {
      const res = await request(createApp(setter))[method]('/comment/v1/topics/7').send({});
      expect(res.status).toBe(404);
    });
  });

  describe('topic comments', () => {
    it('lists comments for a reader', async () => {
      const res = await request(createApp(auditor))
        .get('/comment/v1/topics/42/comments')
        .query({ top: 20, criteria: JSON.stringify({ idGreaterThan: 1200 }) });
      expect(res.status).toBe(200);
      expect(res.body.results[0]).toMatchObject({ id: 1203 });
    });

    it('responds 400 on list for an invalid top', async () => {
      const res = await request(createApp(auditor)).get('/comment/v1/topics/42/comments').query({ top: 0 });
      expect(res.status).toBe(400);
    });

    it('posts a comment for a commenter', async () => {
      const res = await request(createApp(worker))
        .post('/comment/v1/topics/42/comments')
        .send({ title: 'Follow up call', content: 'Called the applicant.', requiresAttention: true });
      expect(res.status).toBe(200);
      expect(topic.requiresAttention).toBe(true);
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'comment-created' }));
    });

    it('responds 400 on post without content', async () => {
      const res = await request(createApp(worker)).post('/comment/v1/topics/42/comments').send({ title: 'Empty' });
      expect(res.status).toBe(400);
    });

    it('responds 403 on post for a reader', async () => {
      const res = await request(createApp(auditor)).post('/comment/v1/topics/42/comments').send({ content: 'Hi' });
      expect(res.status).toBe(403);
    });

    it('gets a comment for a reader', async () => {
      const res = await request(createApp(auditor)).get('/comment/v1/topics/42/comments/1203');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 1203, createdBy: { id: worker.id } });
    });

    it('updates a comment for its author', async () => {
      const res = await request(createApp(worker))
        .patch('/comment/v1/topics/42/comments/1203')
        .send({ content: 'Called the applicant again.' });
      expect(res.status).toBe(200);
      expect(res.body.content).toBe('Called the applicant again.');
    });

    it('deletes a comment for a topic type administrator', async () => {
      const res = await request(createApp(supervisor)).delete('/comment/v1/topics/42/comments/1203');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: true });
    });

    it.each(['get', 'patch', 'delete'])('responds 400 on %s for a non-integer comment ID', async (method) => {
      const res = await request(createApp(worker))[method]('/comment/v1/topics/42/comments/abc').send({});
      expect(res.status).toBe(400);
    });

    it.each([
      ['get', '/comment/v1/topics/42/comments'],
      ['post', '/comment/v1/topics/42/comments'],
      ['get', '/comment/v1/topics/42/comments/1203'],
      ['patch', '/comment/v1/topics/42/comments/1203'],
      ['delete', '/comment/v1/topics/42/comments/1203'],
    ])('responds 401 on %s %s when there is no authenticated user', async (method, path) => {
      const res = await request(createApp(null))[method](path).send({ content: 'Hi' });
      expect(res.status).toBe(401);
    });

    it.each([
      ['get', '/comment/v1/topics/42/comments'],
      ['get', '/comment/v1/topics/42/comments/1203'],
    ])('responds 403 on %s %s for a user who cannot read the topic', async (method, path) => {
      const res = await request(createApp(plain))[method](path);
      expect(res.status).toBe(403);
    });

    it.each(['patch', 'delete'])('responds 403 on %s of a comment by another commenter', async (method) => {
      const res = await request(createApp(otherWorker))
        [method]('/comment/v1/topics/42/comments/1203')
        .send({ content: 'Changed.' });
      expect(res.status).toBe(403);
    });

    it.each([
      ['get', '/comment/v1/topics/7/comments'],
      ['post', '/comment/v1/topics/7/comments'],
      ['get', '/comment/v1/topics/42/comments/9999'],
      ['patch', '/comment/v1/topics/42/comments/9999'],
      ['delete', '/comment/v1/topics/42/comments/9999'],
    ])('responds 404 on %s %s for a topic or comment not in the tenant', async (method, path) => {
      const res = await request(createApp(supervisor))[method](path).send({ content: 'Hi' });
      expect(res.status).toBe(404);
    });
  });
});
