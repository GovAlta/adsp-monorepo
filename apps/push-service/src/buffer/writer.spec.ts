import { adspId } from '@abgov/adsp-service-sdk';
import { DomainEvent, DomainEventWorkItem } from '@core-services/core-common';
import { Subject } from 'rxjs';
import { Logger } from 'winston';
import { StreamEntity } from '../push/model';
import { RedisEventBuffer } from './buffer';
import { createStreamInterest, hasStreamInterest, startBufferWriter } from './writer';

describe('buffer writer', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const logger = { debug: jest.fn(), error: jest.fn() } as unknown as Logger;
  const stream = new StreamEntity(logger, tenantId, {
    id: 'test',
    name: 'Test',
    description: null,
    subscriberRoles: [],
    publicSubscribe: false,
    events: [{ namespace: 'test-service', name: 'test-started' }],
  });
  const event = {
    id: 'event-1',
    namespace: 'test-service',
    name: 'test-started',
    tenantId,
    timestamp: new Date(),
    payload: {},
  } as DomainEvent;

  describe('hasStreamInterest', () => {
    it('can match event included in a stream', () => {
      expect(hasStreamInterest({ test: stream, webhooks: {} }, event)).toBe(true);
    });

    it('can ignore event not in any stream', () => {
      expect(hasStreamInterest({ test: stream }, { ...event, name: 'other' })).toBe(false);
      expect(hasStreamInterest(null, event)).toBe(false);
    });
  });

  describe('createStreamInterest', () => {
    it('can check tenant configuration', async () => {
      const configurationService = { getConfiguration: jest.fn().mockResolvedValue({ test: stream }) };
      const tokenProvider = { getAccessToken: jest.fn().mockResolvedValue('token') };
      const serviceId = adspId`urn:ads:platform:push-service`;
      const interest = createStreamInterest(configurationService as never, tokenProvider as never, serviceId);

      expect(await interest(event)).toBe(true);
      expect(configurationService.getConfiguration).toHaveBeenCalledWith(serviceId, 'token', tenantId);
    });
  });

  describe('startBufferWriter', () => {
    const buffer = { append: jest.fn() };

    beforeEach(() => {
      buffer.append.mockReset();
    });

    function setup(interest: boolean | Error) {
      const items = new Subject<DomainEventWorkItem>();
      const queue = { getItems: () => items, enqueue: jest.fn(), isConnected: () => true };
      const isOfInterest = jest.fn(async () => {
        if (interest instanceof Error) {
          throw interest;
        }
        return interest;
      });
      startBufferWriter(logger, queue, buffer as unknown as RedisEventBuffer, isOfInterest);
      return items;
    }

    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

    it('can append event of interest then ack', async () => {
      buffer.append.mockResolvedValueOnce('1-0');
      const items = setup(true);
      const done = jest.fn();
      items.next({ item: event, done, retryOnError: true });
      await flush();

      expect(buffer.append).toHaveBeenCalledWith(event);
      expect(done).toHaveBeenCalledWith();
    });

    it('can ack without appending event not of interest', async () => {
      const items = setup(false);
      const done = jest.fn();
      items.next({ item: event, done, retryOnError: true });
      await flush();

      expect(buffer.append).not.toHaveBeenCalled();
      expect(done).toHaveBeenCalledWith();
    });

    it('can nack on error', async () => {
      const items = setup(new Error('config down'));
      const done = jest.fn();
      items.next({ item: event, done, retryOnError: true });
      await flush();

      expect(done).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
