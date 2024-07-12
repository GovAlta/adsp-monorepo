import { DomainEvent } from '@core-services/core-common';
import axios from 'axios';
import { Logger } from 'winston';
import { AppStatusWebhookEntity, WebhookEntity } from './webhook';
import { AppStatusWebhook, Webhook } from '../types';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

const loggerMock = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
} as unknown as Logger;

describe('webhook', () => {
  beforeEach(() => {
    axiosMock.post.mockReset();
  });

  describe('WebhookEntity', () => {
    it('can be created', () => {
      const webhook: Webhook = {
        id: 'test-123',
        name: 'test',
        description: 'ABC 123',
        url: 'https://test.co',
        events: [],
      };
      const entity = new WebhookEntity(loggerMock, webhook);
      expect(entity).toBeTruthy();
      expect(entity).toMatchObject(webhook);
    });

    const webhook: Webhook = {
      id: 'test-123',
      name: 'test',
      description: 'ABC 123',
      url: 'https://test.co',
      events: [
        {
          namespace: 'test',
          name: 'test-started',
        },
        {
          namespace: 'test',
          name: 'test-paused',
          criteria: {
            context: {
              a: '1',
              b: '2',
            },
          },
        },
        {
          namespace: 'test',
          name: 'test-stopped',
          criteria: {
            correlationId: 'abc-123',
          },
        },
      ],
    };
    const entity = new WebhookEntity(loggerMock, webhook);

    describe('shouldTrigger', () => {
      it('can return true for match', () => {
        const result = entity.shouldTrigger({ namespace: 'test', name: 'test-started', payload: {} } as DomainEvent);
        expect(result).toBe(true);
      });

      it('can return false for non-match event', () => {
        const result = entity.shouldTrigger({ namespace: 'test', name: 'test-prepared', payload: {} } as DomainEvent);
        expect(result).toBe(false);
      });
      it('can return false for missing context event', () => {
        const result = entity.shouldTrigger({
          namespace: 'test',
          name: 'test-paused',
          context: undefined,
          payload: {},
        } as unknown as DomainEvent);
        expect(result).toBe(false);
      });
      it('can return true for match with criteria on context', () => {
        const result = entity.shouldTrigger({
          namespace: 'test',
          name: 'test-paused',
          context: { a: '1', b: '2' },
          payload: {},
        } as unknown as DomainEvent);
        expect(result).toBe(true);
      });

      it('can return false for failed match for criteria on context', () => {
        const result = entity.shouldTrigger({
          namespace: 'test',
          name: 'test-paused',
          context: { a: '1' },
          payload: {},
        } as unknown as DomainEvent);
        expect(result).toBe(false);
      });

      it('can return true for match with criteria on correlationId', () => {
        const result = entity.shouldTrigger({
          namespace: 'test',
          name: 'test-stopped',
          correlationId: 'abc-123',
          payload: {},
        } as unknown as DomainEvent);
        expect(result).toBe(true);
      });

      it('can return false for failed match for criteria on correlationId', () => {
        const result = entity.shouldTrigger({
          namespace: 'test',
          name: 'test-stopped',
          correlationId: '123-abc',
          payload: {},
        } as unknown as DomainEvent);
        expect(result).toBe(false);
      });
    });

    describe('callWebhook', () => {
      it('can call webhook', async () => {
        const event = {
          namespace: 'test',
          name: 'test-started',
          payload: {},
        } as DomainEvent;
        const response = {};
        axiosMock.post.mockResolvedValueOnce(response);
        const result = await entity.callWebhook(event);

        expect(result).toBe(response);
        expect(axiosMock.post).toHaveBeenCalledWith(webhook.url, event);
      });

      it('can handle webhook axios error', async () => {
        const event = {
          namespace: 'test',
          name: 'test-started',
          payload: {},
        } as DomainEvent;
        const response = {};
        axiosMock.post.mockRejectedValueOnce({ response });
        axiosMock.isAxiosError.mockReturnValueOnce(true);
        const result = await entity.callWebhook(event);

        expect(result).toBe(response);
        expect(axiosMock.post).toHaveBeenCalledWith(webhook.url, event);
      });

      it('can handle webhook non-axios error', async () => {
        const event = {
          namespace: 'test',
          name: 'test-started',
          payload: {},
        } as DomainEvent;
        const response = {};
        axiosMock.post.mockRejectedValueOnce({ response });
        axiosMock.isAxiosError.mockReturnValueOnce(false);
        const result = await entity.callWebhook(event);

        expect(result).toBeNull();
        expect(axiosMock.post).toHaveBeenCalledWith(webhook.url, event);
      });
    });

    describe('process', () => {
      it('can process event', async () => {
        const response = {};
        axiosMock.post.mockResolvedValueOnce(response);
        const result = await entity.process({ namespace: 'test', name: 'test-started', payload: {} } as DomainEvent);
        expect(result).toBe(response);
      });

      it('can process event and handle malformed URL', async () => {
        const webhook: Webhook = {
          id: 'test-123',
          name: 'test',
          description: 'ABC 123',
          url: '__%test.co',
          events: [
            {
              namespace: 'test',
              name: 'test-started',
            },
          ],
        };
        const entity = new WebhookEntity(loggerMock, webhook);
        const result = await entity.process({ namespace: 'test', name: 'test-started', payload: {} } as DomainEvent);
        expect(result).toBeFalsy();
      });

      it('can process event and unsupported protocol', async () => {
        const webhook: Webhook = {
          id: 'test-123',
          name: 'test',
          description: 'ABC 123',
          url: 'wss://test.co',
          events: [
            {
              namespace: 'test',
              name: 'test-started',
            },
          ],
        };
        const entity = new WebhookEntity(loggerMock, webhook);
        const result = await entity.process({ namespace: 'test', name: 'test-started', payload: {} } as DomainEvent);
        expect(result).toBeFalsy();
      });

      it('should log event processing with tenantId undefined', async () => {
        const event: DomainEvent = {
          namespace: 'testNamespace',
          name: 'testEvent',
          tenantId: undefined,
          timestamp: new Date(),
          context: {},
          payload: {},
        };
        const id = 'test-123';
        const name = 'test';

        const entity = new WebhookEntity(loggerMock, webhook);
        entity.shouldTrigger = jest.fn().mockReturnValue(false);
        await entity.process(event);

        expect(loggerMock.debug).toHaveBeenCalledWith(
          `Processing event ${event.namespace}:${event.name} for webhook ${name} (ID: ${id})...`,
          { context: 'WebHookEntity', tenant: undefined }
        );
      });
    });
  });

  describe('AppStatusWebhookEntity', () => {
    it('can be created', () => {
      const webhook: AppStatusWebhook = {
        id: 'test-123',
        name: 'test',
        description: 'ABC 123',
        url: 'https://test.co',
        targetId: 'app-abc',
        intervalMinutes: 5,
        eventTypes: [],
      };
      const entity = new AppStatusWebhookEntity(loggerMock, webhook);
      expect(entity).toBeTruthy();
      expect(entity).toMatchObject(webhook);
    });

    const webhook: AppStatusWebhook = {
      id: 'test-123',
      name: 'test',
      description: 'ABC 123',
      url: 'https://test.co',
      targetId: 'app-abc',
      intervalMinutes: 5,
      eventTypes: [
        {
          id: 'test:test-started',
        },
      ],
    };
    const entity = new AppStatusWebhookEntity(loggerMock, webhook);

    describe('shouldTrigger', () => {
      it('can return true for match', () => {
        const result = entity.shouldTrigger({
          namespace: 'test',
          name: 'test-started',
          payload: { application: { id: 'app-abc' } },
        } as unknown as DomainEvent);
        expect(result).toBe(true);
      });

      it('can return false for non-match event', () => {
        const result = entity.shouldTrigger({ namespace: 'test', name: 'test-prepared', payload: {} } as DomainEvent);
        expect(result).toBe(false);
      });

      it('can return true for match on appKey', () => {
        // TODO: This is for backwards compatibility?
        const result = entity.shouldTrigger({
          namespace: 'test',
          name: 'test-started',
          payload: { application: { appKey: 'app-abc' } },
        } as unknown as DomainEvent);
        expect(result).toBe(true);
      });

      it('can return false for wrong application', () => {
        const result = entity.shouldTrigger({
          namespace: 'test',
          name: 'test-started',
          payload: { application: { id: 'app-123' } },
        } as unknown as DomainEvent);
        expect(result).toBe(false);
      });

      it('can return false for application undefined', () => {
        const result = entity.shouldTrigger({
          namespace: 'test',
          name: 'test-started',
          payload: { application: undefined },
        } as unknown as DomainEvent);
        expect(result).toBe(false);
      });
      it('can return false for payload undefined', () => {
        const result = entity.shouldTrigger({
          namespace: 'test',
          name: 'test-started',
          payload: undefined,
        } as unknown as DomainEvent);
        expect(result).toBe(false);
      });
      it('can return false for eventTypes empty', () => {
        webhook.eventTypes = undefined;
        const entity = new AppStatusWebhookEntity(loggerMock, webhook);
        const result = entity.shouldTrigger({
          namespace: 'test',
          name: 'test-started',
          payload: undefined,
        } as unknown as DomainEvent);
        expect(result).toBe(false);
      });
    });
  });
});
