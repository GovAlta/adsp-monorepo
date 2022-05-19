import { adspId } from '@abgov/adsp-service-sdk';
import { Knex } from 'knex';
import { QueueEntity, TaskEntity, TaskPriority, TaskStatus } from '../task';
import { PostgresTaskRepository } from './task';
import type { TaskRecord } from './types';

describe('PostgresTaskRepository', () => {
  const knexMock = jest.fn();

  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const queue = new QueueEntity({
    tenantId,
    namespace: 'test-service',
    name: 'test',
    context: {},
    workerRoles: ['test-worker'],
    assignerRoles: ['test-assigner'],
  });
  const repository = new PostgresTaskRepository(knexMock as unknown as Knex);
  const queues = { 'test-service:test': queue };
  const task: TaskRecord = {
    tenant: tenantId.toString(),
    id: 'task-1',
    recordId: 'intake-1',
    queueNamespace: queue.namespace,
    queueName: queue.name,
    definitionNamespace: null,
    definitionName: null,
    context: {},
    data: {},
    name: 'test-1',
    description: 'Do some test stuff',
    status: TaskStatus.InProgress,
    priority: TaskPriority.Normal,
    createdOn: new Date(),
    startedOn: new Date(),
    endedOn: null,
    assignedById: 'tester-1',
    assignedByName: 'tester-1',
    assignedOn: new Date(),
    assignedToId: 'tester-2',
    assignedToName: 'tester-2',
    assignedToEmail: 'tester-2@test.co',
  };

  beforeEach(() => {
    knexMock.mockReset();
  });

  it('can be created', () => {
    const result = new PostgresTaskRepository(knexMock as unknown as Knex);
    expect(result).toBeTruthy();
  });

  describe('getTasks', () => {
    it('can get tasks', async () => {
      const queryMock = {
        offset: jest.fn(() => queryMock),
        limit: jest.fn(() => queryMock),
        orderBy: jest.fn(),
      };

      knexMock.mockReturnValueOnce(queryMock);
      queryMock.orderBy.mockReturnValueOnce(queryMock);
      queryMock.orderBy.mockResolvedValueOnce([task]);

      const result = await repository.getTasks(queues, 10, null, null);
      expect(result.results.length).toBe(1);
      expect(result.page.size).toBe(1);
      expect(result.page.after).toBeFalsy();
      expect(result.page.next).toBeFalsy();
      expect(result.results[0].tenantId.toString()).toBe(task.tenant);
      expect(result.results[0].id).toBe(task.id);
      expect(result.results[0].recordId).toBe(task.recordId);
      expect(result.results[0].queue).toBe(queue);
      expect(result.results[0].definition).toBeFalsy();
      expect(result.results[0].context).toBe(task.context);
      expect(result.results[0].name).toBe(task.name);
      expect(result.results[0].description).toBe(task.description);
      expect(result.results[0].status).toBe(task.status);
      expect(result.results[0].priority).toBe(task.priority);
      expect(result.results[0].createdOn).toBe(task.createdOn);
      expect(result.results[0].startedOn).toBe(task.startedOn);
      expect(result.results[0].endedOn).toBeFalsy();
      expect(result.results[0].assignment.assignedOn).toBe(task.assignedOn);
      expect(result.results[0].assignment.assignedBy.id).toBe(task.assignedById);
      expect(result.results[0].assignment.assignedBy.name).toBe(task.assignedByName);
      expect(result.results[0].assignment.assignedTo.id).toBe(task.assignedToId);
      expect(result.results[0].assignment.assignedTo.name).toBe(task.assignedToName);
      expect(result.results[0].assignment.assignedTo.email).toBe(task.assignedToEmail);
    });

    it('can get tasks with tenant criteria', async () => {
      const queryMock = {
        offset: jest.fn(() => queryMock),
        limit: jest.fn(() => queryMock),
        orderBy: jest.fn(),
        where: jest.fn(),
      };

      knexMock.mockReturnValueOnce(queryMock);
      queryMock.orderBy.mockReturnValueOnce(queryMock);
      queryMock.orderBy.mockResolvedValueOnce([task]);

      const result = await repository.getTasks(queues, 10, null, { tenantId });
      expect(result.results.length).toBe(1);
      expect(queryMock.where).toHaveBeenCalledWith(expect.objectContaining({ tenant: tenantId.toString() }));
    });

    it('can get tasks with queue criteria', async () => {
      const queryMock = {
        offset: jest.fn(() => queryMock),
        limit: jest.fn(() => queryMock),
        orderBy: jest.fn(),
        where: jest.fn(),
      };

      knexMock.mockReturnValueOnce(queryMock);
      queryMock.orderBy.mockReturnValueOnce(queryMock);
      queryMock.orderBy.mockResolvedValueOnce([task]);

      const result = await repository.getTasks(queues, 10, null, {
        queue: { namespace: queue.namespace, name: queue.name },
      });
      expect(result.results.length).toBe(1);
      expect(queryMock.where).toHaveBeenCalledWith(
        expect.objectContaining({ queueNamespace: queue.namespace, queueName: queue.name })
      );
    });

    it('can get tasks with definition criteria', async () => {
      const queryMock = {
        offset: jest.fn(() => queryMock),
        limit: jest.fn(() => queryMock),
        orderBy: jest.fn(),
        where: jest.fn(),
      };

      knexMock.mockReturnValueOnce(queryMock);
      queryMock.orderBy.mockReturnValueOnce(queryMock);
      queryMock.orderBy.mockResolvedValueOnce([task]);

      const result = await repository.getTasks(queues, 10, null, {
        definition: { namespace: 'test-service', name: 'run-test' },
      });
      expect(result.results.length).toBe(1);
      expect(queryMock.where).toHaveBeenCalledWith(
        expect.objectContaining({ definitionNamespace: 'test-service', definitionName: 'run-test' })
      );
    });

    it('can get tasks with notEnded criteria', async () => {
      const queryMock = {
        offset: jest.fn(() => queryMock),
        limit: jest.fn(() => queryMock),
        orderBy: jest.fn(),
        where: jest.fn(),
        whereNull: jest.fn(),
      };

      knexMock.mockReturnValueOnce(queryMock);
      queryMock.orderBy.mockReturnValueOnce(queryMock);
      queryMock.orderBy.mockResolvedValueOnce([task]);

      const result = await repository.getTasks(queues, 10, null, {
        notEnded: true,
      });
      expect(result.results.length).toBe(1);
      expect(queryMock.whereNull).toHaveBeenCalledWith('endedOn');
    });

    it('can get tasks with context criteria', async () => {
      const queryMock = {
        offset: jest.fn(() => queryMock),
        limit: jest.fn(() => queryMock),
        orderBy: jest.fn(),
        where: jest.fn(),
        whereRaw: jest.fn(),
      };

      knexMock.mockReturnValueOnce(queryMock);
      queryMock.orderBy.mockReturnValueOnce(queryMock);
      queryMock.orderBy.mockResolvedValueOnce([task]);

      const result = await repository.getTasks(queues, 10, null, {
        context: { value: 'value' },
      });
      expect(result.results.length).toBe(1);
      expect(queryMock.whereRaw).toHaveBeenCalledWith('context @> ?::jsonb', [JSON.stringify({ value: 'value' })]);
    });
  });

  describe('getTask', () => {
    it('can get task', async () => {
      const queryMock = {
        limit: jest.fn(() => queryMock),
        where: jest.fn(),
      };

      knexMock.mockReturnValueOnce(queryMock);
      queryMock.where.mockResolvedValueOnce([task]);

      const result = await repository.getTask(queues, tenantId, task.id);
      expect(queryMock.where).toHaveBeenCalledWith(
        expect.objectContaining({ tenant: tenantId.toString(), id: task.id })
      );
      expect(result.tenantId.toString()).toBe(task.tenant);
      expect(result.id).toBe(task.id);
      expect(result.recordId).toBe(task.recordId);
      expect(result.queue).toBe(queue);
      expect(result.definition).toBeFalsy();
      expect(result.context).toBe(task.context);
      expect(result.name).toBe(task.name);
      expect(result.description).toBe(task.description);
      expect(result.status).toBe(task.status);
      expect(result.priority).toBe(task.priority);
      expect(result.createdOn).toBe(task.createdOn);
      expect(result.startedOn).toBe(task.startedOn);
      expect(result.endedOn).toBeFalsy();
      expect(result.assignment.assignedOn).toBe(task.assignedOn);
      expect(result.assignment.assignedBy.id).toBe(task.assignedById);
      expect(result.assignment.assignedBy.name).toBe(task.assignedByName);
      expect(result.assignment.assignedTo.id).toBe(task.assignedToId);
      expect(result.assignment.assignedTo.name).toBe(task.assignedToName);
      expect(result.assignment.assignedTo.email).toBe(task.assignedToEmail);
    });

    it('can return null for not found.', async () => {
      const queryMock = {
        limit: jest.fn(() => queryMock),
        where: jest.fn(),
      };

      knexMock.mockReturnValueOnce(queryMock);
      queryMock.where.mockResolvedValueOnce([]);

      const result = await repository.getTask(queues, tenantId, task.id);
      expect(result).toBeNull();
    });

    it('can reject for null tenant', async () => {
      const queryMock = {
        limit: jest.fn(() => queryMock),
        where: jest.fn(),
      };

      knexMock.mockReturnValueOnce(queryMock);
      queryMock.where.mockResolvedValueOnce([task]);

      await expect(repository.getTask(queues, null, task.id)).rejects.toThrow();
    });
  });

  describe('save', () => {
    it('can save entity', async () => {
      const queryMock = {
        insert: jest.fn(() => queryMock),
        onConflict: jest.fn(() => queryMock),
        merge: jest.fn(() => queryMock),
        returning: jest.fn(),
      };

      const knex = {
        transaction: jest.fn((cb) => cb(knexMock)),
      };
      knexMock.mockReturnValueOnce(queryMock);
      queryMock.returning.mockResolvedValueOnce([
        {
          tenant: tenantId.toString(),
          id: 'task-2',
          name: 'test-2',
          description: 'test-2',
          status: TaskStatus.Pending,
          priority: TaskPriority.Normal,
          createdOn: new Date(),
          queueNamespace: queue.namespace,
          queueName: queue.name,
        },
      ]);

      const repo = new PostgresTaskRepository(knex as unknown as Knex);
      const result = await repo.save(
        new TaskEntity(repository, queue, { tenantId, name: 'test-2', description: 'test-2' })
      );
      expect(result.tenantId.toString()).toBe(tenantId.toString());
      expect(result.id).toBe('task-2');
      expect(result.queue).toBe(queue);
      expect(result.name).toBe('test-2');
      expect(result.description).toBe('test-2');
      expect(result.status).toBe(TaskStatus.Pending);
      expect(result.priority).toBe(TaskPriority.Normal);
      expect(result.startedOn).toBeFalsy();
      expect(result.endedOn).toBeFalsy();
      expect(result.assignment).toBeFalsy();
    });

    it('can save entity with assignment', async () => {
      const queryMock = {
        insert: jest.fn(() => queryMock),
        onConflict: jest.fn(() => queryMock),
        merge: jest.fn(() => queryMock),
        returning: jest.fn(),
      };

      const knex = {
        transaction: jest.fn((cb) => cb(knexMock)),
      };
      knexMock.mockReturnValueOnce(queryMock);
      queryMock.returning.mockResolvedValueOnce([
        {
          tenant: tenantId.toString(),
          id: 'task-2',
          name: 'test-2',
          description: 'test-2',
          status: TaskStatus.Pending,
          priority: TaskPriority.Normal,
          createdOn: new Date(),
          queueNamespace: queue.namespace,
          queueName: queue.name,
          assignedOn: new Date(),
          assignedById: 'assigner',
          assignedByName: 'assigner',
          assignedToId: 'assigned',
          assignedToName: 'assigned',
          assignedToEmail: 'assigned@test.co',
        },
      ]);

      const repo = new PostgresTaskRepository(knex as unknown as Knex);
      const result = await repo.save(
        new TaskEntity(repository, queue, {
          tenantId,
          id: 'task-1',
          name: 'test-2',
          description: 'test-2',
          assignment: {
            assignedOn: new Date(),
            assignedBy: { id: 'assigner', name: 'assigner' },
            assignedTo: { id: 'assigned', name: 'assigned', email: 'assigned@test.co' },
          },
        })
      );
      expect(result).toBeTruthy();
    });
  });
});
