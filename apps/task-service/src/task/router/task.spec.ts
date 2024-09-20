import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { NotFoundError, InvalidOperationError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { mapTask } from '../mapper';
import { QueueEntity, TaskEntity } from '../model';
import { DirectoryServiceRoles, TaskServiceRoles } from '../roles';
import { getTasks, taskOperation, updateTask } from '../router';
import { TaskPriority, TaskStatus } from '../types';
import { createTaskRouter, deleteTask, getTask } from './task';

describe('task', () => {
  const apiId = adspId`urn:ads:platform:task-service:v1`;
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const eventServiceMock = {
    send: jest.fn(),
  };

  const repositoryMock = {
    getTask: jest.fn(),
    getTasks: jest.fn(),
    getTaskMetrics: jest.fn(),
    save: jest.fn((entity) => entity),
    delete: jest.fn(),
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
    repositoryMock.getTask.mockReset();
    repositoryMock.getTasks.mockReset();
    repositoryMock.save.mockClear();
    repositoryMock.delete.mockClear();
    eventServiceMock.send.mockReset();
  });

  describe('createTaskRouter', () => {
    it('can create router', () => {
      const router = createTaskRouter({
        apiId,
        logger: loggerMock,
        eventService: eventServiceMock,
        taskRepository: repositoryMock,
      });

      expect(router).toBeTruthy();
    });
  });

  describe('mapTask', () => {
    it('can map task entity', () => {
      const entity = new TaskEntity(repositoryMock, queue, {
        tenantId,
        id: 'task-1',
        name: 'test-1',
        description: 'Do some stuff.',
        status: TaskStatus.InProgress,
        priority: TaskPriority.High,
        createdOn: new Date(),
        startedOn: new Date(),
        assignment: {
          assignedBy: { id: 'tester-1', name: 'tester-1' },
          assignedOn: new Date(),
          assignedTo: { id: 'tester-2', name: 'tester-2', email: 'tester-2@test.co' },
        },
      });
      const result = mapTask(apiId, entity) as Record<string, unknown>;
      expect(result.id).toBe(entity.id);
      expect(result.name).toBe(entity.name);
      expect(result.description).toBe(entity.description);
      expect(result.status).toBe(entity.status);
      expect(result.priority).toBe(TaskPriority[entity.priority]);
      expect(result.createdOn).toBe(entity.createdOn);
      expect(result.startedOn).toBe(entity.startedOn);
      expect(result.endedOn).toBeFalsy();
      expect(result.assignment).toBe(entity.assignment);
    });
  });

  describe('getTasks', () => {
    const handler = getTasks(apiId, repositoryMock);

    it('can create request handler', () => {
      const result = getTasks(apiId, repositoryMock);
      expect(result).toBeTruthy();
    });

    it('can handle get tasks request', async () => {
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      getConfigurationMock.mockResolvedValueOnce([{ queues }]);
      const result = { results: [task], page: { size: 1 } };
      repositoryMock.getTasks.mockResolvedValueOnce(result);

      await handler(
        {
          tenant: { id: tenantId },
          user: { tenantId, id: 'user-1', roles: [TaskServiceRoles.TaskReader] },
          query: {},
          getConfiguration: getConfigurationMock,
        } as unknown as Request,
        res as unknown as Response,
        next
      );

      expect(repositoryMock.getTasks).toHaveBeenCalledWith(
        queues,
        10,
        undefined,
        expect.objectContaining({ tenantId })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
    });

    it('can call next with invalid operation for no tenant context', async () => {
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      getConfigurationMock.mockResolvedValueOnce([{ queues }]);
      const result = { results: [task], page: { size: 1 } };
      repositoryMock.getTasks.mockResolvedValueOnce(result);

      await handler(
        {
          user: { tenantId, id: 'user-1', roles: [TaskServiceRoles.TaskReader] },
          query: {},
          getConfiguration: getConfigurationMock,
        } as unknown as Request,
        res as unknown as Response,
        next
      );

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can handle get tasks request with top', async () => {
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      getConfigurationMock.mockResolvedValueOnce([{ queues }]);
      const result = { results: [task], page: { size: 1 } };
      repositoryMock.getTasks.mockResolvedValueOnce(result);

      await handler(
        {
          tenant: { id: tenantId },
          user: { tenantId, id: 'user-1', roles: [TaskServiceRoles.TaskReader] },
          query: { top: 100 },
          getConfiguration: getConfigurationMock,
        } as unknown as Request,
        res as unknown as Response,
        next
      );

      expect(repositoryMock.getTasks).toHaveBeenCalledWith(
        queues,
        100,
        undefined,
        expect.objectContaining({ tenantId })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
    });

    it('can handle get tasks request with after', async () => {
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      getConfigurationMock.mockResolvedValueOnce([{ queues }]);
      const result = { results: [task], page: { size: 1 } };
      repositoryMock.getTasks.mockResolvedValueOnce(result);

      await handler(
        {
          tenant: { id: tenantId },
          user: { tenantId, id: 'user-1', roles: [TaskServiceRoles.TaskReader] },
          query: { after: '0fds' },
          getConfiguration: getConfigurationMock,
        } as unknown as Request,
        res as unknown as Response,
        next
      );

      expect(repositoryMock.getTasks).toHaveBeenCalledWith(queues, 10, '0fds', expect.objectContaining({ tenantId }));
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ page: result.page }));
    });

    it('can call next with error for unauthorized', async () => {
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      getConfigurationMock.mockResolvedValueOnce([{ queues }]);
      const result = { results: [task], page: { size: 1 } };
      repositoryMock.getTasks.mockResolvedValueOnce(result);

      await handler(
        {
          tenant: { id: tenantId },
          user: { id: 'user-1', roles: [] },
          query: {},
          getConfiguration: getConfigurationMock,
        } as unknown as Request,
        res as unknown as Response,
        next
      );

      expect(res.send).toHaveBeenCalledTimes(0);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('getTask', () => {
    const handler = getTask(repositoryMock);

    it('can create request handler', () => {
      const result = getTask(repositoryMock);
      expect(result).toBeTruthy();
    });

    it('can handle get task request', async () => {
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      getConfigurationMock.mockResolvedValueOnce([{ queues }]);
      repositoryMock.getTask.mockResolvedValueOnce(task);

      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'user-1', roles: [TaskServiceRoles.TaskReader] },
        params: { id: task.id },
        query: {},
        getConfiguration: getConfigurationMock,
      };

      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(repositoryMock.getTask).toHaveBeenCalledWith(queues, tenantId, task.id);
      expect(req['task']).toBe(task);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('can handle get task request with additional allowed role', async () => {
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      getConfigurationMock.mockResolvedValueOnce([{ queues }]);
      repositoryMock.getTask.mockResolvedValueOnce(task);

      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'user-1', roles: [DirectoryServiceRoles.ResourceResolver] },
        params: { id: task.id },
        query: {},
        getConfiguration: getConfigurationMock,
      };

      const handler = getTask(repositoryMock, DirectoryServiceRoles.ResourceResolver);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(repositoryMock.getTask).toHaveBeenCalledWith(queues, tenantId, task.id);
      expect(req['task']).toBe(task);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('can call next with invalid operation for no tenant context', async () => {
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      getConfigurationMock.mockResolvedValueOnce([{ queues }]);
      repositoryMock.getTask.mockResolvedValueOnce(task);

      const req = {
        user: { tenantId, id: 'user-1', roles: [TaskServiceRoles.TaskReader] },
        params: { id: task.id },
        query: {},
        getConfiguration: getConfigurationMock,
      };

      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with not found error', async () => {
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      getConfigurationMock.mockResolvedValueOnce([{ queues }]);
      repositoryMock.getTask.mockResolvedValueOnce(null);

      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'user-1', roles: [TaskServiceRoles.TaskReader] },
        params: { id: task.id },
        query: {},
        getConfiguration: getConfigurationMock,
      };

      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(repositoryMock.getTask).toHaveBeenCalledWith(queues, tenantId, task.id);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('can call next with unauthorized user error', async () => {
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      getConfigurationMock.mockResolvedValueOnce([{ queues }]);
      repositoryMock.getTask.mockResolvedValueOnce(task);

      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'user-1', roles: [] },
        params: { id: task.id },
        query: {},
        getConfiguration: getConfigurationMock,
      };

      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(repositoryMock.getTask).toHaveBeenCalledWith(queues, tenantId, task.id);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('updateTask', () => {
    const handler = updateTask(apiId, loggerMock, eventServiceMock);

    it('can create request handler', () => {
      const result = updateTask(apiId, loggerMock, eventServiceMock);
      expect(result).toBeTruthy();
    });

    it('can handle update request', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: [TaskServiceRoles.TaskWriter] },
        body: { description: 'updated' },
        task,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ description: 'updated' }));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can call next with unauthorized user error', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: [] },
        body: { description: 'updated' },
        task,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('taskOperation', () => {
    const handler = taskOperation(apiId, loggerMock, eventServiceMock);

    it('can create request handler', () => {
      const result = taskOperation(apiId, loggerMock, eventServiceMock);
      expect(result).toBeTruthy();
    });

    it('can handle task start request', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: ['task-worker'] },
        body: { operation: 'start' },
        task: {
          ...task,
          start: jest.fn(),
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.task.start.mockResolvedValueOnce(req.task);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(req.task.start).toHaveBeenCalledWith(req.user);
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'task-started' }));
    });

    it('can handle task complete request', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: ['task-worker'] },
        body: { operation: 'complete' },
        task: {
          ...task,
          status: TaskStatus.InProgress,
          complete: jest.fn(),
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.task.complete.mockResolvedValueOnce(req.task);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(req.task.complete).toHaveBeenCalledWith(req.user);
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'task-completed' }));
    });

    it('can handle task cancel request', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: ['task-worker'] },
        body: { operation: 'cancel', reason: `don't like this` },
        task: {
          ...task,
          cancel: jest.fn(),
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.task.cancel.mockResolvedValueOnce(req.task);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(req.task.cancel).toHaveBeenCalledWith(req.user);
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'task-cancelled' }));
    });

    it('can handle task assign request', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: ['test-assigner'] },
        body: {
          operation: 'assign',
          assignTo: { id: 'assigned', name: 'assigned', email: 'assigned@test.co' },
        },
        task: {
          ...task,
          assign: jest.fn(),
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.task.assign.mockResolvedValueOnce(req.task);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(req.task.assign).toHaveBeenCalledWith(req.user, req.body.assignTo);
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'task-assigned' }));
    });

    it('can handle set task priority request', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: ['test-assigner'] },
        body: {
          operation: 'set-priority',
          priority: 'High',
        },
        task: {
          ...task,
          setPriority: jest.fn(),
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.task.setPriority.mockResolvedValueOnce(req.task);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(req.task.setPriority).toHaveBeenCalledWith(req.user, TaskPriority.High);
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'task-priority-set' }));
    });

    it('can call next with invalid operation error', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: ['task-worker'] },
        body: { operation: 'no-op' },
        task,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(0);
    });
  });

  describe('deleteTask', () => {
    const handler = deleteTask(apiId, loggerMock, eventServiceMock);

    it('can create request handler', () => {
      const result = deleteTask(apiId, loggerMock, eventServiceMock);
      expect(result).toBeTruthy();
    });

    it('can handle delete request', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: [TaskServiceRoles.Admin] },
        task,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.delete.mockResolvedValueOnce(true);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can handle delete request and skip event', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: [TaskServiceRoles.Admin] },
        task,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.delete.mockResolvedValueOnce(false);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: false }));
      expect(eventServiceMock.send).not.toHaveBeenCalled();
    });

    it('can call next with unauthorized', async () => {
      const req = {
        user: { tenantId, id: 'user-1', roles: [] },
        task,
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.delete.mockResolvedValueOnce(true);

      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(eventServiceMock.send).not.toHaveBeenCalled();
    });
  });
});
