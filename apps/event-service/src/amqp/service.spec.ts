import { adspId } from '@abgov/adsp-service-sdk';
import type { Connection } from 'amqplib';
import type { Logger } from 'winston';
import { AmqpDomainEventService } from './service';

describe('AmqpDomainEventService', () => {
  const logger: Logger = ({
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown) as Logger;

  it('can be created', () => {
    const connection = {
      on: jest.fn(),
    };
    const service = new AmqpDomainEventService(logger, (connection as unknown) as Connection);
    expect(service).toBeTruthy();
  });

  it('can send event', async () => {
    const channel = {
      assertExchange: jest.fn(),
      assertQueue: jest.fn(),
      bindQueue: jest.fn(),
      publish: jest.fn(),
    };

    const connection = {
      on: jest.fn(),
      createChannel: jest.fn(() => channel),
    };

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
    };

    const service = new AmqpDomainEventService(logger, (connection as unknown) as Connection);
    await service.connect();
    await service.send(event);
    expect(channel.publish).toHaveBeenCalledTimes(1);
  });

  it('can raise error on send if not connected', async () => {
    const connection = {
      on: jest.fn(),
    };

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
    };

    const service = new AmqpDomainEventService(logger, (connection as unknown) as Connection);
    await expect(service.send(event)).rejects.toThrow(/Service must be connected before events can be sent./);
  });

  it('can recreate channel on send error', async () => {
    const channel = {
      assertExchange: jest.fn(),
      assertQueue: jest.fn(),
      bindQueue: jest.fn(),
      publish: jest.fn(),
      close: jest.fn(),
    };

    const connection = {
      on: jest.fn(),
      createChannel: jest.fn(() => channel),
    };

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
    };

    const service = new AmqpDomainEventService(logger, (connection as unknown) as Connection);
    await service.connect();

    channel.publish.mockRejectedValueOnce(new Error('Something went terribly wrong.'));
    await service.send(event);
    await service.send(event);

    expect(connection.createChannel).toHaveBeenCalledTimes(3);
  });
});
