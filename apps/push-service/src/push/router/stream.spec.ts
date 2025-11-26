import { adspId, TenantService, EventService, User, TokenProvider } from '@abgov/adsp-service-sdk';
import { DomainEventSubscriberService, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Observable, of } from 'rxjs';
import { Namespace, Socket } from 'socket.io';
import { Logger } from 'winston';
import { getStream, getStreams, subscribeBySse, mapStreamItem } from './stream';
import { StreamEntity, StreamItem, WebhookEntity } from '../model';
import { createStreamRouter, onIoConnection } from './stream';
import { Subject } from 'rxjs';
import { webhookTriggered } from '../events';

describe('stream router', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const ioMock = {
    use: jest.fn(),
    on: jest.fn(),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(),
  };

  const configurationServiceMock = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
  };

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const tenantServiceMock = {
    getTenantByName: jest.fn(),
  };

  const eventServiceAmpMock = {
    enqueue: jest.fn(),
    getItems: jest.fn(() => of() as Observable<unknown>),
    isConnected: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  let stream: StreamEntity = new StreamEntity(loggerMock, tenantId, {
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
    tenantServiceMock.getTenantByName.mockReset();
    stream = new StreamEntity(loggerMock, tenantId, {
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
  describe('createStreamRouter', () => {
    const LOG_CONTEXT = { context: 'StreamRouter' };
    it('router', () => {
      const router = createStreamRouter([ioMock as unknown as Namespace], {
        logger: loggerMock,
        eventServiceAmp: eventServiceAmpMock as DomainEventSubscriberService,
        eventServiceAmpWebhooks: eventServiceAmpMock as DomainEventSubscriberService,
        eventService: eventServiceMock as EventService,
        tenantService: tenantServiceMock as unknown as TenantService,
        tokenProvider: tokenProviderMock as unknown as TokenProvider,
        configurationService: configurationServiceMock,
        serviceId: adspId`urn:ads:platform:push-service`,
      });

      expect(router).toBeTruthy();
    });

    it('should process events for clients', async () => {
      //eslint-disable-next-line
      const eventsSubject = new Subject<any>();
      eventServiceAmpMock.getItems.mockReturnValue(eventsSubject.asObservable());

      createStreamRouter([ioMock as unknown as Namespace], {
        logger: loggerMock,
        eventServiceAmp: eventServiceAmpMock as DomainEventSubscriberService,
        eventServiceAmpWebhooks: eventServiceAmpMock as DomainEventSubscriberService,
        eventService: eventServiceMock as EventService,
        tenantService: tenantServiceMock as unknown as TenantService,
        tokenProvider: tokenProviderMock as unknown as TokenProvider,
        configurationService: configurationServiceMock,
        serviceId: adspId`urn:ads:platform:push-service`,
      });

      const nextEvent = { namespace: 'testNamespace', name: 'testEvent', tenantId: 'tenantId' };
      eventsSubject.next({ item: nextEvent, done: jest.fn() });

      await new Promise(process.nextTick);

      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Processing event ${nextEvent.namespace}:${nextEvent.name} for clients...`,
        {
          tenantId: nextEvent.tenantId,
          ...LOG_CONTEXT,
        }
      );
    });

    it('should process events for webhooks', async () => {
      //eslint-disable-next-line
      const webhookEventsSubject = new Subject<any>();
      eventServiceAmpMock.getItems.mockReturnValue(webhookEventsSubject.asObservable());

      createStreamRouter([ioMock as unknown as Namespace], {
        logger: loggerMock,
        eventServiceAmp: eventServiceAmpMock as DomainEventSubscriberService,
        eventServiceAmpWebhooks: eventServiceAmpMock as DomainEventSubscriberService,
        eventService: eventServiceMock as EventService,
        tenantService: tenantServiceMock as unknown as TenantService,
        tokenProvider: tokenProviderMock as unknown as TokenProvider,
        configurationService: configurationServiceMock,
        serviceId: adspId`urn:ads:platform:push-service`,
      });

      const nextEvent = { namespace: 'testNamespace', name: 'testEvent', tenantId: 'tenantId' };
      webhookEventsSubject.next({ item: nextEvent, done: jest.fn() });

      await new Promise(process.nextTick);

      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Processing event ${nextEvent.namespace}:${nextEvent.name} for webhooks...`,
        {
          tenantId: nextEvent.tenantId,
          ...LOG_CONTEXT,
        }
      );
    });

    it('should handle webhook-triggered events correctly', async () => {
      //eslint-disable-next-line
      const webhookEventsSubject = new Subject<any>();
      eventServiceAmpMock.getItems.mockReturnValue(webhookEventsSubject.asObservable());
      const token = 'testToken';
      const nextEvent = { namespace: 'testNamespace', name: 'testEvent', tenantId: 'tenantId' };
      const webhookEntity = {
        process: jest.fn().mockResolvedValue('response'),
      } as unknown as WebhookEntity;
      const webhooks = { testWebhook: webhookEntity };
      tokenProviderMock.getAccessToken.mockResolvedValue(token);
      configurationServiceMock.getConfiguration.mockResolvedValue({ webhooks });

      createStreamRouter([ioMock as unknown as Namespace], {
        logger: loggerMock,
        eventServiceAmp: eventServiceAmpMock as DomainEventSubscriberService,
        eventServiceAmpWebhooks: eventServiceAmpMock as DomainEventSubscriberService,
        eventService: eventServiceMock as EventService,
        tenantService: tenantServiceMock as unknown as TenantService,
        tokenProvider: tokenProviderMock as unknown as TokenProvider,
        configurationService: configurationServiceMock,
        serviceId: adspId`urn:ads:platform:push-service`,
      });

      webhookEventsSubject.next({ item: nextEvent, done: jest.fn() });

      await new Promise(process.nextTick);

      expect(tokenProviderMock.getAccessToken).toHaveBeenCalled();
      expect(webhookEntity.process).toHaveBeenCalledWith(nextEvent);
      expect(eventServiceMock.send).toHaveBeenCalled();
    });

    it('should log error when processing webhook fails', async () => {
      //eslint-disable-next-line
      const webhookEventsSubject = new Subject<any>();
      eventServiceAmpMock.getItems.mockReturnValue(webhookEventsSubject.asObservable());
      const error = new Error('Test error');
      tokenProviderMock.getAccessToken.mockRejectedValue(error);

      createStreamRouter([ioMock as unknown as Namespace], {
        logger: loggerMock,
        eventServiceAmp: eventServiceAmpMock as DomainEventSubscriberService,
        eventServiceAmpWebhooks: eventServiceAmpMock as DomainEventSubscriberService,
        eventService: eventServiceMock as EventService,
        tenantService: tenantServiceMock as unknown as TenantService,
        tokenProvider: tokenProviderMock as unknown as TokenProvider,
        configurationService: configurationServiceMock,
        serviceId: adspId`urn:ads:platform:push-service`,
      });

      const nextEvent = { namespace: 'testNamespace', name: 'testEvent', tenantId: 'tenantId' };
      webhookEventsSubject.next({ item: nextEvent, done: jest.fn() });

      await new Promise(process.nextTick);

      expect(loggerMock.error).toHaveBeenCalledWith(`Error encountered processing webhook: ${error}`, {
        tenantId: nextEvent.tenantId,
        ...LOG_CONTEXT,
      });
    });
  });
  describe('webhookTriggered', () => {
    let triggerEvent;
    let response;

    it('should set response.timestamp to undefined if response.headers.date is not set', () => {
      const webhook = {
        id: 'webhookId',
        name: 'testWebhook',
        url: 'http://example.com/webhook',
        targetId: 'targetId',
        intervalMinutes: 10,
        generatedByTest: false,
        eventTypes: [{ id: 'namespace:event' }],
      };
      triggerEvent = {
        namespace: 'testNamespace',
        name: 'testEvent',
        correlationId: 'eventCorrelationId',
        context: {},
      };
      response = {
        status: 200,
        statusText: 'OK',
        headers: {
          date: 'Wed, 21 Oct 2015 07:28:00 GMT',
        },
        config: {},
        data: {},
      };
      const responseTime = 100;

      delete response.headers.date;

      const event = webhookTriggered(tenantId, webhook, triggerEvent, response, responseTime);

      expect(event.payload.response).toEqual({ status: 'OK', statusCode: 200, timestamp: undefined });
    });
  });
  describe('mapStreamItem', () => {
    it('should convert tenantId to string when tenantId is defined as object', () => {
      const item: StreamItem = {
        namespace: 'testNamespace',
        name: 'testName',
        correlationId: 'testCorrelationId',
        context: {},
        tenantId: tenantId,
      };

      const result = mapStreamItem(item);

      expect(result.namespace).toBe('testNamespace');
      expect(result.name).toBe('testName');
      expect(result.correlationId).toBe('testCorrelationId');
      expect(result.context).toEqual({});
    });
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
      await getStream(
        loggerMock,
        tenantServiceMock as unknown as TenantService,
        req as unknown as Request,
        req.query.tenant,
        req.params.stream,
        next
      );
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

      tenantServiceMock.getTenantByName.mockResolvedValueOnce({
        id: adspId`urn:ads:platform:tenant-service:v2:/tenants/test-2`,
      });
      req.getConfiguration.mockResolvedValueOnce({ test: stream });
      await getStream(
        loggerMock,
        tenantServiceMock as unknown as TenantService,
        req as unknown as Request,
        req.query.tenant,
        req.params.stream,
        next
      );
      expect(req['stream']).toBe(stream);
      expect(tenantServiceMock.getTenantByName).toHaveBeenCalledWith('test 2');
      expect(req.getConfiguration.mock.calls[0][0].toString()).toMatch(
        'urn:ads:platform:tenant-service:v2:/tenants/test-2'
      );
    });

    it('can get stream for tenant with anonymous user', async () => {
      const req = {
        tenantId,
        params: { stream: 'test' },
        query: { tenant: 'test-2' },
        getConfiguration: jest.fn(),
      };
      const next = jest.fn();

      tenantServiceMock.getTenantByName.mockResolvedValueOnce({
        id: adspId`urn:ads:platform:tenant-service:v2:/tenants/test-2`,
      });
      req.getConfiguration.mockResolvedValueOnce({ test: stream });
      await getStream(
        loggerMock,
        tenantServiceMock as unknown as TenantService,
        req as unknown as Request,
        req.query.tenant,
        req.params.stream,
        next
      );
      expect(req['stream']).toBe(stream);
      expect(tenantServiceMock.getTenantByName).toHaveBeenCalledWith('test 2');
      expect(req.getConfiguration.mock.calls[0][0].toString()).toMatch(
        'urn:ads:platform:tenant-service:v2:/tenants/test-2'
      );
    });

    it('can call next with error for non-core user with no tenant context', async () => {
      const req = {
        tenantId,
        user: { isCore: false, id: 'tester', roles: [] } as User,
        params: { stream: 'test' },
        query: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      await getStream(
        loggerMock,
        tenantServiceMock as unknown as TenantService,
        req as unknown as Request,
        null,
        req.params.stream,
        next
      );
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with error for anonymous user and no tenant context', async () => {
      const req = {
        tenantId,
        params: { stream: 'test' },
        query: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      await getStream(
        loggerMock,
        tenantServiceMock as unknown as TenantService,
        req as unknown as Request,
        null,
        req.params.stream,
        next
      );
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can get stream with no tenant context for core user', async () => {
      const req = {
        tenantId,
        user: { isCore: true, id: 'tester', roles: [] } as User,
        params: { stream: 'test' },
        query: {},
        getConfiguration: jest.fn(),
      };

      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({ test: stream });
      await getStream(
        loggerMock,
        tenantServiceMock as unknown as TenantService,
        req as unknown as Request,
        null,
        req.params.stream,
        next
      );
      expect(req['stream']).toBe(stream);
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
      await getStream(
        loggerMock,
        tenantServiceMock as unknown as TenantService,
        req as unknown as Request,
        req.query.tenant,
        req.params.stream,
        next
      );
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('getStreams', () => {
    it('can get streams', async () => {
      const req = {
        tenantId,
        user: { tenantId, id: 'tester', roles: ['test-subscriber'] } as User,
        params: {},
        query: { tenant: null },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({
        test: stream,
        other: new StreamEntity(loggerMock, tenantId, {
          id: 'other',
          name: 'Test Stream',
          description: null,
          subscriberRoles: ['not-test-subscriber'],
          publicSubscribe: false,
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
            },
          ],
        }),
      });
      await getStreams(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ test: expect.objectContaining({ id: 'test' }) }));
    });

    it('can get streams for tenant', async () => {
      const req = {
        tenantId,
        user: { tenantId, id: 'tester', roles: ['test-subscriber'] } as User,
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

    it('can get streams for tenant with anonymous user', async () => {
      const req = {
        tenantId,
        params: {},
        query: { tenant: 'test-2' },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({
        test: stream,
        other: new StreamEntity(loggerMock, tenantId, {
          id: 'other',
          name: 'Test Stream',
          description: null,
          subscriberRoles: [],
          publicSubscribe: true,
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
            },
          ],
        }),
      });
      await getStreams(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ other: expect.objectContaining({ id: 'other' }) })
      );
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

    it('can call next with error for no tenant and no user', async () => {
      const req = {
        tenantId,
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
          traceparent: '123',
        })
      );
      handler(req as unknown as Request, res as unknown as Response, next);
    });

    it('can subscribe anonymously', (done) => {
      const req = {
        tenantId,
        params: { stream: 'test' },
        query: {},
        stream: new StreamEntity(loggerMock, tenantId, {
          id: 'other',
          name: 'Test Stream',
          description: null,
          subscriberRoles: [],
          publicSubscribe: true,
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
            },
          ],
        }),
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
          traceparent: '123',
        })
      );
      handler(req as unknown as Request, res as unknown as Response, next);
    });

    it('can subscribe with criteria', (done) => {
      const req = {
        tenantId,
        user: { isCore: true, id: 'tester', roles: ['test-subscriber'] } as User,
        params: { stream: 'test' },
        query: { criteria: JSON.stringify({ correlationId: '321' }) },
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
          traceparent: '123',
        })
      );
      handler(req as unknown as Request, res as unknown as Response, next);
    });

    it('can call next with error', (done) => {
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
      const next = jest.fn(() => done());

      res.set.mockImplementationOnce(() => {
        throw new Error('oh noes!');
      });
      const handler = subscribeBySse(
        loggerMock,
        of({
          tenantId,
          namespace: 'test-service',
          name: 'test-started',
          timestamp: new Date(),
          correlationId: '321',
          payload: {},
          traceparent: '123',
        })
      );
      handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
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
        disconnect: jest.fn(),
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
          traceparent: '123',
        })
      );
      listener(socket as unknown as Socket);
    });

    it('can handle anonymous connect', (done) => {
      const req = {
        tenantId,
        params: { stream: 'test' },
        query: {},
        stream: new StreamEntity(loggerMock, tenantId, {
          id: 'other',
          name: 'Test Stream',
          description: null,
          subscriberRoles: [],
          publicSubscribe: true,
          events: [
            {
              namespace: 'test-service',
              name: 'test-started',
            },
          ],
        }),
        getConfiguration: jest.fn(),
      };

      const socket = {
        request: req,
        emit: jest.fn((name, value) => {
          expect(name).toBe('test-service:test-started');
          expect(value).toBeTruthy();
          done();
        }),
        disconnect: jest.fn(),
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
          traceparent: '123',
        })
      );
      listener(socket as unknown as Socket);
    });

    it('can handle connect with criteria', (done) => {
      const req = {
        tenantId,
        user: { isCore: true, id: 'tester', roles: ['test-subscriber'] } as User,
        params: { stream: 'test' },
        query: {
          criteria: JSON.stringify({ correlationId: '321' }),
        },
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
        disconnect: jest.fn(),
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
          traceparent: '123',
        })
      );
      listener(socket as unknown as Socket);
    });

    it('can handle disconnect', (done) => {
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
        emit: jest.fn(),
        disconnect: jest.fn(),
        on: jest.fn((_, cb) => {
          cb();
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
          traceparent: '123',
        })
      );
      listener(socket as unknown as Socket);
    });
  });
});
