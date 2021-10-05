import { AmqpConnectionManager } from 'amqp-connection-manager';
import { Logger } from 'winston';
import { AmqpEventSubscriberService } from './event';

describe('AmqpEventSubscriberService', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  it('can be created', () => {
    const connection = {};
    const service = new AmqpEventSubscriberService('test', logger, connection as unknown as AmqpConnectionManager);
    expect(service).toBeTruthy();
  });

  it('can connect', (done) => {
    const channel = {
      assertExchange: jest.fn(),
      assertQueue: jest.fn(),
      bindQueue: jest.fn(() => Promise.resolve()),
    };

    const connection = {
      on: jest.fn(),
      createChannel: jest.fn(async ({ setup }) => {
        await setup(channel);

        expect(channel.assertExchange.mock.calls[1][0]).toBe('domain-events');
        expect(channel.assertExchange.mock.calls[1][1]).toBe('topic');

        done();
        return channel;
      }),
    };

    channel.assertExchange.mockImplementation(() => Promise.resolve());
    const service = new AmqpEventSubscriberService('test', logger, connection as unknown as AmqpConnectionManager);

    service.connect().then((connected) => {
      expect(connected).toBeTruthy();
      expect(service.isConnected()).toBeTruthy();
    });
  });

  it('can receive item', (done) => {
    const workItem = {
      value: 'test',
    };

    const subChannel = {
      assertExchange: jest.fn(() => Promise.resolve()),
      assertQueue: jest.fn(() => Promise.resolve()),
      bindQueue: jest.fn(() => Promise.resolve()),
      publish: jest.fn(),
      consume: jest.fn((_queue, cb) => {
        cb({
          properties: {
            headers: {
              timestamp: '2021-02-12T12:00:00Z',
              tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test',
            },
          },
          content: JSON.stringify(workItem),
        });
      }),
      ack: jest.fn(),
    };

    const connection = {
      on: jest.fn(),
      createChannel: jest.fn(({ setup }) => {
        setup(subChannel);
        return subChannel;
      }),
    };

    const service = new AmqpEventSubscriberService('test', logger, connection as unknown as AmqpConnectionManager);
    service.connect().then(() => {
      service.getItems().subscribe(({ item, done: workDone }) => {
        expect(item.payload).toMatchObject(workItem);
        workDone();
        expect(subChannel.ack).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
