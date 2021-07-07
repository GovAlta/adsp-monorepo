import { adspId } from '@abgov/adsp-service-sdk';
import { Connection } from 'amqplib';
import { Logger } from 'winston';
import { AmqpWorkQueueService } from './work';

describe('AmqpWorkQueueService<string>', () => {
  const logger: Logger = ({
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown) as Logger;

  it('can be created', () => {
    const connection = {
      on: jest.fn(),
    };
    const service = new AmqpWorkQueueService<string>('test', logger, (connection as unknown) as Connection);
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

    const service = new AmqpWorkQueueService<{ value: string }>('test', logger, (connection as unknown) as Connection);
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

    channel.assertQueue.mockRejectedValueOnce(new Error('Something went terribly wrong.'));

    const service = new AmqpWorkQueueService<{ value: string }>('test', logger, (connection as unknown) as Connection);
    const connected = await service.connect();

    expect(connected).toBeFalsy();
    expect(service.isConnected()).toBeFalsy();
    done();
  });

  describe('Subscriber', () => {
    it('can receive item', async (done) => {
      const workItem = {
        value: 'test',
      };

      const subChannel = {
        assertExchange: jest.fn(),
        assertQueue: jest.fn(),
        bindQueue: jest.fn(),
        publish: jest.fn(),
        consume: jest.fn((_queue, cb) => {
          cb({ properties: { headers: {} }, content: JSON.stringify(workItem) });
        }),
        ack: jest.fn(),
      };

      const connection = {
        on: jest.fn(),
        createChannel: jest.fn(() => subChannel),
      };

      const service = new AmqpWorkQueueService<{ value: string }>(
        'test',
        logger,
        (connection as unknown) as Connection
      );
      await service.connect();

      service.getItems().subscribe(({ item, done: workDone }) => {
        expect(item).toEqual(workItem);
        workDone();
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

      const service = new AmqpWorkQueueService<{ value: string }>(
        'test',
        logger,
        (connection as unknown) as Connection
      );
      expect(() => service.getItems()).toThrow(/Service must be connected before items can be subscribed./);
    });
  });
});
