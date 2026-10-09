import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { createEventRouter, sendEvent } from '.';
import { DomainEventService, NamespaceEntity } from '..';
import { EventLogRepository } from '../repository';
import { EventServiceRoles, EventServiceValueRoles } from '../role';
import { assertUserCanSend, countEvents } from './event';

describe('event router', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const eventServiceMock = {
    send: jest.fn(),
  };

  const eventLogRepositoryMock = {
    countEvents: jest.fn(),
  };

  const validationServiceMock = {
    setSchema: jest.fn(),
    validate: jest.fn(),
  };

  beforeEach(() => {
    eventServiceMock.send.mockReset();
    eventLogRepositoryMock.countEvents.mockReset();
    validationServiceMock.setSchema.mockReset();
    validationServiceMock.validate.mockReset();
  });

  it('can create router', () => {
    const router = createEventRouter({
      logger: loggerMock,
      eventService: eventServiceMock as unknown as DomainEventService,
      eventLogRepository: eventLogRepositoryMock as unknown as EventLogRepository,
    });
    expect(router).toBeTruthy();
  });

  describe('assertUserCanSend', () => {
    it('can pass for core user', (done) => {
      const tenantId = 'urn:ads:platform:tenant-service:v2:/tenants/test';
      const next = (err) => {
        expect(err).toBeFalsy();
        done();
      };
      assertUserCanSend(
        { user: { roles: [EventServiceRoles.sender], isCore: true }, body: { tenantId } } as Request,
        {} as Response,
        next,
      );
    });

    it('can pass for core user sending for tenant', (done) => {
      const tenantId = 'urn:ads:platform:tenant-service:v2:/tenants/test';
      const req = {
        user: { roles: [EventServiceRoles.sender], isCore: true },
        body: { tenantId },
      } as Request;

      const next = (err) => {
        expect(err).toBeFalsy();
        expect(`${req.tenant.id}`).toBe(tenantId);
        done();
      };
      assertUserCanSend(req, {} as Response, next);
    });

    it('can fail for core user without role.', (done) => {
      const next = (error) => {
        try {
          expect(error).toBeTruthy();
          done();
        } catch (err) {
          done(err);
        }
      };
      assertUserCanSend({ user: { roles: [], isCore: true }, body: {} } as Request, {} as Response, next);
    });

    it('can pass for tenant user.', (done) => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const req = {
        user: {
          roles: [EventServiceRoles.sender],
          isCore: false,
          tenantId,
        },
        body: {},
      } as Request;

      const next = (err) => {
        expect(err).toBeFalsy();
        expect(req.tenant.id).toBe(tenantId);
        done();
      };

      assertUserCanSend(req, {} as Response, next);
    });

    it('can fail for tenant user specifying other tenantId.', (done) => {
      const next = (error) => {
        try {
          expect(error).toBeTruthy();
          done();
        } catch (err) {
          done(err);
        }
      };
      assertUserCanSend(
        {
          user: {
            roles: [EventServiceRoles.sender],
            isCore: false,
            tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          },
          body: { tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test2' },
        } as Request,
        {} as Response,
        next,
      );
    });

    it('can pass for tenant user specifying same tenantId.', async () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const next = jest.fn();
      await assertUserCanSend(
        {
          user: {
            roles: [EventServiceRoles.sender],
            isCore: false,
            tenantId,
          },
          body: { tenantId: tenantId.toString() },
        } as Request,
        {} as Response,
        next,
      );

      expect(next).toHaveBeenCalledWith();
    });

    it('can fail for no tenant context', (done) => {
      const req = {
        user: { roles: [EventServiceRoles.sender], isCore: true },
        body: {},
      } as Request;

      const next = (err) => {
        expect(err).toEqual(expect.any(InvalidOperationError));
        done();
      };
      assertUserCanSend(req, {} as Response, next);
    });

    it('can skip if tenant already set', async () => {
      const tenantId = 'urn:ads:platform:tenant-service:v2:/tenants/test';
      const tenant2Id = 'urn:ads:platform:tenant-service:v2:/tenants/test2';
      const next = jest.fn();

      const req = {
        user: { roles: [EventServiceRoles.sender], isCore: false, tenantId },
        tenant: { id: tenantId },
        body: { tenant: tenant2Id },
      };
      await assertUserCanSend(req as unknown as Request, {} as Response, next);

      expect(req.tenant.id).toBe(tenantId);
    });
  });

  describe('sendEvent', () => {
    it('can create handler', () => {
      const handler = sendEvent(loggerMock, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can send event', async () => {
      const req = {
        user: { tenantId, name: 'test', id: 'test' },
        tenant: { id: tenantId },
        body: {
          namespace: 'test',
          name: 'test',
          timestamp: '2021-03-23T12:00:00Z',
        },
        getConfiguration: jest.fn(),
      };
      const res = { sendStatus: jest.fn() };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({});
      const handler = sendEvent(loggerMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(req.getConfiguration).toHaveBeenCalled();
      expect(res.sendStatus).toHaveBeenCalledWith(200);
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, namespace: 'test', name: 'test' }),
      );
    });

    it('can send defined event', async () => {
      const req = {
        user: { tenantId, name: 'test', id: 'test' },
        tenant: { id: tenantId },
        body: {
          namespace: 'test',
          name: 'test',
          timestamp: '2021-03-23T12:00:00Z',
          payload: {},
        },
        getConfiguration: jest.fn(),
      };
      const res = { sendStatus: jest.fn() };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce({
        test: new NamespaceEntity(
          validationServiceMock,
          { name: 'test', definitions: { test: { name: 'test', description: null, payloadSchema: {} } } },
          tenantId,
        ),
      });
      const handler = sendEvent(loggerMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(req.getConfiguration).toHaveBeenCalled();
      expect(res.sendStatus).toHaveBeenCalledWith(200);
      expect(validationServiceMock.validate).toHaveBeenCalled();
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, namespace: 'test', name: 'test' }),
      );
    });

    it('can call next with invalid error for no namespace', async () => {
      const req = {
        user: { tenantId, name: 'test', id: 'test' },
        tenant: { id: tenantId },
        body: {
          name: 'test',
          timestamp: '2021-03-23T12:00:00Z',
        },
        getConfiguration: jest.fn(),
      };
      const res = { sendStatus: jest.fn() };
      const next = jest.fn();

      const handler = sendEvent(loggerMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.sendStatus).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with invalid error for no name', async () => {
      const req = {
        user: { tenantId, name: 'test', id: 'test' },
        tenant: { id: tenantId },
        body: {
          namespace: 'test',
          timestamp: '2021-03-23T12:00:00Z',
        },
        getConfiguration: jest.fn(),
      };
      const res = { sendStatus: jest.fn() };
      const next = jest.fn();

      const handler = sendEvent(loggerMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.sendStatus).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with invalid error for no timestamp', async () => {
      const req = {
        user: { tenantId, name: 'test', id: 'test' },
        tenant: { id: tenantId },
        body: {
          namespace: 'test',
          name: 'test',
        },
        getConfiguration: jest.fn(),
      };
      const res = { sendStatus: jest.fn() };
      const next = jest.fn();

      const handler = sendEvent(loggerMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.sendStatus).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('countEvents', () => {
    it('can create handler', () => {
      const handler = countEvents(loggerMock, eventLogRepositoryMock as unknown as EventLogRepository);
      expect(handler).toBeTruthy();
    });

    it('can count events with no criteria', async () => {
      const req = {
        user: { tenantId, name: 'test', id: 'test', isCore: false, roles: [EventServiceRoles.reader] },
        tenant: { id: tenantId },
        query: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      eventLogRepositoryMock.countEvents.mockResolvedValueOnce(42);
      const handler = countEvents(loggerMock, eventLogRepositoryMock as unknown as EventLogRepository);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(eventLogRepositoryMock.countEvents).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ namespace: undefined, name: undefined }),
      );
      expect(res.send).toHaveBeenCalledWith({ count: 42 });
      expect(next).not.toHaveBeenCalled();
    });

    it('can count events filtered by namespace only', async () => {
      const req = {
        user: { tenantId, name: 'test', id: 'test', isCore: false, roles: [EventServiceRoles.reader] },
        tenant: { id: tenantId },
        query: { namespace: 'application-events' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      eventLogRepositoryMock.countEvents.mockResolvedValueOnce(7);
      const handler = countEvents(loggerMock, eventLogRepositoryMock as unknown as EventLogRepository);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(eventLogRepositoryMock.countEvents).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ namespace: 'application-events', name: undefined }),
      );
      expect(res.send).toHaveBeenCalledWith({ count: 7 });
    });

    it('can count events filtered by name only', async () => {
      const req = {
        user: { tenantId, name: 'test', id: 'test', isCore: false, roles: [EventServiceRoles.reader] },
        tenant: { id: tenantId },
        query: { name: 'user-registration' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      eventLogRepositoryMock.countEvents.mockResolvedValueOnce(3);
      const handler = countEvents(loggerMock, eventLogRepositoryMock as unknown as EventLogRepository);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(eventLogRepositoryMock.countEvents).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ namespace: undefined, name: 'user-registration' }),
      );
      expect(res.send).toHaveBeenCalledWith({ count: 3 });
    });

    it('can count events combining all criteria', async () => {
      const req = {
        user: { tenantId, name: 'test', id: 'test', isCore: false, roles: [EventServiceRoles.reader] },
        tenant: { id: tenantId },
        query: {
          namespace: 'application-events',
          name: 'user-registration',
          timestampMin: '2021-03-23T12:00:00Z',
          timestampMax: '2021-03-24T12:00:00Z',
          correlationId: 'Bobs-user-id',
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      eventLogRepositoryMock.countEvents.mockResolvedValueOnce(1);
      const handler = countEvents(loggerMock, eventLogRepositoryMock as unknown as EventLogRepository);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(eventLogRepositoryMock.countEvents).toHaveBeenCalledWith(tenantId, {
        namespace: 'application-events',
        name: 'user-registration',
        timestampMin: new Date('2021-03-23T12:00:00Z'),
        timestampMax: new Date('2021-03-24T12:00:00Z'),
        correlationId: 'Bobs-user-id',
      });
      expect(res.send).toHaveBeenCalledWith({ count: 1 });
    });

    it('can call next with invalid operation error for no tenant context', async () => {
      const req = {
        user: { name: 'test', id: 'test', isCore: true, roles: [EventServiceRoles.reader] },
        tenant: undefined,
        query: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = countEvents(loggerMock, eventLogRepositoryMock as unknown as EventLogRepository);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(eventLogRepositoryMock.countEvents).not.toHaveBeenCalled();
    });

    it('can call next with unauthorized error without the event-reader role', async () => {
      const req = {
        user: { tenantId, name: 'test', id: 'test', isCore: false, roles: [] },
        tenant: { id: tenantId },
        query: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = countEvents(loggerMock, eventLogRepositoryMock as unknown as EventLogRepository);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(eventLogRepositoryMock.countEvents).not.toHaveBeenCalled();
    });

    it('can pass with the value service reader role', async () => {
      const req = {
        user: { tenantId, name: 'test', id: 'test', isCore: false, roles: [EventServiceValueRoles.Reader] },
        tenant: { id: tenantId },
        query: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      eventLogRepositoryMock.countEvents.mockResolvedValueOnce(0);
      const handler = countEvents(loggerMock, eventLogRepositoryMock as unknown as EventLogRepository);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith({ count: 0 });
      expect(next).not.toHaveBeenCalled();
    });

    it('can call next with the repository error', async () => {
      const req = {
        user: { tenantId, name: 'test', id: 'test', isCore: false, roles: [EventServiceRoles.reader] },
        tenant: { id: tenantId },
        query: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();
      const err = new Error('upstream failure');

      eventLogRepositoryMock.countEvents.mockRejectedValueOnce(err);
      const handler = countEvents(loggerMock, eventLogRepositoryMock as unknown as EventLogRepository);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
