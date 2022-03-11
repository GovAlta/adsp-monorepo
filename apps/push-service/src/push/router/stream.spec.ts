import { adspId, User } from '@abgov/adsp-service-sdk';
import {
  DomainEventSubscriberService,
  InvalidOperationError,
  NotFoundError,
} from '@core-services/core-common';
import { Request, Response } from 'express';
import { of } from 'rxjs';
import { Namespace, Socket } from 'socket.io';
import { Logger } from 'winston';
import { getStream, getStreams, subscribeBySse } from './stream';
import { StreamEntity } from '../model';
import { createStreamRouter, onIoConnection } from './stream';

describe('stream router', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const ioMock = {
    use: jest.fn(),
    on: jest.fn(),
  };

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const eventServiceMock = {
    enqueue: jest.fn(),
    getItems: jest.fn(() => of()),
  };

  let stream: StreamEntity = new StreamEntity(tenantId, {
    id: 'test',
    name: 'Test Stream',
    description: null,
    subscriberRoles: ['test-subscriber'],
    publicSubscribe: false,
    events: [
      {
        namespace: 'test-service',
        name: 'test-started',
      },
    ],
  });

  beforeEach(() => {
    stream = new StreamEntity(tenantId, {
      id: 'test',
      name: 'Test Stream',
      description: null,
      subscriberRoles: ['test-subscriber'],
      publicSubscribe: false,
      events: [
        {
          namespace: 'test-service',
          name: 'test-started',
        },
      ],
    });
  });

  it('createStreamRouter', () => {
    const router = createStreamRouter(ioMock as unknown as Namespace, {
      logger: loggerMock,
      eventService: eventServiceMock as DomainEventSubscriberService,
    });

    expect(router).toBeTruthy();
  });

  describe('getStream', () => {
    it('can get stream', async () => {
      const req = {
        tenantId,
        user: { tenantId, id: 'tester', roles: [] } as User,
        params: { stream: 'test' },
        query: { tenant: null },
        getConfiguration: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({ test: stream });
      await getStream(req as unknown as Request, req.query.tenant, req.params.stream, next);
      expect(req['stream']).toBe(stream);
    });

    it('can get stream for tenant', async () => {
      const req = {
        tenantId,
        user: { tenantId, id: 'tester', roles: [] } as User,
        params: { stream: 'test' },
        query: { tenant: 'test-2' },
        getConfiguration: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({ test: stream });
      await getStream(req as unknown as Request, req.query.tenant, req.params.stream, next);
      expect(req['stream']).toBe(stream);
      expect(req.getConfiguration.mock.calls[0][0].toString()).toMatch(
        'urn:ads:platform:tenant-service:v2:/tenants/test-2'
      );
    });

    it('can call next with error for no tenant context', async () => {
      const req = {
        tenantId,
        user: { isCore: true, id: 'tester', roles: [] } as User,
        params: { stream: 'test' },
        query: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      await getStream(req as unknown as Request, null, req.params.stream, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next for not found', async () => {
      const req = {
        tenantId,
        user: { tenantId, id: 'tester', roles: [] } as User,
        params: { stream: 'test' },
        query: { tenant: null },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({});
      await getStream(req as unknown as Request, req.query.tenant, req.params.stream, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('getStreams', () => {
    it('can get streams', async () => {
      const req = {
        tenantId,
        user: { tenantId, id: 'tester', roles: [] } as User,
        params: {},
        query: { tenant: null },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({ test: stream });
      await getStreams(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ test: expect.objectContaining({ id: 'test' }) }));
    });

    it('can get streams for tenant', async () => {
      const req = {
        tenantId,
        user: { tenantId, id: 'tester', roles: [] } as User,
        params: {},
        query: { tenant: 'test-2' },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({ test: stream });
      await getStreams(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ test: expect.objectContaining({ id: 'test' }) }));
      expect(req.getConfiguration.mock.calls[0][0].toString()).toMatch(
        'urn:ads:platform:tenant-service:v2:/tenants/test-2'
      );
    });

    it('can call next with error for no tenant context', async () => {
      const req = {
        tenantId,
        user: { isCore: true, id: 'tester', roles: [] } as User,
        params: { stream: 'test' },
        query: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      await getStreams(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('subscribeBySse', () => {
    it('can create handler', () => {
      const handler = subscribeBySse(loggerMock, of());
      expect(handler).toBeTruthy();
    });

    it('can subscribe', (done) => {
      const req = {
        tenantId,
        user: { isCore: true, id: 'tester', roles: ['test-subscriber'] } as User,
        params: { stream: 'test' },
        query: {},
        stream,
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
        set: jest.fn(),
        on: jest.fn(),
        write: jest.fn((value) => {
          expect(value).toBeTruthy();
          done();
        }),
        flush: jest.fn(),
        flushHeaders: jest.fn(),
      };
      const next = jest.fn();

      const handler = subscribeBySse(
        loggerMock,
        of({
          tenantId,
          namespace: 'test-service',
          name: 'test-started',
          timestamp: new Date(),
          correlationId: '321',
          payload: {},
        })
      );
      handler(req as unknown as Request, res as unknown as Response, next);
    });
  });

  describe('onIoConnection', () => {
    it('can create listener', () => {
      const listener = onIoConnection(loggerMock, of());
      expect(listener).toBeTruthy();
    });

    it('can handle connect', (done) => {
      const req = {
        tenantId,
        user: { isCore: true, id: 'tester', roles: ['test-subscriber'] } as User,
        params: { stream: 'test' },
        query: {},
        stream,
        getConfiguration: jest.fn(),
      };

      const socket = {
        request: req,
        emit: jest.fn((name, value) => {
          expect(name).toBe('test-service:test-started');
          expect(value).toBeTruthy();
          done();
        }),
      };

      const listener = onIoConnection(
        loggerMock,
        of({
          tenantId,
          namespace: 'test-service',
          name: 'test-started',
          timestamp: new Date(),
          correlationId: '321',
          payload: {},
        })
      );
      listener(socket as unknown as Socket);
    });
  });
});
