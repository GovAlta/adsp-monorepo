import { AmqpConnectionManager } from 'amqp-connection-manager';
import { Logger } from 'winston';
import { context as otelContext, propagation, trace as otelTrace, SpanStatusCode } from '@opentelemetry/api';
import { AmqpWorkQueueService } from './work';

describe('AmqpWorkQueueService<string>', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  it('can be created', () => {
    const connection = {};
    const service = new AmqpWorkQueueService<string>('test', logger, connection as unknown as AmqpConnectionManager);
    expect(service).toBeTruthy();
  });

  it('can connect', (done) => {
    const channel = {
      assertExchange: jest.fn(() => Promise.resolve()),
      assertQueue: jest.fn(),
      bindQueue: jest.fn(() => Promise.resolve()),
    };

    const connection = {
      on: jest.fn(),
      createChannel: jest.fn(async ({ setup }) => {
        await setup(channel);

        expect(channel.assertQueue.mock.calls[1][0]).toBe('test');
        expect(channel.assertQueue.mock.calls[1][1]).toMatchObject({
          arguments: expect.objectContaining({
            'x-queue-type': 'quorum',
            'x-dead-letter-exchange': 'test-dead-letter',
          }),
        });

        done();
        return channel;
      }),
    };

    channel.assertQueue.mockImplementation(() => Promise.resolve());
    const service = new AmqpWorkQueueService<{ value: string }>(
      'test',
      logger,
      connection as unknown as AmqpConnectionManager,
    );

    service.connect().then((connected) => {
      expect(connected).toBeTruthy();
      expect(service.isConnected()).toBeTruthy();
    });
  });

  it('can handle error on connect', async () => {
    const connection = {
      on: jest.fn(),
      createChannel: jest.fn(() => {
        throw new Error('Something went terribly wrong.');
      }),
    };

    const service = new AmqpWorkQueueService<{ value: string }>(
      'test',
      logger,
      connection as unknown as AmqpConnectionManager,
    );
    const connected = await service.connect();

    expect(connected).toBeFalsy();
    expect(service.isConnected()).toBeFalsy();
  });

  it('can enqueue', async () => {
    const channel = {
      assertExchange: jest.fn(() => Promise.resolve()),
      assertQueue: jest.fn(),
      bindQueue: jest.fn(() => Promise.resolve()),
      sendToQueue: jest.fn(),
    };

    const connection = {
      on: jest.fn(),
      createChannel: jest.fn(({ setup }) => {
        setup(channel);
        return channel;
      }),
    };

    const injectSpy = jest.spyOn(propagation, 'inject').mockImplementation((_ctx, carrier) => {
      (carrier as Record<string, unknown>).traceparent = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
    });

    channel.sendToQueue.mockResolvedValueOnce(true);
    const service = new AmqpWorkQueueService<{ value: string }>(
      'test',
      logger,
      connection as unknown as AmqpConnectionManager,
    );
    await service.connect();
    await service.enqueue({ value: 'test' });
    expect(channel.sendToQueue).toHaveBeenCalledWith(
      'test',
      expect.any(Buffer),
      expect.objectContaining({
        contentType: 'application/json',
        headers: {
          traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
        },
      }),
    );
    injectSpy.mockRestore();
  });

  describe('Subscriber', () => {
    it('can receive item', (done) => {
      const workItem = {
        value: 'test',
      };
      const span = {
        setStatus: jest.fn(),
        recordException: jest.fn(),
        end: jest.fn(),
      };
      const withSpy = jest.spyOn(otelContext, 'with').mockImplementation((_ctx, callback) => callback());
      const extractSpy = jest.spyOn(propagation, 'extract').mockReturnValue({} as never);
      const setSpanSpy = jest.spyOn(otelTrace, 'setSpan').mockReturnValue({} as never);
      const getTracerSpy = jest
        .spyOn(otelTrace, 'getTracer')
        .mockReturnValue({ startSpan: jest.fn().mockReturnValue(span) } as never);

      const subChannel = {
        assertExchange: jest.fn(() => Promise.resolve()),
        assertQueue: jest.fn(() => Promise.resolve()),
        bindQueue: jest.fn(() => Promise.resolve()),
        publish: jest.fn(),
        consume: jest.fn((_queue, cb) => {
          cb({
            properties: { headers: { traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01' } },
            fields: { routingKey: 'test.key' },
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

      const service = new AmqpWorkQueueService<{ value: string }>(
        'test',
        logger,
        connection as unknown as AmqpConnectionManager,
      );
      service.connect().then(() => {
        service.getItems().subscribe(({ item, done: workDone }) => {
          expect(item).toEqual(
            expect.objectContaining({
              ...workItem,
              traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
            }),
          );
          expect(extractSpy).toHaveBeenCalledWith(expect.anything(), {
            traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
          });
          expect(getTracerSpy).toHaveBeenCalledWith('core-common.amqp');
          expect(setSpanSpy).toHaveBeenCalled();
          expect(withSpy).toHaveBeenCalled();
          workDone();
          expect(subChannel.ack).toHaveBeenCalledTimes(1);
          expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
          expect(span.end).toHaveBeenCalledTimes(1);
          getTracerSpy.mockRestore();
          setSpanSpy.mockRestore();
          extractSpy.mockRestore();
          withSpy.mockRestore();
          done();
        });
      });
    });

    it('can nack and requeue failed item', (done) => {
      const workItem = {
        value: 'test',
      };
      const span = {
        setStatus: jest.fn(),
        recordException: jest.fn(),
        end: jest.fn(),
      };
      const getTracerSpy = jest
        .spyOn(otelTrace, 'getTracer')
        .mockReturnValue({ startSpan: jest.fn().mockReturnValue(span) } as never);

      const msg = {
        properties: { headers: {} },
        fields: { routingKey: 'test.key' },
        content: JSON.stringify(workItem),
      };
      const subChannel = {
        assertExchange: jest.fn(() => Promise.resolve()),
        assertQueue: jest.fn(() => Promise.resolve()),
        bindQueue: jest.fn(() => Promise.resolve()),
        publish: jest.fn(),
        consume: jest.fn((_queue, cb) => {
          cb(msg);
        }),
        nack: jest.fn(),
      };

      const connection = {
        on: jest.fn(),
        createChannel: jest.fn(({ setup }) => {
          setup(subChannel);
          return subChannel;
        }),
      };

      const service = new AmqpWorkQueueService<{ value: string }>(
        'test',
        logger,
        connection as unknown as AmqpConnectionManager,
      );
      service.connect().then(() => {
        service.getItems().subscribe(({ item, done: workDone }) => {
          expect(item).toEqual(workItem);
          const err = new Error('Something went terribly wrong.');
          workDone(err);
          expect(subChannel.nack).toHaveBeenCalledTimes(1);
          expect(subChannel.nack).toBeCalledWith(msg, false, true);
          expect(span.recordException).toHaveBeenCalledWith(err);
          expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR, message: err.message });
          expect(span.end).toHaveBeenCalledTimes(1);
          getTracerSpy.mockRestore();
          done();
        });
      });
    });

    it('can nack and requeue item for message error', (done) => {
      const msg = { properties: { headers: {} }, content: '//' };
      const subChannel = {
        assertExchange: jest.fn(() => Promise.resolve()),
        assertQueue: jest.fn(() => Promise.resolve()),
        bindQueue: jest.fn(() => Promise.resolve()),
        publish: jest.fn(),
        consume: jest.fn((_queue, cb) => {
          cb(msg);
        }),
        nack: jest.fn(() => {
          done();
        }),
      };

      const connection = {
        on: jest.fn(),
        createChannel: jest.fn(({ setup }) => {
          setup(subChannel);
          return subChannel;
        }),
      };

      const service = new AmqpWorkQueueService<{ value: string }>(
        'test',
        logger,
        connection as unknown as AmqpConnectionManager,
      );
      service.connect().then(() => {
        service.getItems().subscribe(({ done: workDone }) => workDone());
      });
    });

    it('can nack and dead letter redelivered failed item', (done) => {
      const workItem = {
        value: 'test',
      };

      const msg = { properties: { headers: {} }, fields: { redelivered: true }, content: JSON.stringify(workItem) };
      const subChannel = {
        assertExchange: jest.fn(() => Promise.resolve()),
        assertQueue: jest.fn(() => Promise.resolve()),
        bindQueue: jest.fn(() => Promise.resolve()),
        publish: jest.fn(() => Promise.resolve(true)),
        consume: jest.fn((_queue, cb) => {
          cb(msg);
        }),
        nack: jest.fn(),
      };

      const connection = {
        on: jest.fn(),
        createChannel: jest.fn(({ setup }) => {
          setup(subChannel);
          return subChannel;
        }),
      };

      const service = new AmqpWorkQueueService<{ value: string }>(
        'test',
        logger,
        connection as unknown as AmqpConnectionManager,
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
        assertExchange: jest.fn(() => Promise.resolve()),
        assertQueue: jest.fn(() => Promise.resolve()),
        bindQueue: jest.fn(() => Promise.resolve()),
        publish: jest.fn(),
      };

      const connection = {
        on: jest.fn(),
        createChannel: jest.fn(({ setup }) => {
          setup(channel);
          return channel;
        }),
      };

      const service = new AmqpWorkQueueService<{ value: string }>(
        'test',
        logger,
        connection as unknown as AmqpConnectionManager,
      );
      expect(() => service.getItems()).toThrow(/Service must be connected before items can be subscribed./);
    });
  });
});
