/* eslint-disable @typescript-eslint/no-explicit-any */
import { AjvValidationService } from '@core-services/core-common';
import {
  notificationsGenerated,
  notificationSent,
  notificationSendFailed,
  NotificationsGeneratedDefinition,
  NotificationGenerationFailedDefinition,
  NotificationSentDefinition,
  NotificationSendFailedDefinition,
  SubscriberCreatedDefinition,
  SubscriberUpdatedDefinition,
  SubscriberDeletedDefinition,
  SubscriptionSetDefinition,
  SubscriptionDeletedDefinition,
  notificationGenerationFailed,
} from './events';
import { Logger } from 'winston';

describe('events', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  describe('notificationsGenerated', () => {
    it('is valid json schema', () => {
      const service = new AjvValidationService(logger as unknown as Logger);
      service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
      service.validate('test', 'payload', NotificationsGeneratedDefinition.payloadSchema);
    });

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
      expect(result).toMatchSnapshot({ timestamp: expect.any(Date) });
    });
  });

  describe('notificationGenerationFailed', () => {
    it('is valid json schema', () => {
      const service = new AjvValidationService(logger as unknown as Logger);
      service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
      service.validate('test', 'payload', NotificationGenerationFailedDefinition.payloadSchema);
    });

    it('should generate notification-generation-failed event correctly', () => {
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

      const result = notificationGenerationFailed(generationId, event as any, type as any, 'Oh noes!');
      expect(result).toMatchSnapshot({ timestamp: expect.any(Date) });
    });
  });

  describe('notificationSent', () => {
    it('it is valid json schema', () => {
      const service = new AjvValidationService(logger as unknown as Logger);
      service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
      service.validate('test', 'payload', NotificationSentDefinition.payloadSchema);
    });

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
      expect(result).toMatchSnapshot({ timestamp: expect.any(Date) });
    });
  });

  describe('notificationSendFailed', () => {
    it('it is valid json schema', () => {
      const service = new AjvValidationService(logger as unknown as Logger);
      service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
      service.validate('test', 'payload', NotificationSendFailedDefinition.payloadSchema);
    });

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
      expect(result).toMatchSnapshot({ timestamp: expect.any(Date) });
    });
  });

  describe('subscriberCreated', () => {
    it('is valid json schema', () => {
      const service = new AjvValidationService(logger as unknown as Logger);
      service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
      service.validate('test', 'payload', SubscriberCreatedDefinition.payloadSchema);
    });
  });

  describe('subscribeUpdated', () => {
    it('is valid json schema', () => {
      const service = new AjvValidationService(logger as unknown as Logger);
      service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
      service.validate('test', 'payload', SubscriberUpdatedDefinition.payloadSchema);
    });
  });

  describe('subscriberDeleted', () => {
    it('is valid json schema', () => {
      const service = new AjvValidationService(logger as unknown as Logger);
      service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
      service.validate('test', 'payload', SubscriberDeletedDefinition.payloadSchema);
    });
  });

  describe('subscriptionSet', () => {
    it('is valid json schema', () => {
      const service = new AjvValidationService(logger as unknown as Logger);
      service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
      service.validate('test', 'payload', SubscriptionSetDefinition.payloadSchema);
    });
  });

  describe('subscriptionDeleted', () => {
    it('is valid json schema', () => {
      const service = new AjvValidationService(logger as unknown as Logger);
      service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
      service.validate('test', 'payload', SubscriptionDeletedDefinition.payloadSchema);
    });
  });
});
