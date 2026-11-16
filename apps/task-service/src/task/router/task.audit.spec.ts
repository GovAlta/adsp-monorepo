import { adspId, User } from '@abgov/adsp-service-sdk';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { QueueEntity, TaskEntity } from '../model';
import { TaskServiceRoles } from '../roles';
import { TaskPriority, TaskStatus } from '../types';
import { createTask } from './queue';
import { deleteTask, taskOperation, updateTask } from './task';

describe('task audit', () => {
  const apiId = adspId`urn:ads:platform:task-service:v1`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const loggerMock = { debug: jest.fn(), info: jest.fn(), warn: jest.fn() } as unknown as Logger;
  const eventServiceMock = { send: jest.fn() };
  const auditServiceMock = { record: jest.fn(), query: jest.fn(), flush: jest.fn(), droppedEventCount: 0 };
  const commentServiceMock = { createTopic: jest.fn() };
  const repositoryMock = {
    getTask: jest.fn(),
    getTasks: jest.fn(),
    getTaskMetrics: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    delete: jest.fn(),
  };

  const queue = new QueueEntity({
    tenantId,
    namespace: 'intake',
    name: 'review',
    context: {},
    workerRoles: ['test-worker'],
    assignerRoles: ['test-assigner'],
  });

  const worker = { tenantId, id: 'worker-1', name: 'Worker', roles: ['test-worker'] } as User;
  const assigner = { tenantId, id: 'assigner-1', name: 'Assigner', roles: ['test-assigner'] } as User;
  const admin = { tenantId, id: 'admin-1', name: 'Admin', roles: [TaskServiceRoles.Admin] } as User;

  let task: TaskEntity;

  const recorded = () => auditServiceMock.record.mock.calls.map(([action, details]) => ({ action, details }));
  const run = async (handler, req: Record<string, unknown>) => {
    const res = { send: jest.fn() };
    const next = jest.fn();
    await handler(req as unknown as Request, res as unknown as Response, next);
    return { res, next };
  };
  const operation = (user: User, body: Record<string, unknown>) =>
    run(taskOperation(apiId, loggerMock, eventServiceMock, auditServiceMock), { user, body, task });

  beforeEach(() => {
    task = new TaskEntity(repositoryMock, queue, {
      tenantId,
      id: 'task-1',
      name: 'Review application',
      description: 'Review it.',
      recordId: 'record-1',
      context: {},
      queue,
      status: TaskStatus.Pending,
      priority: TaskPriority.Normal,
      createdOn: new Date(),
      startedOn: null,
      endedOn: null,
    });
    auditServiceMock.record.mockReset();
    eventServiceMock.send.mockReset();
    repositoryMock.delete.mockReset();
  });

  it('records task.created with the creating service account and record ID', async () => {
    const serviceAccount = {
      tenantId,
      id: 'sa-1',
      name: 'service-account-form-service',
      roles: [TaskServiceRoles.TaskWriter],
    } as User;
    const handler = createTask(
      apiId,
      loggerMock,
      repositoryMock,
      eventServiceMock,
      commentServiceMock,
      auditServiceMock,
    );
    repositoryMock.save.mockImplementationOnce((entity) => Promise.resolve(Object.assign(entity, { id: 'task-1' })));
    await run(handler, {
      user: serviceAccount,
      tenant: { id: tenantId },
      queue,
      body: { name: 'Review application', recordId: 'record-1' },
    });

    expect(recorded()).toEqual([
      {
        action: expect.objectContaining({ name: 'task.created', severity: 'info' }),
        details: expect.objectContaining({
          tenantId,
          actor: expect.objectContaining({ id: 'sa-1', type: 'service' }),
          resource: { type: 'task', id: 'task-1', name: 'Review application' },
          correlationId: 'record-1',
          metadata: {
            queueNamespace: 'intake',
            queueName: 'review',
            taskName: 'Review application',
            recordId: 'record-1',
          },
        }),
      },
    ]);
  });

  it('does not record task.created for unauthorized user', async () => {
    const handler = createTask(
      apiId,
      loggerMock,
      repositoryMock,
      eventServiceMock,
      commentServiceMock,
      auditServiceMock,
    );
    const { next } = await run(handler, { user: worker, tenant: { id: tenantId }, queue, body: { name: 'test' } });
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(auditServiceMock.record).not.toHaveBeenCalled();
  });

  it('records each transition of the task lifecycle', async () => {
    await operation(worker, {
      operation: 'assign',
      assignTo: { id: worker.id, name: worker.name, email: 'w@test.co' },
    });
    await operation(worker, { operation: 'start' });
    await operation(worker, { operation: 'complete' });

    expect(recorded().map(({ action }) => [action.name, action.severity])).toEqual([
      ['task.self-assigned', 'info'],
      ['task.started', 'info'],
      ['task.completed', 'info'],
    ]);
    for (const { details } of recorded()) {
      expect(details).toEqual(
        expect.objectContaining({
          tenantId,
          actor: expect.objectContaining({ id: worker.id, type: 'user' }),
          resource: { type: 'task', id: 'task-1', name: 'Review application' },
          correlationId: 'record-1',
          metadata: expect.objectContaining({ recordId: 'record-1', queueNamespace: 'intake', queueName: 'review' }),
        }),
      );
    }
  });

  it('records task.assigned with assignee identity when assigned to another person', async () => {
    await operation(assigner, {
      operation: 'assign',
      assignTo: { id: 'worker-1', name: 'Worker', email: 'worker@test.co' },
    });

    expect(recorded()).toEqual([
      {
        action: expect.objectContaining({ name: 'task.assigned' }),
        details: expect.objectContaining({
          actor: expect.objectContaining({ id: assigner.id }),
          metadata: expect.objectContaining({
            assignedTo: { id: 'worker-1', name: 'Worker' },
            previousAssignedTo: null,
          }),
        }),
      },
    ]);
  });

  it('records task.assigned when a task is unassigned', async () => {
    task.assignment = {
      assignedOn: new Date(),
      assignedBy: { id: assigner.id, name: assigner.name },
      assignedTo: { id: 'worker-1', name: 'Worker', email: 'worker@test.co' },
    };
    await operation(assigner, { operation: 'assign' });

    expect(recorded()).toEqual([
      {
        action: expect.objectContaining({ name: 'task.assigned' }),
        details: expect.objectContaining({
          metadata: expect.objectContaining({
            assignedTo: null,
            previousAssignedTo: { id: 'worker-1', name: 'Worker' },
          }),
        }),
      },
    ]);
  });

  it('records task.cancelled with warning severity and without the reason text', async () => {
    await operation(worker, { operation: 'cancel', reason: 'Duplicate of another application.' });

    const [{ action, details }] = recorded();
    expect(action).toEqual(expect.objectContaining({ name: 'task.cancelled', severity: 'warning' }));
    expect(details.metadata).toEqual(expect.objectContaining({ previousStatus: 'Pending', reasonProvided: true }));
    expect(JSON.stringify(details)).not.toContain('Duplicate');
  });

  it('records task.priority-changed with the change set', async () => {
    await operation(assigner, { operation: 'set-priority', priority: 'Urgent' });

    expect(recorded()).toEqual([
      {
        action: expect.objectContaining({ name: 'task.priority-changed' }),
        details: expect.objectContaining({
          changeSet: { before: { priority: 'Normal' }, after: { priority: 'Urgent' } },
        }),
      },
    ]);
  });

  it('does not record task.priority-changed when the priority is unchanged', async () => {
    await operation(assigner, { operation: 'set-priority', priority: 'Normal' });
    expect(eventServiceMock.send).toHaveBeenCalled();
    expect(auditServiceMock.record).not.toHaveBeenCalled();
  });

  it('records task.priority-changed when priority is changed by update', async () => {
    const handler = updateTask(apiId, loggerMock, eventServiceMock, auditServiceMock);
    await run(handler, { user: admin, body: { priority: TaskPriority.High }, task });

    expect(recorded()).toEqual([
      {
        action: expect.objectContaining({ name: 'task.priority-changed' }),
        details: expect.objectContaining({
          changeSet: { before: { priority: 'Normal' }, after: { priority: 'High' } },
        }),
      },
    ]);
  });

  it('does not record update without a priority change', async () => {
    const handler = updateTask(apiId, loggerMock, eventServiceMock, auditServiceMock);
    await run(handler, { user: admin, body: { description: 'Updated.' }, task });
    expect(eventServiceMock.send).toHaveBeenCalled();
    expect(auditServiceMock.record).not.toHaveBeenCalled();
  });

  it('does not record unauthorized or invalid operations', async () => {
    const reader = { tenantId, id: 'reader-1', name: 'Reader', roles: [TaskServiceRoles.TaskReader] } as User;
    const { next: startNext } = await operation(reader, { operation: 'start' });
    const { next: completeNext } = await operation(worker, { operation: 'complete' });
    const { next: unknownNext } = await operation(worker, { operation: 'stop' });

    expect(startNext).toHaveBeenCalledWith(expect.any(Error));
    expect(completeNext).toHaveBeenCalledWith(expect.any(Error));
    expect(unknownNext).toHaveBeenCalledWith(expect.any(Error));
    expect(auditServiceMock.record).not.toHaveBeenCalled();
  });

  it('records task.deleted when a task is deleted', async () => {
    repositoryMock.delete.mockResolvedValueOnce(true);
    const handler = deleteTask(apiId, loggerMock, eventServiceMock, auditServiceMock);
    await run(handler, { user: admin, task });

    expect(recorded()).toEqual([
      {
        action: expect.objectContaining({ name: 'task.deleted', severity: 'warning' }),
        details: expect.objectContaining({
          actor: expect.objectContaining({ id: admin.id }),
          resource: { type: 'task', id: 'task-1', name: 'Review application' },
        }),
      },
    ]);
  });

  it('does not record task.deleted when nothing is deleted', async () => {
    repositoryMock.delete.mockResolvedValueOnce(false);
    const handler = deleteTask(apiId, loggerMock, eventServiceMock, auditServiceMock);
    await run(handler, { user: admin, task });
    expect(auditServiceMock.record).not.toHaveBeenCalled();
  });
});
