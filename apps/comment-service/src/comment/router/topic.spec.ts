import { UnauthorizedUserError, adspId } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { Request, Response } from 'express';
import { ServiceRoles } from '../roles';
import { TopicEntity, TopicTypeEntity } from '../model';
import {
  createTopic,
  createTopicComment,
  createTopicRouter,
  deleteTopic,
  deleteTopicComment,
  getTopic,
  getTopicComment,
  getTopicComments,
  getTopics,
  updateTopic,
  updateTopicComment,
} from './topic';
import { NotFoundError } from '@core-services/core-common';

describe('topic', () => {
  const apiId = adspId`urn:ads:platform:comment-service:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    info: jest.fn(),
    debug: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const repositoryMock = {
    getTopic: jest.fn(),
    getTopics: jest.fn(),
    getComment: jest.fn(),
    getComments: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    saveComment: jest.fn(),
    delete: jest.fn(),
    deleteComment: jest.fn(),
  };

  const user = { tenantId, id: 'tester', name: 'Tester', roles: [] };

  const type = new TopicTypeEntity(tenantId, {
    id: 'test',
    name: 'Test',
    adminRoles: ['test-admin'],
    commenterRoles: ['test-commenter'],
    readerRoles: ['test-reader'],
  });

  const topic = new TopicEntity(repositoryMock, type, { tenantId, id: 1, name: 'Test', description: 'test' });

  const comment = {
    id: 1,
    title: 'test',
    content: 'testing',
    createdOn: new Date(),
    createdBy: {
      id: user.id,
      name: user.name,
    },
    lastUpdatedOn: new Date(),
    lastUpdatedBy: {
      id: user.id,
      name: user.name,
    },
  };

  describe('createTopicRouter', () => {
    beforeEach(() => {
      repositoryMock.save.mockClear();
      repositoryMock.delete.mockReset();
      repositoryMock.getComment.mockReset();
      repositoryMock.getComments.mockReset();
      repositoryMock.deleteComment.mockReset();
      repositoryMock.saveComment.mockReset();

      eventServiceMock.send.mockReset();
    });

    it('can create router', () => {
      const router = createTopicRouter({
        apiId,
        logger: loggerMock as unknown as Logger,
        eventService: eventServiceMock,
        repository: repositoryMock,
      });
      expect(router).toBeTruthy();
    });
  });

  describe('getTopics', () => {
    it('can create handler', () => {
      const handler = getTopics(apiId, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get topics for user with admin role', async () => {
      const req = {
        user: { ...user, roles: [ServiceRoles.Admin] },
        tenant: {
          id: tenantId,
        },
        query: {
          top: '12',
          after: 'abc-123',
          criteria: JSON.stringify({}),
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const types = {};
      req.getConfiguration.mockResolvedValueOnce(types);
      const result = { results: [topic] };
      repositoryMock.getTopics.mockResolvedValueOnce(result);

      const handler = getTopics(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({ id: topic.id, name: topic.name, description: topic.description }),
          ]),
        })
      );
    });

    it('can call filter results for unauthorized user', async () => {
      const req = {
        user: { ...user, roles: [] },
        tenant: {
          id: tenantId,
        },
        query: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const types = {};
      req.getConfiguration.mockResolvedValueOnce(types);
      const result = { results: [topic] };
      repositoryMock.getTopics.mockResolvedValueOnce(result);

      const handler = getTopics(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ results: expect.arrayContaining([]) }));
    });
  });

  describe('createTopic', () => {
    it('can create handler', () => {
      const handler = createTopic(apiId, loggerMock as unknown as Logger, repositoryMock, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can create topic for user with topic setter role', async () => {
      const req = {
        user: { ...user, roles: [ServiceRoles.TopicSetter] },
        tenant: {
          id: tenantId,
        },
        body: {
          typeId: type.id,
          name: 'test',
          description: 'testing',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const types = {
        [type.id]: type,
      };
      req.getConfiguration.mockResolvedValueOnce(types);
      repositoryMock.save.mockResolvedValueOnce(topic);

      const handler = createTopic(apiId, loggerMock as unknown as Logger, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(eventServiceMock.send).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          id: topic.id,
          name: topic.name,
          description: topic.description,
        })
      );
    });

    it('can call next with error for unauthorized user', async () => {
      const req = {
        user: { ...user, roles: [] },
        tenant: {
          id: tenantId,
        },
        body: {
          typeId: type.id,
          name: 'test',
          description: 'testing',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const types = {
        [type.id]: type,
      };
      req.getConfiguration.mockResolvedValueOnce(types);

      const handler = createTopic(apiId, loggerMock as unknown as Logger, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can call next with error for type not found', async () => {
      const req = {
        user: { ...user, roles: [] },
        tenant: {
          id: tenantId,
        },
        body: {
          typeId: 'another',
          name: 'test',
          description: 'testing',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const types = {};
      req.getConfiguration.mockResolvedValueOnce(types);

      const handler = createTopic(apiId, loggerMock as unknown as Logger, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('getTopic', () => {
    it('can create handler', () => {
      const handler = getTopic(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get topic for user with reader role', async () => {
      const req = {
        user: { ...user, roles: ['test-reader'] },
        tenant: {
          id: tenantId,
        },
        params: {
          topicId: '1',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const types = {
        [type.id]: type,
      };
      req.getConfiguration.mockResolvedValueOnce(types);
      repositoryMock.getTopic.mockResolvedValueOnce(topic);

      const handler = getTopic(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(req['topic']).toBe(topic);
      expect(next).toHaveBeenCalled();
    });

    it('can get topic for user with topic setter role', async () => {
      const req = {
        user: { ...user, roles: [ServiceRoles.TopicSetter] },
        tenant: {
          id: tenantId,
        },
        params: {
          topicId: '1',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const types = {
        [type.id]: type,
      };
      req.getConfiguration.mockResolvedValueOnce(types);
      repositoryMock.getTopic.mockResolvedValueOnce(topic);

      const handler = getTopic(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(req['topic']).toBe(topic);
      expect(next).toHaveBeenCalled();
    });

    it('can call next with error for unauthorized user', async () => {
      const req = {
        user: { ...user, roles: [] },
        tenant: {
          id: tenantId,
        },
        params: {
          topicId: '1',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const types = {
        [type.id]: type,
      };
      req.getConfiguration.mockResolvedValueOnce(types);
      repositoryMock.getTopic.mockResolvedValueOnce(topic);

      const handler = getTopic(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can call next with error for topic not found', async () => {
      const req = {
        user: { ...user, roles: [] },
        tenant: {
          id: tenantId,
        },
        params: {
          topicId: '1',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const types = {
        [type.id]: type,
      };
      req.getConfiguration.mockResolvedValueOnce(types);
      repositoryMock.getTopic.mockResolvedValueOnce(null);

      const handler = getTopic(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('updateTopic', () => {
    it('can create handler', () => {
      const handler = updateTopic(apiId, loggerMock as unknown as Logger, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can update topic', async () => {
      const req = {
        user: { ...user, roles: [ServiceRoles.Admin] },
        tenant: {
          id: tenantId,
        },
        topic,
        body: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.save.mockResolvedValueOnce(topic);

      const handler = updateTopic(apiId, loggerMock as unknown as Logger, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ id: topic.id }));
      expect(eventServiceMock.send).toHaveBeenCalled();
    });

    it('can call next with error for unauthorized user', async () => {
      const req = {
        user: { ...user, roles: [] },
        tenant: {
          id: tenantId,
        },
        topic,
        body: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = updateTopic(apiId, loggerMock as unknown as Logger, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('deleteTopic', () => {
    beforeEach(() => {
      eventServiceMock.send.mockReset();
    });

    it('can create handler', () => {
      const handler = deleteTopic(apiId, loggerMock as unknown as Logger, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can delete topic', async () => {
      const req = {
        user: { ...user, roles: [ServiceRoles.Admin] },
        tenant: {
          id: tenantId,
        },
        topic,
        body: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.delete.mockResolvedValueOnce(true);

      const handler = deleteTopic(apiId, loggerMock as unknown as Logger, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
      expect(eventServiceMock.send).toHaveBeenCalled();
    });

    it('can delete topic and not send event if already deleted', async () => {
      const req = {
        user: { ...user, roles: [ServiceRoles.Admin] },
        tenant: {
          id: tenantId,
        },
        topic,
        body: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.delete.mockResolvedValueOnce(false);

      const handler = deleteTopic(apiId, loggerMock as unknown as Logger, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: false }));
      expect(eventServiceMock.send).not.toHaveBeenCalled();
    });

    it('can call next with error for unauthorized user', async () => {
      const req = {
        user: { ...user, roles: [] },
        tenant: {
          id: tenantId,
        },
        topic,
        body: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.delete.mockResolvedValueOnce(true);

      const handler = deleteTopic(apiId, loggerMock as unknown as Logger, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('getTopicComments', () => {
    it('can create handler', () => {
      const handler = getTopicComments();
      expect(handler).toBeTruthy();
    });

    it('can get topic comments for user with reader role', async () => {
      const req = {
        user: { ...user, roles: ['test-reader'] },
        tenant: {
          id: tenantId,
        },
        topic,
        query: {
          top: '12',
          after: 'abc-123',
          criteria: JSON.stringify({}),
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = {};
      repositoryMock.getComments.mockResolvedValueOnce(result);

      const handler = getTopicComments();
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(result);
    });

    it('can call next with error for unauthorized user', async () => {
      const req = {
        user: { ...user, roles: [] },
        tenant: {
          id: tenantId,
        },
        topic,
        query: {
          top: '12',
          after: 'abc-123',
          criteria: JSON.stringify({}),
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = getTopicComments();
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('createTopicComment', () => {
    beforeEach(() => {
      eventServiceMock.send.mockReset();
    });

    it('can create handler', () => {
      const handler = createTopicComment(apiId, loggerMock as unknown as Logger, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can create topic comment for user with commenter role', async () => {
      const req = {
        user: { ...user, roles: ['test-commenter'] },
        tenant: {
          id: tenantId,
        },
        topic,
        body: {
          title: 'test',
          content: 'testing',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.saveComment.mockResolvedValueOnce(comment);

      const handler = createTopicComment(apiId, loggerMock as unknown as Logger, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(comment);
      expect(eventServiceMock.send).toHaveBeenCalled();
    });

    it('can call next with error for unauthorized user', async () => {
      const req = {
        user: { ...user, roles: [] },
        tenant: {
          id: tenantId,
        },
        topic,
        body: {
          title: 'test',
          content: 'testing',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = createTopicComment(apiId, loggerMock as unknown as Logger, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('getTopicComment', () => {
    beforeEach(() => {
      repositoryMock.getComment.mockReset();
    });

    it('can create handler', () => {
      const handler = getTopicComment();
      expect(handler).toBeTruthy();
    });

    it('can get topic comment for user with reader role', async () => {
      const req = {
        user: { ...user, roles: ['test-reader'] },
        tenant: {
          id: tenantId,
        },
        topic,
        params: {
          commentId: 1,
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = {};
      repositoryMock.getComment.mockResolvedValueOnce(result);

      const handler = getTopicComment();
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(result);
    });

    it('can call next with error for unauthorized user', async () => {
      const req = {
        user: { ...user, roles: [] },
        tenant: {
          id: tenantId,
        },
        topic,
        params: {
          commentId: 1,
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = getTopicComment();
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can call next with error for comment not found', async () => {
      const req = {
        user: { ...user, roles: ['test-reader'] },
        tenant: {
          id: tenantId,
        },
        topic,
        params: {
          commentId: 1,
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getComment.mockResolvedValueOnce(null);

      const handler = getTopicComment();
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('updateTopicComment', () => {
    beforeEach(() => {
      eventServiceMock.send.mockReset();
      repositoryMock.getComment.mockReset();
    });

    it('can create handler', () => {
      const handler = updateTopicComment(apiId, loggerMock as unknown as Logger, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can update topic comment for original commenter with commenter role', async () => {
      const req = {
        user: { ...user, roles: ['test-commenter'] },
        tenant: {
          id: tenantId,
        },
        topic,
        params: {
          commentId: '1',
        },
        body: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getComment.mockResolvedValueOnce(comment);
      repositoryMock.saveComment.mockResolvedValueOnce(comment);

      const handler = updateTopicComment(apiId, loggerMock as unknown as Logger, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(comment);
      expect(eventServiceMock.send).toHaveBeenCalled();
    });

    it('can call next with error for different user', async () => {
      const req = {
        user: { ...user, id: 'another', roles: ['test-commenter'] },
        tenant: {
          id: tenantId,
        },
        params: {
          commentId: '1',
        },
        topic,
        body: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getComment.mockResolvedValueOnce(comment);

      const handler = updateTopicComment(apiId, loggerMock as unknown as Logger, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can call next with error for comment not found', async () => {
      const req = {
        user: { ...user, roles: ['test-commenter'] },
        tenant: {
          id: tenantId,
        },
        topic,
        params: {
          commentId: 1,
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getComment.mockResolvedValueOnce(null);

      const handler = updateTopicComment(apiId, loggerMock as unknown as Logger, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('deleteTopicComment', () => {
    beforeEach(() => {
      eventServiceMock.send.mockReset();
      repositoryMock.getComment.mockReset();
    });

    it('can create handler', () => {
      const handler = deleteTopicComment(apiId, loggerMock as unknown as Logger, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can delete topic comment for original commenter with commenter role', async () => {
      const req = {
        user: { ...user, roles: ['test-commenter'] },
        tenant: {
          id: tenantId,
        },
        topic,
        params: {
          commentId: '1',
        },
        body: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getComment.mockResolvedValueOnce(comment);
      repositoryMock.deleteComment.mockResolvedValueOnce(true);

      const handler = deleteTopicComment(apiId, loggerMock as unknown as Logger, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
      expect(eventServiceMock.send).toHaveBeenCalled();
    });

    it('can call next with error for different user', async () => {
      const req = {
        user: { ...user, id: 'another', roles: ['test-commenter'] },
        tenant: {
          id: tenantId,
        },
        topic,
        params: {
          commentId: '1',
        },
        body: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getComment.mockResolvedValueOnce(comment);
      repositoryMock.deleteComment.mockResolvedValueOnce(true);

      const handler = deleteTopicComment(apiId, loggerMock as unknown as Logger, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can call next with error for comment not found', async () => {
      const req = {
        user: { ...user, roles: ['test-commenter'] },
        tenant: {
          id: tenantId,
        },
        topic,
        params: {
          commentId: 1,
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getComment.mockResolvedValueOnce(null);

      const handler = deleteTopicComment(apiId, loggerMock as unknown as Logger, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });
});
