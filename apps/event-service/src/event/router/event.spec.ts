import { adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { createEventRouter, sendEvent } from '.';
import { DomainEventService, NamespaceEntity } from '..';
import { EventServiceRoles } from '../role';
import { assertUserCanSend } from './event';

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

  const validationServiceMock = {
    setSchema: jest.fn(),
    validate: jest.fn(),
  };

  beforeEach(() => {
    eventServiceMock.send.mockReset();
    validationServiceMock.setSchema.mockReset();
    validationServiceMock.validate.mockReset();
  });

  it('can create router', () => {
    const router = createEventRouter({
      logger: loggerMock,
      eventService: eventServiceMock as unknown as DomainEventService,
    });
    expect(router).toBeTruthy();
  });

  describe('assertUserCanSend', () => {
    it('can pass for core user', (done) => {
      const next = (err) => {
        expect(err).toBeFalsy();
        done();
      };
      assertUserCanSend(
        { user: { roles: [EventServiceRoles.sender], isCore: true }, body: {} } as Request,
        {} as Response,
        next
      );
    });

    it('can pass for core user sending for tenant', (done) => {
      const tenantId = 'urn:ads:platform:tenant-service:v2:/tenants/test';
      const req = {
        user: { roles: [EventServiceRoles.sender], isCore: true },
        body: { tenantId: tenantId },
      } as Request;

      const next = (err) => {
        expect(err).toBeFalsy();
        expect(`${req['tenantId']}`).toBe(tenantId);
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
        expect(req['tenantId']).toBe(tenantId);
        done();
      };

      assertUserCanSend(req, {} as Response, next);
    });

    it('can fail for tenant user specifying tenantId.', (done) => {
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
        next
      );
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
        tenantId,
        body: {
          namespace: 'test',
          name: 'test',
          timestamp: '2021-03-23T12:00:00Z',
        },
        getConfiguration: jest.fn(),
      };
      const res = { sendStatus: jest.fn() };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce([{}, {}]);
      const handler = sendEvent(loggerMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(req.getConfiguration).toHaveBeenCalled();
      expect(res.sendStatus).toHaveBeenCalledWith(200);
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, namespace: 'test', name: 'test' })
      );
    });

    it('can send defined event', async () => {
      const req = {
        user: { tenantId, name: 'test', id: 'test' },
        tenantId,
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

      req.getConfiguration.mockResolvedValueOnce([
        {
          test: new NamespaceEntity(
            validationServiceMock,
            { name: 'test', definitions: { test: { name: 'test', description: null, payloadSchema: {} } } },
            tenantId
          ),
        },
        {},
      ]);
      const handler = sendEvent(loggerMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(req.getConfiguration).toHaveBeenCalled();
      expect(res.sendStatus).toHaveBeenCalledWith(200);
      expect(validationServiceMock.validate).toHaveBeenCalled();
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, namespace: 'test', name: 'test' })
      );
    });

    it('can call next with invalid error for no namespace', async () => {
      const req = {
        user: { tenantId, name: 'test', id: 'test' },
        tenantId,
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
        tenantId,
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
        tenantId,
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
});
