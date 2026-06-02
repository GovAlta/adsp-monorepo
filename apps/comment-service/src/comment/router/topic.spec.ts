import axios from 'axios';
import { UnauthorizedUserError, adspId } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { Request, Response } from 'express';
import { DirectoryServiceRoles, ExportServiceRoles, ServiceRoles } from '../roles';
import { TopicEntity, TopicTypeEntity } from '../model';
import {
  createTopicType,
  deleteTopicType,
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
import { InvalidOperationError, NotFoundError, UnauthorizedError } from '@core-services/core-common';

jest.mock('axios');

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

  const directoryMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(),
  };

  const repositoryMock = {
    getTopic: jest.fn(),
    getTopics: jest.fn(),
    getComment: jest.fn(),
    getComments: jest.fn(),
    countTopics: jest.fn(),
    countTopicsByType: jest.fn(),
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
    context: {},
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
      repositoryMock.countTopics.mockReset();
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
        directory: directoryMock,
        tokenProvider: tokenProviderMock,
      });
      expect(router).toBeTruthy();
    });
  });

  describe('createTopicType', () => {
    const axiosMock = axios as jest.Mocked<typeof axios>;

    beforeEach(() => {
      directoryMock.getServiceUrl.mockReset();
      tokenProviderMock.getAccessToken.mockReset();
      axiosMock.patch.mockReset();
      loggerMock.info.mockReset();
    });

    it('can create handler', () => {
      const handler = createTopicType(apiId, loggerMock as unknown as Logger, directoryMock, tokenProviderMock);
      expect(handler).toBeTruthy();
    });

    it('creates topic type configuration for user with topic setter role', async () => {
      const req = {
        user: { ...user, roles: [ServiceRoles.TopicSetter] },
        tenant: {
          id: tenantId,
        },
        body: {
          id: 'case',
          name: 'Case',
          readRoles: ['case-reader'],
          writeRoles: ['case-writer'],
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        status: jest.fn(function () {
          return this;
        }),
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({});
      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://configuration-service/'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('service-token');
      axiosMock.patch.mockResolvedValueOnce({ data: {} });

      const handler = createTopicType(apiId, loggerMock as unknown as Logger, directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        'http://configuration-service/v2/configuration/platform/comment-service',
        {
          operation: 'UPDATE',
          update: {
            case: {
              id: 'case',
              name: 'Case',
              adminRoles: [],
              readerRoles: ['case-reader'],
              commenterRoles: ['case-writer'],
            },
          },
        },
        {
          headers: { Authorization: 'Bearer service-token' },
          params: { tenantId: tenantId.toString() },
        }
      );
      expect(res.send).toHaveBeenCalledWith({ id: 'case' });
      expect(next).not.toHaveBeenCalled();
    });

    it('creates topic type with empty role lists when roles are not supplied', async () => {
      const req = {
        user: { ...user, roles: [ServiceRoles.TopicSetter] },
        tenant: {
          id: tenantId,
        },
        body: {
          id: 'case',
          name: 'Case',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        status: jest.fn(function () {
          return this;
        }),
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({});
      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://configuration-service/'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('service-token');
      axiosMock.patch.mockResolvedValueOnce({ data: {} });

      const handler = createTopicType(apiId, loggerMock as unknown as Logger, directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          update: {
            case: expect.objectContaining({
              readerRoles: [],
              commenterRoles: [],
            }),
          },
        }),
        expect.any(Object)
      );
      expect(res.send).toHaveBeenCalledWith({ id: 'case' });
    });

    it('calls next with conflict when topic type name already exists', async () => {
      const req = {
        user: { ...user, roles: [ServiceRoles.TopicSetter] },
        tenant: {
          id: tenantId,
        },
        body: {
          id: 'another',
          name: type.name,
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        status: jest.fn(function () {
          return this;
        }),
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({ [type.id]: type });

      const handler = createTopicType(apiId, loggerMock as unknown as Logger, directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(axiosMock.patch).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(next.mock.calls[0][0].extra.statusCode).toBe(409);
    });

    it('calls next with forbidden when user does not have topic setter role', async () => {
      const req = {
        user: { ...user, roles: [] },
        tenant: {
          id: tenantId,
        },
        body: {
          id: 'case',
          name: 'Case',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = createTopicType(apiId, loggerMock as unknown as Logger, directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(req.getConfiguration).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('calls next with unauthorized when no user is available', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        body: {
          id: 'case',
          name: 'Case',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = createTopicType(apiId, loggerMock as unknown as Logger, directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(req.getConfiguration).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('deleteTopicType', () => {
    const axiosMock = axios as jest.Mocked<typeof axios>;

    beforeEach(() => {
      directoryMock.getServiceUrl.mockReset();
      tokenProviderMock.getAccessToken.mockReset();
      repositoryMock.countTopics.mockReset();
      repositoryMock.countTopicsByType.mockReset();
      axiosMock.patch.mockReset();
      loggerMock.info.mockReset();
    });

    it('can create handler', () => {
      const handler = deleteTopicType(
        apiId,
        loggerMock as unknown as Logger,
        repositoryMock,
        directoryMock,
        tokenProviderMock
      );
      expect(handler).toBeTruthy();
    });

    it('deletes topic type configuration for user with topic setter role', async () => {
      const req = {
        user: { ...user, roles: [ServiceRoles.TopicSetter] },
        tenant: {
          id: tenantId,
        },
        params: {
          topicTypeId: type.id,
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({ [type.id]: type });
      repositoryMock.countTopicsByType.mockResolvedValueOnce(0);
      directoryMock.getServiceUrl.mockResolvedValueOnce(new URL('http://configuration-service/'));
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('service-token');
      axiosMock.patch.mockResolvedValueOnce({ data: {} });

      const handler = deleteTopicType(
        apiId,
        loggerMock as unknown as Logger,
        repositoryMock,
        directoryMock,
        tokenProviderMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(repositoryMock.countTopicsByType).toHaveBeenCalledWith(tenantId, type.id);
      expect(axiosMock.patch).toHaveBeenCalledWith(
        'http://configuration-service/v2/configuration/platform/comment-service',
        {
          operation: 'DELETE',
          property: type.id,
        },
        {
          headers: { Authorization: 'Bearer service-token' },
          params: { tenantId: tenantId.toString() },
        }
      );
      expect(res.send).toHaveBeenCalledWith({ deleted: true, id: type.id });
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with conflict and associated topic count when topics use the type', async () => {
      const req = {
        user: { ...user, roles: [ServiceRoles.TopicSetter] },
        tenant: {
          id: tenantId,
        },
        params: {
          topicTypeId: type.id,
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        status: jest.fn(function () {
          return this;
        }),
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({ [type.id]: type });
      repositoryMock.countTopicsByType.mockResolvedValueOnce(3);

      const handler = deleteTopicType(
        apiId,
        loggerMock as unknown as Logger,
        repositoryMock,
        directoryMock,
        tokenProviderMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.send).toHaveBeenCalledWith({
        errorMessage: expect.stringContaining("Topic type 'test' cannot be deleted"),
        topics: 3,
      });
      expect(axiosMock.patch).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with not found when topic type does not exist', async () => {
      const req = {
        user: { ...user, roles: [ServiceRoles.TopicSetter] },
        tenant: {
          id: tenantId,
        },
        params: {
          topicTypeId: type.id,
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({});

      const handler = deleteTopicType(
        apiId,
        loggerMock as unknown as Logger,
        repositoryMock,
        directoryMock,
        tokenProviderMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(repositoryMock.countTopicsByType).not.toHaveBeenCalled();
      expect(axiosMock.patch).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('calls next with forbidden when user does not have topic setter role', async () => {
      const req = {
        user: { ...user, roles: [] },
        tenant: {
          id: tenantId,
        },
        params: {
          topicTypeId: type.id,
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = deleteTopicType(
        apiId,
        loggerMock as unknown as Logger,
        repositoryMock,
        directoryMock,
        tokenProviderMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(req.getConfiguration).not.toHaveBeenCalled();
      expect(repositoryMock.countTopics).not.toHaveBeenCalled();
      expect(repositoryMock.countTopicsByType).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('calls next with unauthorized when no user is available', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        params: {
          topicTypeId: type.id,
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = deleteTopicType(
        apiId,
        loggerMock as unknown as Logger,
        repositoryMock,
        directoryMock,
        tokenProviderMock
      );
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(req.getConfiguration).not.toHaveBeenCalled();
      expect(repositoryMock.countTopics).not.toHaveBeenCalled();
      expect(repositoryMock.countTopicsByType).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
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

    it('can get topics for export job user without filtering results', async () => {
      const req = {
        user: { ...user, roles: [ExportServiceRoles.ExportJob] },
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
      repositoryMock.getTopics.mockResolvedValueOnce({ results: [topic] });

      const handler = getTopics(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([expect.objectContaining({ id: topic.id })]),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with error when criteria cannot be parsed', async () => {
      repositoryMock.getTopics.mockClear();

      const req = {
        user,
        tenant: {
          id: tenantId,
        },
        query: {
          criteria: '{',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = getTopics(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(req.getConfiguration).not.toHaveBeenCalled();
      expect(repositoryMock.getTopics).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(SyntaxError));
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

    it('can get topic for directory resource resolver', async () => {
      const req = {
        user: { ...user, roles: [DirectoryServiceRoles.ResourceResolver] },
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

      const handler = getTopic(repositoryMock, DirectoryServiceRoles.ResourceResolver);
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

    it('can update topic fields', async () => {
      const editableTopic = new TopicEntity(repositoryMock, type, {
        tenantId,
        id: 2,
        name: 'Old',
        description: 'old',
      });
      const req = {
        user: { ...user, roles: [ServiceRoles.Admin] },
        tenant: {
          id: tenantId,
        },
        topic: editableTopic,
        body: {
          name: 'New',
          description: '',
          commenters: ['user-123'],
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.save.mockResolvedValueOnce(editableTopic);

      const handler = updateTopic(apiId, loggerMock as unknown as Logger, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(repositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New',
          description: '',
          commenters: ['user-123'],
        })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          id: editableTopic.id,
          name: 'New',
          description: '',
          commenters: ['user-123'],
        })
      );
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

      const result = { results: [], page: {} };
      repositoryMock.getComments.mockResolvedValueOnce(result);

      const handler = getTopicComments();
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining(result));
    });

    it('can anonymize comments for topic-specific commenter', async () => {
      const commenterTopic = new TopicEntity(repositoryMock, type, {
        tenantId,
        id: 2,
        name: 'Test',
        description: 'test',
        commenters: ['external-user'],
      });
      const req = {
        user: { ...user, id: 'external-user', roles: [] },
        tenant: {
          id: tenantId,
        },
        topic: commenterTopic,
        query: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getComments.mockResolvedValueOnce({
        results: [
          {
            ...comment,
            id: 2,
            createdBy: { id: 'another-user', name: 'Another' },
            lastUpdatedBy: { id: 'another-user', name: 'Another' },
          },
          {
            ...comment,
            id: 3,
            createdBy: { id: 'external-user', name: 'External' },
            lastUpdatedBy: { id: 'external-user', name: 'External' },
          },
        ],
        page: {},
      });

      const handler = getTopicComments();
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          results: [
            expect.objectContaining({
              createdBy: expect.objectContaining({ name: null }),
              lastUpdatedBy: expect.objectContaining({ name: null }),
            }),
            expect.objectContaining({
              createdBy: expect.objectContaining({ name: 'External' }),
              lastUpdatedBy: expect.objectContaining({ name: 'External' }),
            }),
          ],
        })
      );
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
          context: {
            pinned: true,
            metadata: {
              applicationId: 'test-app',
            },
          },
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
      expect(repositoryMock.saveComment).toHaveBeenCalledWith(
        topic,
        expect.objectContaining({
          context: {
            pinned: true,
            metadata: {
              applicationId: 'test-app',
            },
          },
        })
      );
      expect(eventServiceMock.send).toHaveBeenCalled();
    });

    it('can create topic comment and set requires attention', async () => {
      const attentionTopic = new TopicEntity(repositoryMock, type, {
        tenantId,
        id: 2,
        name: 'Test',
        description: 'test',
      });
      const req = {
        user: { ...user, roles: ['test-commenter'] },
        tenant: {
          id: tenantId,
        },
        topic: attentionTopic,
        body: {
          title: 'test',
          content: 'testing',
          requiresAttention: true,
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.saveComment.mockResolvedValueOnce(comment);
      repositoryMock.save.mockImplementationOnce((entity) => Promise.resolve(entity));

      const handler = createTopicComment(apiId, loggerMock as unknown as Logger, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(repositoryMock.save).toHaveBeenCalledWith(expect.objectContaining({ requiresAttention: true }));
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

      const result = { ...comment, context: { pinned: true } };
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
        body: {
          context: {
            pinned: true,
            metadata: {
              reason: 'application pin',
            },
          },
        },
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
      expect(repositoryMock.saveComment).toHaveBeenCalledWith(
        topic,
        expect.objectContaining({
          context: {
            pinned: true,
            metadata: {
              reason: 'application pin',
            },
          },
        })
      );
      expect(eventServiceMock.send).toHaveBeenCalled();
    });

    it('can update topic comment title and content', async () => {
      const req = {
        user: { ...user, roles: ['test-commenter'] },
        tenant: {
          id: tenantId,
        },
        topic,
        params: {
          commentId: '1',
        },
        body: {
          title: 'updated title',
          content: '',
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getComment.mockResolvedValueOnce({ ...comment });
      repositoryMock.saveComment.mockImplementationOnce((_topic, updated) => Promise.resolve(updated));

      const handler = updateTopicComment(apiId, loggerMock as unknown as Logger, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(repositoryMock.saveComment).toHaveBeenCalledWith(
        topic,
        expect.objectContaining({
          title: 'updated title',
          content: '',
        })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ title: 'updated title', content: '' }));
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
