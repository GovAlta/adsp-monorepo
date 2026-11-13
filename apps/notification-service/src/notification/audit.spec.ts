import { adspId, AuditService, resolveRetentionClass, User } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import {
  createNotificationAuditor,
  getNotificationAuditActions,
  NotificationAuditActions,
  NotificationJobAuditActor,
  SubscriberCreatedAuditAction,
  toNotificationAuditDetails,
  toSubscriberAuditDetails,
  toSubscriptionAuditDetails,
} from './audit';
import { Channel, Notification } from './types';

describe('notification audit', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user = {
    id: 'user-1',
    name: 'tester',
    email: 'tester@example.com',
    tenantId,
    roles: ['subscription-admin'],
  } as unknown as User;
  const logger = { warn: jest.fn() } as unknown as Logger & { warn: jest.Mock };
  const auditService = { record: jest.fn(), flush: jest.fn() } as unknown as AuditService & { record: jest.Mock };

  const notification: Notification = {
    tenantId: tenantId.toString(),
    type: { id: 'type-1', name: 'Type 1' },
    event: { namespace: 'test', name: 'happened', timestamp: new Date() },
    channel: Channel.email,
    to: 'tester@example.com',
    message: { subject: 'Secret subject', body: 'Secret body' },
    subscriber: { id: 'subscriber-1', userId: 'user-1', addressAs: 'Tester' },
    correlationId: 'correlation-1',
    context: { value: 1 },
  };

  beforeEach(() => jest.clearAllMocks());

  it('keeps standard retention for routine subscription and runtime actions, and compliance for the rest', () => {
    expect(Object.fromEntries(NotificationAuditActions.map((a) => [a.name, resolveRetentionClass(a)]))).toEqual({
      'subscriber.created': 'standard',
      'subscriber.updated': 'standard',
      'subscriber.deleted': 'compliance',
      'subscription.created': 'standard',
      'subscription.updated': 'standard',
      'subscription.deleted': 'standard',
      'notification.sent': 'standard',
      'notification.send-failed': 'standard',
      'notification.direct-sent': 'standard',
      'notification.direct-send-failed': 'standard',
      'notification-type.created': 'compliance',
      'notification-type.updated': 'compliance',
      'notification-type.deleted': 'compliance',
    });
  });

  it('only sets retention class where it overrides the category default', () => {
    NotificationAuditActions.filter((a) => a.retentionClass).forEach((a) =>
      expect(resolveRetentionClass({ ...a, retentionClass: undefined })).not.toBe(a.retentionClass),
    );
  });

  it('does not end action names with an outcome suffix that audit service strips before catalog lookup', () => {
    NotificationAuditActions.forEach((a) => expect(a.name).not.toMatch(/\.(succeeded|failed)$/));
  });

  it('registers thirteen uniquely named actions', () => {
    expect(NotificationAuditActions).toHaveLength(13);
    expect(new Set(NotificationAuditActions.map((a) => a.name)).size).toBe(13);
  });

  it.each([
    ['a subscriber', notification, 'notification.sent', 'notification.send-failed'],
    ['no subscriber', { ...notification, subscriber: undefined }, 'notification.direct-sent', 'notification.direct-send-failed'],
  ])('uses sent and failed actions whose resource type matches the record for %s', (_, value, sent, failed) => {
    const actions = getNotificationAuditActions(value);
    const { resource } = toNotificationAuditDetails(value);
    expect([actions.sent.name, actions.failed.name]).toEqual([sent, failed]);
    expect(actions.sent.resourceType).toBe(resource.type);
    expect(actions.failed.resourceType).toBe(resource.type);
  });

  it('builds subscriber details with channel types but not addresses, and an actor without email', () => {
    const details = toSubscriberAuditDetails(tenantId, user, {
      id: 'subscriber-1',
      userId: 'user-1',
      channels: [
        { channel: Channel.email, address: 'tester@example.com', verified: true },
        { channel: Channel.sms, address: '7801234567' },
      ],
    });
    expect(details).toEqual({
      tenantId,
      actor: { id: 'user-1', type: 'user', name: 'tester', roles: ['subscription-admin'] },
      resource: { type: 'subscriber', id: 'subscriber-1' },
      metadata: {
        userId: 'user-1',
        channels: [
          { channel: Channel.email, verified: true },
          { channel: Channel.sms, verified: false },
        ],
      },
    });
    expect(JSON.stringify(details)).not.toMatch(/tester@example.com|7801234567/);
  });

  it('builds subscription details keyed by type and subscriber', () => {
    expect(toSubscriptionAuditDetails(tenantId, user, 'type-1', 'subscriber-1')).toEqual(
      expect.objectContaining({
        resource: { type: 'subscription', id: 'type-1:subscriber-1' },
        metadata: { typeId: 'type-1', subscriberId: 'subscriber-1' },
      }),
    );
  });

  it('builds notification details against the subscription without recipient or message', () => {
    const details = toNotificationAuditDetails(notification);
    expect(details.tenantId.toString()).toBe(tenantId.toString());
    expect(details).toEqual({
      tenantId: expect.anything(),
      actor: NotificationJobAuditActor,
      resource: { type: 'subscription', id: 'type-1:subscriber-1' },
      correlationId: 'correlation-1',
      metadata: {
        typeId: 'type-1',
        channel: Channel.email,
        event: 'test:happened',
        subscriberId: 'subscriber-1',
        context: { value: 1 },
      },
    });
    expect(JSON.stringify(details)).not.toMatch(/tester@example.com|Secret/);
  });

  it('builds notification details against the notification type when there is no subscriber', () => {
    const details = toNotificationAuditDetails({ ...notification, subscriber: undefined }, { error: 'boom' });
    expect(details.resource).toEqual({ type: 'notification-type', id: 'type-1', name: 'Type 1' });
    expect(details.metadata).toEqual(expect.objectContaining({ subscriberId: null, error: 'boom' }));
  });

  it('leaves tenant unset for a notification with an invalid tenant', () => {
    expect(toNotificationAuditDetails({ ...notification, tenantId: 'not-a-urn' }).tenantId).toBeUndefined();
  });

  it('records the action and details', () => {
    auditService.record.mockResolvedValue({ status: 'recorded' });
    const details = toSubscriberAuditDetails(tenantId, user, { id: 'subscriber-1', channels: [] });
    createNotificationAuditor(auditService, logger)(SubscriberCreatedAuditAction, details);
    expect(auditService.record).toHaveBeenCalledWith(SubscriberCreatedAuditAction, details);
  });

  it('skips details without a tenant', () => {
    createNotificationAuditor(auditService, logger)(
      SubscriberCreatedAuditAction,
      toNotificationAuditDetails({ ...notification, tenantId: 'not-a-urn' }),
    );
    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('swallows rejection and logs a warning', async () => {
    auditService.record.mockRejectedValue(new Error('boom'));
    expect(() =>
      createNotificationAuditor(auditService, logger)(SubscriberCreatedAuditAction, toNotificationAuditDetails(notification)),
    ).not.toThrow();
    await new Promise(process.nextTick);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('boom'), expect.anything());
  });

  it('swallows synchronous throws', () => {
    auditService.record.mockImplementation(() => {
      throw new Error('sync');
    });
    expect(() =>
      createNotificationAuditor(auditService, logger)(SubscriberCreatedAuditAction, toNotificationAuditDetails(notification)),
    ).not.toThrow();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('sync'), expect.anything());
  });
});
