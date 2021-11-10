import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import axios from 'axios';
import { Logger } from 'winston';
import { TaskStatus, TaskPriority } from '../types';
import { QueueEntity, TaskEntity } from '../model';
import { TaskServiceRoles } from '../roles';
import {
  createQueueRouter,
  mapQueue,
  verifyQueuedTask,
  getQueue,
  getQueues,
  createTask,
  getQueuedTasks,
  getRoleUsers,
} from './queue';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('queue', () => {
  const KEYCLOAK_ROOT_URL = 'http://localhost:8080';
  const apiId = adspId`urn:ads:platform:task-service:v1`;
  const loggerMock = ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown) as Logger;

  const eventServiceMock = {
    send: jest.fn(),
  };

  const repositoryMock = {
    getTask: jest.fn(),
    getTasks: jest.fn(),
    save: jest.fn((entity) => entity),
  };

  const getConfigurationMock = jest.fn();

  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const queue = new QueueEntity({
    tenantId,
    namespace: 'test-service',
    name: 'test',
    context: {},
    workerRoles: ['test-worker'],
    assignerRoles: ['test-assigner'],
  });

  const queues = {
    'test-service:test': queue,
  };

  const task = new TaskEntity(repositoryMock, queue, {
    tenantId,
    id: 'test',
    name: 'test',
    description: 'test',
    status: TaskStatus.Pending,
    priority: TaskPriority.Normal,
    createdOn: new Date(),
  });

  beforeEach(() => {
    getConfigurationMock.mockReset();
    repositoryMock.save.mockClear();
    eventServiceMock.send.mockReset();
    axiosMock.get.mockReset();
  });

  describe('createQueueRouter', () => {
    it('can create router', () => {
      const router = createQueueRouter({
        KEYCLOAK_ROOT_URL,
        apiId,
        logger: loggerMock,
        taskRepository: repositoryMock,
        eventService: eventServiceMock,
      });

      expect(router).toBeTruthy();
    });
  });

  describe('mapQueue', () => {
    it('can map entity', () => {
      const result = mapQueue(queue);
      expect(result.namespace).toBe(queue.namespace);
      expect(result.name).toBe(queue.name);
      expect(result.context).toBe(queue.context);
      expect(result.assignerRoles).toBe(queue.assignerRoles);
      expect(result.workerRoles).toBe(queue.workerRoles);
    });
  });

  describe('verifyQueuedTask', () => {
    it('can verify task is for queue', () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: ['task-worker'] },
        params: { namespace: queue.namespace, name: queue.name },
        task,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      verifyQueuedTask((req as unknown) as Request, (res as unknown) as Response, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('can call next with not found error for not queued task', () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: ['task-worker'] },
        params: { namespace: queue.namespace, name: 'different' },
        task,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      verifyQueuedTask((req as unknown) as Request, (res as unknown) as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('getQueues', () => {
    it('can get queues', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: [] },
        getConfiguration: getConfigurationMock,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      getConfigurationMock.mockResolvedValueOnce([{ queues }]);

      await getQueues((req as unknown) as Request, (res as unknown) as Response, next);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('getQueue', () => {
    it('can get queue', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: [] },
        params: { namespace: queue.namespace, name: queue.name },
        getConfiguration: getConfigurationMock,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      getConfigurationMock.mockResolvedValueOnce([{ queues }]);

      await getQueue((req as unknown) as Request, (res as unknown) as Response, next);
      expect(req['queue']).toBe(queue);
      expect(next).toHaveBeenCalledWith();
    });

    it('can call next with not found error', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: [] },
        params: { namespace: queue.namespace, name: 'different' },
        getConfiguration: getConfigurationMock,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      getConfigurationMock.mockResolvedValueOnce([{ queues }]);

      await getQueue((req as unknown) as Request, (res as unknown) as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('getQueuedTasks', () => {
    const handler = getQueuedTasks(apiId, repositoryMock);

    it('can create handler', () => {
      const result = getQueuedTasks(apiId, repositoryMock);
      expect(result).toBeTruthy();
    });

    it('can get queued tasks', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: ['test-worker'] },
        query: {},
        queue: {
          ...queue,
          getTasks: jest.fn(),
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = { results: [], page: {} };
      req.queue.getTasks.mockResolvedValueOnce(result);

      await handler((req as unknown) as Request, (res as unknown) as Response, next);
      expect(req.queue.getTasks).toHaveBeenCalledWith(req.user, repositoryMock, 10, undefined);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
    });

    it('can get queued tasks with top', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: ['test-worker'] },
        query: { top: '100' },
        queue: {
          ...queue,
          getTasks: jest.fn(),
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = { results: [], page: {} };
      req.queue.getTasks.mockResolvedValueOnce(result);

      await handler((req as unknown) as Request, (res as unknown) as Response, next);
      expect(req.queue.getTasks).toHaveBeenCalledWith(req.user, repositoryMock, 100, undefined);
    });

    it('can get queued tasks with after', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: ['test-worker'] },
        query: { after: '3i9s' },
        queue: {
          ...queue,
          getTasks: jest.fn(),
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = { results: [], page: {} };
      req.queue.getTasks.mockResolvedValueOnce(result);

      await handler((req as unknown) as Request, (res as unknown) as Response, next);
      expect(req.queue.getTasks).toHaveBeenCalledWith(req.user, repositoryMock, 10, '3i9s');
    });
  });

  describe('createTask', () => {
    const handler = createTask(apiId, repositoryMock, eventServiceMock);

    it('can create handler', () => {
      const result = createTask(apiId, repositoryMock, eventServiceMock);
      expect(result).toBeTruthy();
    });

    it('can handle create task request', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: [TaskServiceRoles.TaskWriter] },
        queue,
        body: { name: 'test' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      await handler((req as unknown) as Request, (res as unknown) as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining(req.body));
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'task-created' }));
    });

    it('can handle create task request with priority', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: [TaskServiceRoles.TaskWriter] },
        queue,
        body: { name: 'test', priority: 'High' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      await handler((req as unknown) as Request, (res as unknown) as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining(req.body));
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'task-created' }));
    });

    it('can call next with unauthorized user error', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: [] },
        queue,
        body: { name: 'test', priority: 'High' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      await handler((req as unknown) as Request, (res as unknown) as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('getRoleUsers', () => {
    const handler = getRoleUsers(loggerMock, KEYCLOAK_ROOT_URL, 'workerRoles');

    it('can create handler', () => {
      const result = getRoleUsers(loggerMock, KEYCLOAK_ROOT_URL, 'workerRoles');
      expect(result).toBeTruthy();
    });

    it('can handle users request', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: ['test-worker'], token: { bearer: 'test' } },
        tenant: { realm: 'test' },
        queue,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      axiosMock.get.mockResolvedValueOnce({
        data: [
          { id: 'user-1', firstName: 'Testy', lastName: 'McTester', email: 'user-1@test.co' },
          { id: 'user-2', username: 'user-2' },
        ],
      });
      await handler((req as unknown) as Request, (res as unknown) as Response, next);
      expect(res.send).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(0);
    });

    it('can call next with unauthorized users error', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: ['test-worker'], token: { bearer: 'test' } },
        tenant: null,
        queue,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      axiosMock.get.mockResolvedValueOnce({
        data: [{ id: 'user-1', firstName: 'Testy', lastName: 'McTester', email: 'user-1@test.co' }],
      });
      await handler((req as unknown) as Request, (res as unknown) as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can handle axios forbidden error', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: ['test-worker'], token: { bearer: 'test' } },
        tenant: { realm: 'test' },
        queue,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const error = new Error('something terribly wrong.');
      error['response'] = { status: 403 };
      axiosMock.get.mockRejectedValueOnce(error);
      axiosMock.isAxiosError.mockReturnValueOnce(true);

      await handler((req as unknown) as Request, (res as unknown) as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can handle axios not found error', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: ['test-worker'], token: { bearer: 'test' } },
        tenant: { realm: 'test' },
        queue,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const error = new Error('something terribly wrong.');
      error['response'] = { status: 404 };
      axiosMock.get.mockRejectedValueOnce(error);
      axiosMock.isAxiosError.mockReturnValueOnce(true);

      await handler((req as unknown) as Request, (res as unknown) as Response, next);
      expect(res.send).toHaveBeenCalledWith([]);
      expect(next).toHaveBeenCalledTimes(0);
    });
  });
});
