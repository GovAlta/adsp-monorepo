import { adspId } from '@abgov/adsp-service-sdk';
import { AmqpConnectionManager } from 'amqp-connection-manager';
import type { Logger } from 'winston';
import { AmqpDomainEventService } from './service';

describe('AmqpDomainEventService', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const event = {
    namespace: 'test',
    name: 'test-started',
    timestamp: new Date(),
    context: {
      value: 'a',
    },
    tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
    correlationId: 'urn:ads:platform:file-service:v1:/files/123',
    payload: {},
    traceparent: '123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('can be created', () => {
    const connection = {
      on: jest.fn(),
    };
    const service = new AmqpDomainEventService(logger, connection as unknown as AmqpConnectionManager);
    expect(service).toBeTruthy();
  });

  it('can send event', async () => {
    const channel = {
      assertExchange: jest.fn(),
      assertQueue: jest.fn(),
      bindQueue: jest.fn(),
      publish: jest.fn(() => true),
    };

    const connection = {
      on: jest.fn(),
      createChannel: jest.fn(() => channel),
    };

    const service = new AmqpDomainEventService(logger, connection as unknown as AmqpConnectionManager);
    await service.connect();
    await service.send(event);
    expect(channel.publish).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Sent domain event with routing key'));
  });

  it('can log error when publish returns false (server reject or connection close)', async () => {
    const channel = {
      assertExchange: jest.fn(),
      assertQueue: jest.fn(),
      bindQueue: jest.fn(),
      publish: jest.fn(() => false),
    };

    const connection = {
      on: jest.fn(),
      createChannel: jest.fn(() => channel),
    };

    const service = new AmqpDomainEventService(logger, connection as unknown as AmqpConnectionManager);
    await service.connect();
    await service.send(event);

    expect(channel.publish).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to publish domain event with routing key')
    );
  });

  it('can log error when publish throws an exception', async () => {
    const publishError = new Error('AMQP connection lost');
    const channel = {
      assertExchange: jest.fn(),
      assertQueue: jest.fn(),
      bindQueue: jest.fn(),
      publish: jest.fn(() => {
        throw publishError;
      }),
    };

    const connection = {
      on: jest.fn(),
      createChannel: jest.fn(() => channel),
    };

    const service = new AmqpDomainEventService(logger, connection as unknown as AmqpConnectionManager);
    await service.connect();
    await service.send(event);

    expect(channel.publish).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error encountered on sending domain event'));
  });

  it('can raise error on send if not connected', async () => {
    const connection = {
      on: jest.fn(),
    };

    const service = new AmqpDomainEventService(logger, connection as unknown as AmqpConnectionManager);
    await expect(service.send(event)).rejects.toThrow(/Service must be connected before events can be sent./);
  });
});
