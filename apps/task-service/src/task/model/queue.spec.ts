import { adspId, User } from '@abgov/adsp-service-sdk';
import { TaskServiceRoles } from '../roles';
import { QueueEntity } from './queue';

describe('QueueEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  it('can be created', () => {
    const entity = new QueueEntity({
      tenantId,
      namespace: 'test-service',
      name: 'test',
      context: {},
      workerRoles: [],
      assignerRoles: [],
    });
    expect(entity).toBeTruthy();
  });

  describe('canAssignTask', () => {
    it('can return false for user without role', () => {
      const entity = new QueueEntity({
        tenantId,
        namespace: 'test-service',
        name: 'test',
        context: {},
        workerRoles: [],
        assignerRoles: ['task-assigner'],
      });

      const canAssign = entity.canAssignTask({ id: 'test', tenantId, roles: [] } as User);
      expect(canAssign).toBeFalsy();
    });

    it('can return true for task assigner', () => {
      const entity = new QueueEntity({
        tenantId,
        namespace: 'test-service',
        name: 'test',
        context: {},
        workerRoles: [],
        assignerRoles: ['task-assigner'],
      });

      const canAssign = entity.canAssignTask({ id: 'test', tenantId, roles: ['task-assigner'] } as User);
      expect(canAssign).toBeTruthy();
    });

    it('can return true for task admin', () => {
      const entity = new QueueEntity({
        tenantId,
        namespace: 'test-service',
        name: 'test',
        context: {},
        workerRoles: [],
        assignerRoles: ['task-assigner'],
      });

      const canAssign = entity.canAssignTask({ id: 'test', tenantId, roles: [TaskServiceRoles.Admin] } as User);
      expect(canAssign).toBeTruthy();
    });
  });

  describe('canWorkOnTask', () => {
    it('can return false for user without role', () => {
      const entity = new QueueEntity({
        tenantId,
        namespace: 'test-service',
        name: 'test',
        context: {},
        workerRoles: ['task-worker'],
        assignerRoles: [],
      });

      const canWorkOn = entity.canWorkOnTask({ id: 'test', tenantId, roles: [] } as User);
      expect(canWorkOn).toBeFalsy();
    });

    it('can return true for task worker', () => {
      const entity = new QueueEntity({
        tenantId,
        namespace: 'test-service',
        name: 'test',
        context: {},
        workerRoles: ['task-worker'],
        assignerRoles: [],
      });

      const canWorkOn = entity.canWorkOnTask({ id: 'test', tenantId, roles: ['task-worker'] } as User);
      expect(canWorkOn).toBeTruthy();
    });
  });

  describe('canAccessTask', () => {
    it('can return false for user without role', () => {
      const entity = new QueueEntity({
        tenantId,
        namespace: 'test-service',
        name: 'test',
        context: {},
        workerRoles: ['task-worker'],
        assignerRoles: ['task-assigner'],
      });

      const canAccess = entity.canAccessTask({ id: 'test', tenantId, roles: [] } as User);
      expect(canAccess).toBeFalsy();
    });

    it('can return true for task worker', () => {
      const entity = new QueueEntity({
        tenantId,
        namespace: 'test-service',
        name: 'test',
        context: {},
        workerRoles: ['task-worker'],
        assignerRoles: ['task-assigner'],
      });

      const canAccess = entity.canAccessTask({ id: 'test', tenantId, roles: ['task-worker'] } as User);
      expect(canAccess).toBeTruthy();
    });

    it('can return true for task assigner', () => {
      const entity = new QueueEntity({
        tenantId,
        namespace: 'test-service',
        name: 'test',
        context: {},
        workerRoles: ['task-worker'],
        assignerRoles: ['task-assigner'],
      });

      const canAccess = entity.canAccessTask({ id: 'test', tenantId, roles: ['task-assigner'] } as User);
      expect(canAccess).toBeTruthy();
    });

    it('can return true for task admin', () => {
      const entity = new QueueEntity({
        tenantId,
        namespace: 'test-service',
        name: 'test',
        context: {},
        workerRoles: ['task-worker'],
        assignerRoles: ['task-assigner'],
      });

      const canAccess = entity.canAccessTask({ id: 'test', tenantId, roles: [TaskServiceRoles.Admin] } as User);
      expect(canAccess).toBeTruthy();
    });

    it('can return true for task reader', () => {
      const entity = new QueueEntity({
        tenantId,
        namespace: 'test-service',
        name: 'test',
        context: {},
        workerRoles: ['task-worker'],
        assignerRoles: ['task-assigner'],
      });

      const canAccess = entity.canAccessTask({ id: 'test', tenantId, roles: [TaskServiceRoles.TaskReader] } as User);
      expect(canAccess).toBeTruthy();
    });
  });

  describe('getTasks', () => {
    const repositoryMock = {
      getTask: jest.fn(),
      getTasks: jest.fn(),
      save: jest.fn(),
    };

    beforeEach(() => {
      repositoryMock.getTasks.mockClear();
    });

    it('can get tasks', async () => {
      const entity = new QueueEntity({
        tenantId,
        namespace: 'test-service',
        name: 'test',
        context: {},
        workerRoles: ['task-worker'],
        assignerRoles: ['task-assigner'],
      });

      const page = { results: [], page: {} };
      repositoryMock.getTasks.mockResolvedValueOnce(page);
      const result = await entity.getTasks(
        { id: 'test', tenantId, roles: ['task-worker'] } as User,
        repositoryMock,
        10,
        null
      );
      expect(result).toBe(page);
      expect(repositoryMock.getTasks).toHaveBeenCalledWith(
        expect.objectContaining({ [`${entity.namespace}:${entity.name}`]: entity }),
        10,
        null,
        expect.objectContaining({ queue: { namespace: entity.namespace, name: entity.name }, notEnded: true })
      );
    });

    it('can throw for user without access', async () => {
      const entity = new QueueEntity({
        tenantId,
        namespace: 'test-service',
        name: 'test',
        context: {},
        workerRoles: ['task-worker'],
        assignerRoles: ['task-assigner'],
      });

      await expect(
        entity.getTasks({ id: 'test', tenantId, name: 'test', roles: [] } as User, repositoryMock, 10, null)
      ).rejects.toThrow(/User test \(ID: test\) not permitted to access queued tasks./);
    });
  });
});
