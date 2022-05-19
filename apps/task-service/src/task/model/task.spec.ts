import { adspId, User } from '@abgov/adsp-service-sdk';
import { TaskServiceRoles } from '../roles';
import { TaskPriority, TaskStatus } from '../types';
import { QueueEntity } from './queue';
import { TaskEntity } from './task';

describe('TaskEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const queue = new QueueEntity({
    tenantId,
    namespace: 'test-service',
    name: 'test',
    context: {},
    workerRoles: ['test-worker'],
    assignerRoles: ['test-assigner'],
  });

  const repositoryMock = {
    getTask: jest.fn(),
    getTasks: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
  };

  it('can be constructed', () => {
    const entity = new TaskEntity(repositoryMock, queue, {
      tenantId: queue.tenantId,
      id: 'test',
      name: 'test-1',
      description: 'testing 123',
      priority: TaskPriority.High,
      status: TaskStatus.InProgress,
      createdOn: new Date(),
      startedOn: new Date(),
    });
    expect(entity).toBeTruthy();
    expect(entity.id).toBe('test');
    expect(entity.priority).toBe(TaskPriority.High);
    expect(entity.status).toBe(TaskStatus.InProgress);
  });

  describe('create', () => {
    it('can create task', async () => {
      const entity = await TaskEntity.create(
        { id: 'test', name: 'test', tenantId, roles: [TaskServiceRoles.TaskWriter] } as User,
        repositoryMock,
        queue,
        {
          tenantId,
          name: 'test',
        }
      );

      expect(entity).toBeTruthy();
      expect(entity.name).toBe('test');
      expect(entity.priority).toBe(TaskPriority.Normal);
      expect(entity.status).toBe(TaskStatus.Pending);
      expect(entity.createdOn).toBeTruthy();
    });

    it('can create task for admin', async () => {
      const entity = await TaskEntity.create(
        { id: 'test', name: 'test', tenantId, roles: [TaskServiceRoles.Admin] } as User,
        repositoryMock,
        queue,
        {
          tenantId,
          name: 'test',
        }
      );

      expect(entity).toBeTruthy();
    });

    it('can throw for unauthorized user', () => {
      expect(() =>
        TaskEntity.create({ id: 'test', name: 'test', tenantId, roles: [] } as User, repositoryMock, queue, {
          tenantId,
          name: 'test',
        })
      ).toThrow(/User test \(ID: test\) not permitted to create task./);
    });

    it('can throw for no name', () => {
      expect(() =>
        TaskEntity.create(
          { id: 'test', name: 'test', tenantId, roles: [TaskServiceRoles.TaskWriter] } as User,
          repositoryMock,
          queue,
          {
            tenantId,
            name: null,
          }
        )
      ).toThrow(/Task must have a name./);
    });
  });

  describe('update', () => {
    it('can update', async () => {
      const user = { id: 'test', name: 'test', tenantId, roles: [TaskServiceRoles.TaskWriter] } as User;
      const entity = await TaskEntity.create(user, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      const result = await entity.update(user, {
        name: 'test-2',
        description: 'testing 123',
        context: { a: 'a' },
        data: { b: 12 },
      });
      expect(result.name).toBe('test-2');
      expect(result.description).toBe('testing 123');
      expect(result.context.a).toBe('a');
      expect(result.data.b).toBe(12);
    });

    it('can update for admin', async () => {
      const user = { id: 'test', name: 'test', tenantId, roles: [TaskServiceRoles.Admin] } as User;
      const entity = await TaskEntity.create(user, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      const result = await entity.update(user, { name: 'test-2', description: 'testing 123' });
      expect(result.name).toBe('test-2');
    });

    it('can throw for unauthorized', async () => {
      const user = { id: 'test', name: 'test', tenantId, roles: [TaskServiceRoles.TaskWriter] } as User;
      const entity = await TaskEntity.create(user, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      expect(() => entity.update({ ...user, roles: [] }, { name: 'test-2', description: 'testing 123' })).toThrow(
        /User test \(ID: test\) not permitted to update task./
      );
    });
  });

  describe('setPriority', () => {
    it('can set priority', async () => {
      const user = { id: 'test', name: 'test', tenantId, roles: [TaskServiceRoles.TaskWriter] } as User;
      const entity = await TaskEntity.create(user, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      const result = await entity.setPriority(user, TaskPriority.High);
      expect(result.priority).toBe(TaskPriority.High);
    });

    it('can set priority for admin', async () => {
      const user = { id: 'test', name: 'test', tenantId, roles: [TaskServiceRoles.Admin] } as User;
      const entity = await TaskEntity.create(user, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      const result = await entity.setPriority(user, TaskPriority.Urgent);
      expect(result.priority).toBe(TaskPriority.Urgent);
    });

    it('can set priority for assigner', async () => {
      const user = { id: 'test', name: 'test', tenantId, roles: ['test-assigner'] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      const result = await entity.setPriority(user, TaskPriority.Urgent);
      expect(result.priority).toBe(TaskPriority.Urgent);
    });

    it('can throw for unauthorized', async () => {
      const user = { id: 'test', name: 'test', tenantId, roles: [TaskServiceRoles.TaskWriter] } as User;
      const entity = await TaskEntity.create(user, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      expect(() => entity.setPriority({ ...user, roles: [] }, TaskPriority.High)).toThrow(
        /User test \(ID: test\) not permitted to set task priority./
      );
    });

    it('can throw for invalid priority', async () => {
      const user = { id: 'test', name: 'test', tenantId, roles: [TaskServiceRoles.Admin] } as User;
      const entity = await TaskEntity.create(user, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      expect(() => entity.setPriority(user, 4 as TaskPriority)).toThrow(/Specified priority '4' not recognized./);
    });
  });

  describe('assign', () => {
    it('can assign', async () => {
      const user = { id: 'test', name: 'test-user', tenantId, roles: ['test-assigner'] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      const result = await entity.assign(user, { id: 'test-2', name: 'test-2', email: 'test-2@test.co' });
      expect(result.assignment).toBeTruthy();
      expect(result.assignment.assignedBy.id).toBe('test');
      expect(result.assignment.assignedBy.name).toBe('test-user');
      expect(result.assignment.assignedOn).toBeTruthy();
      expect(result.assignment.assignedTo.id).toBe('test-2');
      expect(result.assignment.assignedTo.name).toBe('test-2');
    });

    it('can unassign', async () => {
      const user = { id: 'test', name: 'test-user', tenantId, roles: ['test-assigner'] } as User;
      let entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      entity = await entity.assign(user, { id: 'test', name: 'test', email: 'test@test.co' });
      expect(entity.assignment).toBeTruthy();

      const result = await entity.assign(user, null);
      expect(result.assignment).toBeNull();
    });

    it('can self assign for worker', async () => {
      const user = { id: 'test', name: 'test-user', tenantId, roles: ['test-worker'] } as User;
      let entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      entity = await entity.assign(user, { id: 'test', name: 'test', email: 'test@test.co' });
      expect(entity.assignment).toBeTruthy();
      expect(entity.assignment.assignedBy.id).toBe('test');
      expect(entity.assignment.assignedBy.name).toBe('test-user');
      expect(entity.assignment.assignedOn).toBeTruthy();
      expect(entity.assignment.assignedTo.id).toBe('test');
      expect(entity.assignment.assignedTo.name).toBe('test');

      const result = await entity.assign(user, null);
      expect(result.assignment).toBeNull();
    });

    it('can throw for worker assigning other', async () => {
      const user = { id: 'test', name: 'test', tenantId, roles: ['test-worker'] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      expect(() => entity.assign(user, { id: 'test-2', name: 'test-2', email: 'test-2@test.co' })).toThrow(
        /User test \(ID: test\) not permitted to assign task./
      );
    });

    it('can throw for unauthorized', async () => {
      const user = { id: 'test', name: 'test', tenantId, roles: [] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      expect(() => entity.assign(user, { id: 'test', name: 'test', email: 'test@test.co' })).toThrow(
        /User test \(ID: test\) not permitted to assign task./
      );
    });

    it('can unassign ended task', async () => {
      const user = { id: 'test', name: 'test-user', tenantId, roles: ['test-assigner'] } as User;
      let entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      entity = await entity.assign(user, { id: 'test-2', name: 'test-2', email: 'test-2@test.co' });
      entity = await entity.cancel(user);
      const result = await entity.assign(user, null);
      expect(result.assignment).toBeNull();
    });

    it('can throw for ended task', async () => {
      const user = { id: 'test', name: 'test-user', tenantId, roles: ['test-assigner'] } as User;
      let entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      entity = await entity.cancel(user);
      expect(() => entity.assign(user, { id: 'test', name: 'test', email: 'test@test.co' })).toThrow(
        /Cannot assign Completed or Cancelled task./
      );
    });
  });

  describe('canProgressTask', () => {
    it('can return true for worker', async () => {
      const user = { id: 'test', name: 'test-user', tenantId, roles: ['test-worker'] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      const result = entity.canProgressTask(user);
      expect(result).toBeTruthy();
    });

    it('can return false for non-worker', async () => {
      const user = { id: 'test', name: 'test-user', tenantId, roles: [] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      const result = entity.canProgressTask(user);
      expect(result).toBeFalsy();
    });

    it('can return true for assigned worker', async () => {
      const user = { id: 'test', name: 'test-user', tenantId, roles: ['test-worker'] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      entity.assign({ ...user, roles: [TaskServiceRoles.Admin] }, { id: 'test', name: 'test', email: 'test@test.co' });
      const result = entity.canProgressTask(user);
      expect(result).toBeTruthy();
    });

    it('can return false for worker other than assigned', async () => {
      const user = { id: 'test', name: 'test-user', tenantId, roles: ['test-worker'] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      entity.assign(
        { ...user, roles: [TaskServiceRoles.Admin] },
        { id: 'test-2', name: 'test-2', email: 'test-2@test.co' }
      );
      const result = entity.canProgressTask(user);
      expect(result).toBeFalsy();
    });
  });

  describe('start', () => {
    it('can start task for worker', async () => {
      const user = { id: 'test', name: 'test-user', tenantId, roles: ['test-worker'] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      const result = await entity.start(user);
      expect(result.status).toBe(TaskStatus.InProgress);
      expect(result.startedOn).toBeTruthy();
    });

    it('can start assigned task', async () => {
      const user = { id: 'test', name: 'test-user', tenantId, roles: ['test-worker'] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      entity.assign({ ...user, roles: [TaskServiceRoles.Admin] }, { id: 'test', name: 'test', email: 'test@test.co' });
      const result = await entity.start(user);
      expect(result.status).toBe(TaskStatus.InProgress);
      expect(result.startedOn).toBeTruthy();
    });

    it('can throw for start of task assigned to other', async () => {
      const user = { id: 'test', name: 'test', tenantId, roles: ['test-worker'] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      entity.assign(
        { ...user, roles: [TaskServiceRoles.Admin] },
        { id: 'test-2', name: 'test-2', email: 'test-2@test.co' }
      );
      expect(() => entity.start(user)).toThrow(/User test \(ID: test\) not permitted to start task./);
    });

    it('can throw for start of task not in pending', async () => {
      const user = { id: 'test', name: 'test', tenantId, roles: ['test-worker'] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      entity.cancel(user);
      expect(() => entity.start(user)).toThrow(/Can only start tasks that are Pending./);
    });
  });

  describe('complete', () => {
    it('can complete task for worker', async () => {
      const user = { id: 'test', name: 'test-user', tenantId, roles: ['test-worker'] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      await entity.start(user);
      const result = await entity.complete(user);
      expect(result.status).toBe(TaskStatus.Completed);
      expect(result.endedOn).toBeTruthy();
    });

    it('can complete assigned task', async () => {
      const user = { id: 'test', name: 'test-user', tenantId, roles: ['test-worker'] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      entity.assign({ ...user, roles: [TaskServiceRoles.Admin] }, { id: 'test', name: 'test', email: 'test@test.co' });

      await entity.start(user);
      const result = await entity.complete(user);
      expect(result.status).toBe(TaskStatus.Completed);
      expect(result.endedOn).toBeTruthy();
    });

    it('can throw for non-worker', async () => {
      const user = { id: 'test', name: 'test-user', tenantId, roles: [] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      await entity.start({ ...user, roles: ['test-worker'] });
      expect(() => entity.complete(user)).toThrow(/User test-user \(ID: test\) not permitted to complete task./);
    });

    it('can throw for complete of task not in progress', async () => {
      const user = { id: 'test', name: 'test', tenantId, roles: ['test-worker'] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      entity.cancel(user);
      expect(() => entity.complete(user)).toThrow(/Can only complete tasks that are In Progress./);
    });
  });

  describe('cancel', () => {
    it('can cancel task for worker', async () => {
      const user = { id: 'test', name: 'test-user', tenantId, roles: ['test-worker'] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      const result = await entity.cancel(user);
      expect(result.status).toBe(TaskStatus.Cancelled);
      expect(result.endedOn).toBeTruthy();
    });

    it('can cancel task for assigner', async () => {
      const user = { id: 'test', name: 'test-user', tenantId, roles: ['test-assigner'] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      entity.assign(user, { id: 'test-2', name: 'test-2', email: 'test-2@test.co' });

      const result = await entity.cancel(user);
      expect(result.status).toBe(TaskStatus.Cancelled);
      expect(result.endedOn).toBeTruthy();
    });

    it('can cancel assigned task', async () => {
      const user = { id: 'test', name: 'test-user', tenantId, roles: ['test-worker'] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      entity.assign({ ...user, roles: [TaskServiceRoles.Admin] }, { id: 'test', name: 'test', email: 'test@test.co' });

      const result = await entity.cancel(user);
      expect(result.status).toBe(TaskStatus.Cancelled);
      expect(result.endedOn).toBeTruthy();
    });

    it('can throw for unauthorized', async () => {
      const user = { id: 'test', name: 'test-user', tenantId, roles: [] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      expect(() => entity.cancel(user)).toThrow(/User test-user \(ID: test\) not permitted to cancel task./);
    });

    it('can throw for cancel of ended task', async () => {
      const user = { id: 'test', name: 'test', tenantId, roles: ['test-worker'] } as User;
      const entity = await TaskEntity.create({ ...user, roles: [TaskServiceRoles.Admin] }, repositoryMock, queue, {
        tenantId,
        name: 'test',
      });

      entity.cancel(user);
      expect(() => entity.cancel(user)).toThrow(/Can only cancel tasks that are Pending or In Progress./);
    });
  });
});
