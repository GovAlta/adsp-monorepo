import { adspId } from '@abgov/adsp-service-sdk';
import { Connection } from 'amqplib';
import { Logger } from 'winston';
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

  it('can connect', async (done) => {
    const channel = {
      assertExchange: jest.fn(),
      assertQueue: jest.fn(),
      bindQueue: jest.fn(),
    };

    const connection = {
      on: jest.fn(),
      createChannel: jest.fn(() => channel),
    };

    const service = new AmqpDomainEventService(logger, (connection as unknown) as Connection);
    const connected = await service.connect();

    expect(connected).toBeTruthy();
    expect(service.isConnected()).toBeTruthy();
    done();
  });

  it('can handle error on connect', async (done) => {
    const channel = {
      assertExchange: jest.fn(),
      assertQueue: jest.fn(),
      bindQueue: jest.fn(),
    };

    const connection = {
      on: jest.fn(),
      createChannel: jest.fn(() => channel),
    };

    channel.assertExchange.mockRejectedValueOnce(new Error('Something went terribly wrong.'));

    const service = new AmqpDomainEventService(logger, (connection as unknown) as Connection);
    const connected = await service.connect();

    expect(connected).toBeFalsy();
    expect(service.isConnected()).toBeFalsy();
    done();
  });

  describe('Publisher', () => {
    it('can send event', async (done) => {
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

      done();
    });

    it('can raise error on send if not connected', async (done) => {
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

      done();
    });

    it('can recreate channel on send error', async (done) => {
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

      done();
    });
  });

  describe('Subscriber', () => {
    it('can receive event', async (done) => {
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

      const { payload, ...headers } = event;

      const subChannel = {
        assertExchange: jest.fn(),
        assertQueue: jest.fn(),
        bindQueue: jest.fn(),
        publish: jest.fn(),
        consume: jest.fn((_queue, cb) => {
          cb({ properties: { headers }, content: JSON.stringify(payload) });
        }),
        ack: jest.fn(),
      };

      const connection = {
        on: jest.fn(),
        createChannel: jest.fn(() => subChannel),
      };

      const service = new AmqpDomainEventService(logger, (connection as unknown) as Connection);
      await service.connect();

      service.getEvents().subscribe((item) => {
        expect(item.event).toEqual(event);
        item.done();
        done();
      });
    });

    it('raise error on send if not connected', () => {
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

      const service = new AmqpDomainEventService(logger, (connection as unknown) as Connection);
      expect(() => service.getEvents()).toThrow(/Service must be connected before events can be subscribed./);
    });
  });
});
