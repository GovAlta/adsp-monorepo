import { adspId, auditDefinitions, User } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import {
  recordTaskAudit,
  TaskAssignedAuditAction,
  TaskAuditActions,
  TaskCreatedAuditAction,
  TaskSelfAssignedAuditAction,
  toTaskAssignmentAuditAction,
  toTaskAssignmentAuditDetails,
  toTaskAuditDetails,
  toTaskCancelledAuditDetails,
  toTaskPriorityChangedAuditDetails,
} from './audit';
import { TaskPriority, TaskStatus } from './types';

describe('audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user = { id: 'user-1', name: 'Tester', email: 'tester@test.co', roles: ['test-worker'] } as User;
  const task = {
    tenantId,
    id: 'task-1',
    name: 'Review application',
    recordId: 'record-1',
    queue: { namespace: 'intake', name: 'review' },
  };

  it('has the expected action catalog', () => {
    expect(auditDefinitions(TaskAuditActions)).toEqual({
      'task.created': expect.objectContaining({ category: 'administrative', severity: 'info', resourceType: 'task' }),
      'task.assigned': expect.objectContaining({ category: 'administrative', severity: 'info', resourceType: 'task' }),
      'task.self-assigned': expect.objectContaining({
        category: 'administrative',
        severity: 'info',
        resourceType: 'task',
      }),
      'task.started': expect.objectContaining({ category: 'administrative', severity: 'info', resourceType: 'task' }),
      'task.completed': expect.objectContaining({ category: 'administrative', severity: 'info', resourceType: 'task' }),
      'task.cancelled': expect.objectContaining({
        category: 'administrative',
        severity: 'warning',
        resourceType: 'task',
      }),
      'task.priority-changed': expect.objectContaining({
        category: 'administrative',
        severity: 'info',
        resourceType: 'task',
        captureChangeSet: true,
      }),
      'task.deleted': expect.objectContaining({
        category: 'administrative',
        severity: 'warning',
        resourceType: 'task',
      }),
    });
    // Retention class is derived from the category.
    expect(TaskAuditActions.every((action) => action.version === 1 && action.retentionClass === undefined)).toBe(true);
  });

  describe('toTaskAuditDetails', () => {
    it('can build details with record ID as correlation ID', () => {
      expect(toTaskAuditDetails(user, task, { extra: true })).toEqual({
        tenantId,
        actor: { id: 'user-1', type: 'user', name: 'Tester', email: 'tester@test.co', roles: ['test-worker'] },
        resource: { type: 'task', id: 'task-1', name: 'Review application' },
        correlationId: 'record-1',
        metadata: {
          queueNamespace: 'intake',
          queueName: 'review',
          taskName: 'Review application',
          recordId: 'record-1',
          extra: true,
        },
      });
    });

    it('can build details for task without record ID', () => {
      const details = toTaskAuditDetails(user, { ...task, recordId: undefined });
      expect(details.correlationId).toBeUndefined();
      expect(details.metadata.recordId).toBeNull();
    });

    it('can build details with record ID URN', () => {
      const recordId = adspId`urn:ads:platform:form-service:v1:/forms/form-1`;
      const details = toTaskAuditDetails(user, { ...task, recordId });
      expect(details.correlationId).toBe(recordId.toString());
      expect(details.metadata.recordId).toBe(recordId.toString());
    });

    it('can map service account to service actor', () => {
      const details = toTaskAuditDetails({ ...user, name: 'service-account-form-service' }, task);
      expect(details.actor.type).toBe('service');
    });
  });

  describe('assignment', () => {
    const assignment = (id: string) => ({
      assignedOn: new Date(),
      assignedBy: { id: user.id, name: user.name },
      assignedTo: { id, name: `${id} name`, email: `${id}@test.co` },
    });

    it('can select self-assigned action', () => {
      expect(toTaskAssignmentAuditAction(user, { assignment: assignment(user.id) })).toBe(TaskSelfAssignedAuditAction);
    });

    it('can select assigned action for other assignee', () => {
      expect(toTaskAssignmentAuditAction(user, { assignment: assignment('user-2') })).toBe(TaskAssignedAuditAction);
    });

    it('can select assigned action for unassignment', () => {
      expect(toTaskAssignmentAuditAction(user, { assignment: { assignedOn: new Date(), assignedBy: user } })).toBe(
        TaskAssignedAuditAction,
      );
    });

    it('can build details with assignee identity but no email', () => {
      const details = toTaskAssignmentAuditDetails(
        user,
        { ...task, assignment: assignment('user-2') },
        assignment('user-3'),
      );
      expect(details.metadata).toEqual(
        expect.objectContaining({
          assignedTo: { id: 'user-2', name: 'user-2 name' },
          previousAssignedTo: { id: 'user-3', name: 'user-3 name' },
        }),
      );
    });

    it('can build details for unassignment', () => {
      const details = toTaskAssignmentAuditDetails(
        user,
        { ...task, assignment: { assignedOn: new Date(), assignedBy: user } },
        assignment('user-2'),
      );
      expect(details.metadata).toEqual(
        expect.objectContaining({ assignedTo: null, previousAssignedTo: { id: 'user-2', name: 'user-2 name' } }),
      );
    });
  });

  it('can build priority changed details with change set', () => {
    const details = toTaskPriorityChangedAuditDetails(
      user,
      { ...task, priority: TaskPriority.Urgent },
      TaskPriority.Normal,
    );
    expect(details.changeSet).toEqual({ before: { priority: 'Normal' }, after: { priority: 'Urgent' } });
    expect(details.metadata.priority).toBe('Urgent');
  });

  it('can build cancelled details without reason text', () => {
    const details = toTaskCancelledAuditDetails(user, task, TaskStatus.InProgress, 'Contains personal details');
    expect(details.metadata).toEqual(expect.objectContaining({ previousStatus: 'In Progress', reasonProvided: true }));
    expect(JSON.stringify(details)).not.toContain('Contains personal details');
    expect(toTaskCancelledAuditDetails(user, task, TaskStatus.Pending).metadata.reasonProvided).toBe(false);
  });

  describe('recordTaskAudit', () => {
    const loggerMock = { warn: jest.fn() } as unknown as Logger;
    const auditServiceMock = { record: jest.fn(), query: jest.fn(), flush: jest.fn(), droppedEventCount: 0 };

    beforeEach(() => {
      auditServiceMock.record.mockReset();
      (loggerMock.warn as jest.Mock).mockReset();
    });

    it('can record event', () => {
      const details = toTaskAuditDetails(user, task);
      recordTaskAudit(auditServiceMock, loggerMock, TaskCreatedAuditAction, () => details);
      expect(auditServiceMock.record).toHaveBeenCalledWith(TaskCreatedAuditAction, details);
    });

    it('can log instead of throwing when details cannot be built', () => {
      expect(() =>
        recordTaskAudit(auditServiceMock, loggerMock, TaskCreatedAuditAction, () => toTaskAuditDetails(null, task)),
      ).not.toThrow();
      expect(auditServiceMock.record).not.toHaveBeenCalled();
      expect(loggerMock.warn).toHaveBeenCalled();
    });
  });
});
