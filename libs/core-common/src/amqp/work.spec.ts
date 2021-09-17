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

  it('can connect', async () => {
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
  });

  it('can handle error on connect', async () => {
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
  });

  describe('Subscriber', () => {
    it('can receive item', (done) => {
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
      service.connect().then(() => {
        service.getItems().subscribe(({ item, done: workDone }) => {
          expect(item).toEqual(workItem);
          workDone();
          expect(subChannel.ack).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });

    it('can nack and requeue failed item', (done) => {
      const workItem = {
        value: 'test',
      };

      const msg = { properties: { headers: {} }, content: JSON.stringify(workItem) };
      const subChannel = {
        assertExchange: jest.fn(),
        assertQueue: jest.fn(),
        bindQueue: jest.fn(),
        publish: jest.fn(),
        consume: jest.fn((_queue, cb) => {
          cb(msg);
        }),
        nack: jest.fn(),
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
      service.connect().then(() => {
        service.getItems().subscribe(({ item, done: workDone }) => {
          expect(item).toEqual(workItem);
          workDone(new Error('Something went terribly wrong.'));
          expect(subChannel.nack).toHaveBeenCalledTimes(1);
          expect(subChannel.nack).toBeCalledWith(msg, false, true);
          done();
        });
      });
    });

    it('can nack and dead letter redelivered failed item', (done) => {
      const workItem = {
        value: 'test',
      };

      const msg = { properties: { headers: {} }, fields: { redelivered: true }, content: JSON.stringify(workItem) };
      const subChannel = {
        assertExchange: jest.fn(),
        assertQueue: jest.fn(),
        bindQueue: jest.fn(),
        publish: jest.fn(),
        consume: jest.fn((_queue, cb) => {
          cb(msg);
        }),
        nack: jest.fn(),
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
      service.connect().then(() => {
        service.getItems().subscribe(({ item, done: workDone }) => {
          expect(item).toEqual(workItem);
          workDone(new Error('Something went terribly wrong.'));
          expect(subChannel.nack).toHaveBeenCalledTimes(1);
          expect(subChannel.nack).toBeCalledWith(msg, false, false);
          done();
        });
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
