/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  notificationsGenerated,
  notificationSent,
  notificationSendFailed,
  NotificationsGeneratedDefinition,
  NotificationSentDefinition,
  NotificationSendFailedDefinition,
  mapNotification,
} from './events';

describe('notifications', () => {
  describe('notificationsGenerated', () => {
    it('should generate notifications-generated event correctly', () => {
      const generationId = '123';
      const event = {
        namespace: 'test-namespace',
        name: 'test-event',
        timestamp: '2024-07-11T12:00:00Z',
      };
      const type = {
        id: '1',
        name: 'test-type',
      };
      const count = 5;

      const result = notificationsGenerated(generationId, event as any, type as any, count);

      expect(result.name).toBe('notifications-generated');
      expect(result.correlationId).toBe(generationId);
      expect(result.tenantId).toBeUndefined(); // Replace with your specific checks
      expect(result.context.generationId).toBe(generationId);
      expect(result.payload.type).toEqual(type);
      expect(result.payload.event).toEqual(event);
      expect(result.payload.generatedCount).toBe(count);
    });
  });

  describe('notificationSent', () => {
    it('should generate notification-sent event correctly', () => {
      const notification = {
        generationId: '123',
        correlationId: '456',
        tenantId: 'urn:ads:789',
        context: {},
        type: 'email',
        event: {
          namespace: 'test-namespace',
          name: 'test-event',
          timestamp: '2024-07-11T12:00:00Z',
        },
        channel: 'email',
        to: 'test@example.com',
        message: {
          subject: 'Test Subject',
          body: 'Test Body',
        },
        subscriber: {
          id: 'user1',
          userId: 'user_id1',
          addressAs: 'User One',
        },
      };

      const result = notificationSent(notification as any);

      expect(result.name).toBe('notification-sent');
      expect(result.correlationId).toBe(notification.correlationId);
      expect(result.tenantId.toString()).toBe(notification.tenantId);
      expect(result.context.generationId).toBe(notification.generationId);
      expect(result.payload.type).toEqual(notification.type);
      expect(result.payload.event).toEqual(notification.event);
      expect(result.payload.channel).toBe(notification.channel);
      expect(result.payload.to).toBe(notification.to);
      expect(result.payload.message).toEqual(notification.message);
      expect(result.payload.subscriber).toEqual(notification.subscriber);
    });
  });

  describe('notificationSendFailed', () => {
    it('should generate notification-send-failed event correctly', () => {
      const notification = {
        generationId: '123',
        correlationId: '456',
        tenantId: 'urn:ads:789',
        context: {},
        type: 'email',
        event: {
          namespace: 'test-namespace',
          name: 'test-event',
        },
        channel: 'email',
        to: 'test@example.com',
        message: {
          subject: 'Test Subject',
          body: 'Test Body',
        },
        subscriber: {
          id: 'user1',
          userId: 'user_id1',
          addressAs: 'User One',
        },
      };
      const error = 'Sending failed: Connection timed out';

      const result = notificationSendFailed(notification as any, error);

      expect(result.name).toBe('notification-send-failed');
      expect(result.correlationId).toBe(notification.correlationId);
      expect(result.tenantId.toString()).toBe(notification.tenantId);
      expect(result.context.generationId).toBe(notification.generationId);
      expect(result.payload.type).toEqual(notification.type);
      expect(result.payload.event).toEqual(notification.event);
      expect(result.payload.channel).toBe(notification.channel);
      expect(result.payload.to).toBe(notification.to);
      expect(result.payload.message).toEqual(notification.message);
      expect(result.payload.subscriber).toEqual(notification.subscriber);
      expect(result.payload.error).toBe(error);
    });
  });

  describe('mapNotification', () => {
    it('should map notification correctly', () => {
      const notification = {
        type: 'email',
        event: {
          namespace: 'test-namespace',
          name: 'test-event',
          timestamp: '2024-07-11T12:00:00Z',
        },
        channel: 'email',
        to: 'test@example.com',
        message: {
          subject: 'Test Subject',
          body: 'Test Body',
        },
        subscriber: {
          id: 'user1',
          userId: 'user_id1',
          addressAs: 'User One',
        },
      };

      const result = mapNotification(notification as any);

      expect(result.type).toBe(notification.type);
      expect(result.event).toEqual(notification.event);
      expect(result.channel).toBe(notification.channel);
      expect(result.to).toBe(notification.to);
      expect(result.message).toEqual(notification.message);
      expect(result.subscriber).toEqual(notification.subscriber);
    });
  });

  describe('NotificationsGeneratedDefinition', () => {
    it('should match the expected definition', () => {
      expect(NotificationsGeneratedDefinition).toEqual({
        name: 'notifications-generated',
        description: 'Signalled when notifications are generated for an event',
        payloadSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
            event: {
              type: 'object',
              properties: {
                namespace: { type: 'string' },
                name: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
            generatedCount: {
              type: 'integer',
            },
          },
        },
      });
    });
  });

  describe('NotificationSentDefinition', () => {
    it('should match the expected definition', () => {
      expect(NotificationSentDefinition).toEqual({
        name: 'notification-sent',
        description: 'Signalled when a notification has been sent.',
        payloadSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
            event: {
              type: 'object',
              properties: {
                namespace: { type: 'string' },
                name: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
            channel: { type: 'string' },
            to: { type: 'string' },
            message: {
              type: 'object',
              properties: {
                subject: { type: ['string', 'null'] },
                body: { type: ['string', 'null'] },
              },
            },
            subscriber: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                userId: { type: ['string', 'null'] },
                addressAs: { type: ['string', 'null'] },
              },
            },
          },
        },
        interval: {
          namespace: 'notification-service',
          name: 'notifications-generated',
          context: 'generationId',
          metric: ['notification-service', 'notification-send'],
        },
      });
    });
  });

  describe('NotificationSendFailedDefinition', () => {
    it('should match the expected definition', () => {
      expect(NotificationSendFailedDefinition).toEqual({
        name: 'notification-send-failed',
        description: 'Signalled when there is an error in sending of a notification.',
        payloadSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
            event: {
              type: 'object',
              properties: {
                namespace: { type: 'string' },
                name: { type: 'string' },
              },
            },
            channel: { type: 'string' },
            to: { type: 'string' },
            message: {
              type: 'object',
              properties: {
                subject: { type: ['string', 'null'] },
                body: { type: ['string', 'null'] },
              },
            },
            subscriber: {
              type: ['object', 'null'],
              properties: {
                id: { type: 'string' },
                userId: { type: ['string', 'null'] },
                addressAs: { type: ['string', 'null'] },
              },
            },
            error: { type: 'string' },
          },
        },
        interval: {
          namespace: 'notification-service',
          name: 'notifications-generated',
          context: 'generationId',
          metric: ['notification-service', 'notification-send-failed'],
        },
      });
    });
  });
});
