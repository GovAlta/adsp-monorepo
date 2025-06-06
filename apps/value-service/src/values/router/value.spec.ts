import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { NamespaceEntity } from '../model';
import { ServiceUserRoles } from '../types';
import {
  assertUserCanWrite,
  countValue,
  createValueRouter,
  readMetric,
  readMetrics,
  readValue,
  readValues,
  writeValue,
} from './value';

describe('event router', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const validationServiceMock = {
    setSchema: jest.fn(),
    validate: jest.fn(),
  };

  const repositoryMock = {
    readValues: jest.fn(),
    countValues: jest.fn(),
    writeValues: jest.fn(),
    readMetrics: jest.fn(),
    readMetric: jest.fn(),
    writeMetric: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  beforeEach(() => {
    repositoryMock.readValues.mockReset();
    repositoryMock.countValues.mockReset();
    repositoryMock.readMetrics.mockReset();
    repositoryMock.readMetric.mockReset();
    repositoryMock.writeValues.mockReset();
    eventServiceMock.send.mockReset();
  });

  const namespace = new NamespaceEntity(
    validationServiceMock,
    repositoryMock,
    {
      name: 'test-service',
      description: null,
      definitions: { 'test-value': { name: 'test-value', description: null, type: null, jsonSchema: {} } },
    },
    tenantId
  );

  describe('assertUserCanWrite', () => {
    it('can pass for core user', (done) => {
      const next = (err) => {
        expect(err).toBeFalsy();
        done();
      };
      assertUserCanWrite(
        { user: { roles: [ServiceUserRoles.Writer], isCore: true }, tenant: { id: tenantId }, body: {} } as Request,
        {} as Response,
        next
      );
    });

    it('can pass for core user sending for tenant', (done) => {
      const tenantId = 'urn:ads:platform:tenant-service:v2:/tenants/test';
      const req = {
        user: { roles: [ServiceUserRoles.Writer], isCore: true },
        body: { tenantId: tenantId },
      } as Request;

      const next = (err) => {
        expect(err).toBeFalsy();
        expect(`${req['tenantId']}`).toBe(tenantId);
        done();
      };
      assertUserCanWrite(req, {} as Response, next);
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
      assertUserCanWrite({ user: { roles: [], isCore: true }, body: {} } as Request, {} as Response, next);
    });

    it('can pass for tenant user.', (done) => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const req = {
        user: {
          roles: [ServiceUserRoles.Writer],
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

      assertUserCanWrite(req, {} as Response, next);
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
      assertUserCanWrite(
        {
          user: {
            roles: [ServiceUserRoles.Writer],
            isCore: false,
            tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          },
          body: { tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test2' },
        } as Request,
        {} as Response,
        next
      );
    });

    it('can pass for tenant handler tenant.', (done) => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const req = {
        user: {
          roles: [ServiceUserRoles.Writer],
          isCore: true,
        },
        tenant: {
          id: tenantId,
        },
        body: {},
      } as Request;

      const next = (err) => {
        expect(err).toBeFalsy();
        expect(req['tenantId']).toBe(tenantId);
        done();
      };

      assertUserCanWrite(req, {} as Response, next);
    });

    it('can fail for tenant user specifying tenantId via tenant handler.', (done) => {
      const next = (error) => {
        try {
          expect(error).toBeTruthy();
          done();
        } catch (err) {
          done(err);
        }
      };
      assertUserCanWrite(
        {
          user: {
            roles: [ServiceUserRoles.Writer],
            isCore: false,
            tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          },
          tenant: { id: adspId`urn:ads:platform:tenant-service:v2:/tenants/test2` },
          body: {},
        } as Request,
        {} as Response,
        next
      );
    });
  });

  describe('can create router', () => {
    const router = createValueRouter({
      logger: loggerMock,
      repository: repositoryMock,
      eventService: eventServiceMock,
    });

    expect(router).toBeTruthy();
  });

  describe('readValues', () => {
    it('can read definition values', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service' },
        query: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const value = {};
      req.getConfiguration.mockResolvedValue([{ 'test-service': namespace }]);
      repositoryMock.readValues.mockResolvedValueOnce({
        results: [{ timestamp: new Date(), context: {}, correlationId: null, value }],
      });
      await readValues(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          'test-service': expect.objectContaining({ 'test-value': expect.objectContaining({ value }) }),
        })
      );
    });

    it('can call next with not found', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service' },
        query: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValue([{}]);
      await readValues(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('can read value by names', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service' },
        query: { names: 'test-value' },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const value = {};
      req.getConfiguration.mockResolvedValue([{ 'test-service': namespace }]);
      repositoryMock.readValues.mockResolvedValueOnce({
        results: [{ timestamp: new Date(), context: {}, correlationId: null, value }],
      });
      await readValues(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          'test-service': expect.objectContaining({ 'test-value': expect.objectContaining({ value }) }),
        })
      );
    });
  });

  describe('readValue', () => {
    it('can create handler', () => {
      const handler = readValue(loggerMock, repositoryMock);
      expect(handler).toBeTruthy();
    });
    it('can read value', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value' },
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const value = {};
      repositoryMock.readValues.mockResolvedValueOnce({
        results: [{ timestamp: new Date(), context: {}, correlationId: null, value }],
      });
      const handler = readValue(loggerMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          'test-service': expect.objectContaining({
            'test-value': expect.arrayContaining([expect.objectContaining({ value })]),
          }),
        })
      );
    });
    it('can read value with criteria', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value' },
        query: {
          top: '12',
          after: 'cursor',
          timestampMin: new Date().toISOString(),
          timestampMax: new Date().toISOString(),
          context: JSON.stringify({ a: 123 }),
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const value = {};
      repositoryMock.readValues.mockResolvedValueOnce({
        results: [{ timestamp: new Date(), context: {}, correlationId: null, value }],
      });
      const handler = readValue(loggerMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.readValues).toHaveBeenCalledWith(
        12,
        req.query.after,
        expect.objectContaining({
          timestampMin: expect.any(Date),
          timestampMax: expect.any(Date),
          context: expect.objectContaining({ a: 123 }),
        })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          'test-service': expect.objectContaining({
            'test-value': expect.arrayContaining([expect.objectContaining({ value })]),
          }),
        })
      );
    });
    it('can call next with no tenant', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value' },
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = readValue(loggerMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
    it('can call next with unauthorized user', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test-reader',
          roles: [],
        },
        params: { namespace: 'test-service', name: 'test-value' },
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();
      const handler = readValue(loggerMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('countValue', () => {
    it('can create handler', () => {
      const handler = countValue(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can count value', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value' },
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.countValues.mockResolvedValueOnce(12);
      const handler = countValue(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 12,
        })
      );
    });

    it('can count value with criteria', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value' },
        query: {
          timestampMin: new Date().toISOString(),
          timestampMax: new Date().toISOString(),
          context: JSON.stringify({ a: 123 }),
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.countValues.mockResolvedValueOnce(12);
      const handler = countValue(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.countValues).toHaveBeenCalledWith(
        expect.objectContaining({
          timestampMin: expect.any(Date),
          timestampMax: expect.any(Date),
          context: expect.objectContaining({ a: 123 }),
        })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 12,
        })
      );
    });

    it('can call next with no tenant', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value' },
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = countValue(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with unauthorized user', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test-reader',
          roles: [],
        },
        params: { namespace: 'test-service', name: 'test-value' },
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = countValue(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('writeValue', () => {
    it('can create handler', () => {
      const handler = writeValue(loggerMock, eventServiceMock, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can write value', async () => {
      const req = {
        tenantId,
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value' },
        query: {},
        body: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce([{}]);

      const value = {};
      repositoryMock.writeValues.mockResolvedValueOnce([
        {
          tenantId,
          timestamp: new Date(),
          context: {},
          correlationId: null,
          value,
        },
      ]);

      const handler = writeValue(loggerMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ value }));
    });

    it('can write value record', async () => {
      const req = {
        tenantId,
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value' },
        query: {},
        body: { value: {}, correlationId: '123', timestamp: new Date().toISOString() },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce([{}]);

      repositoryMock.writeValues.mockImplementationOnce((_ns, _n, _t, vs) => Promise.resolve(vs));

      const handler = writeValue(loggerMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ correlationId: '123', timestamp: expect.any(Date) })
      );
    });

    it('can write defined value', async () => {
      const req = {
        tenantId,
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value' },
        query: {},
        body: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce([{ 'test-service': namespace }]);

      const value = {};
      repositoryMock.writeValues.mockResolvedValueOnce([
        {
          tenantId,
          timestamp: new Date(),
          context: {},
          correlationId: null,
          value,
        },
      ]);

      const handler = writeValue(loggerMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ value }));
    });

    it('can send write event for defined value', async () => {
      const req = {
        tenantId,
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value' },
        query: {},
        body: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce([
        {
          'test-service': new NamespaceEntity(
            validationServiceMock,
            repositoryMock,
            {
              name: 'test-service',
              description: null,
              definitions: {
                'test-value': {
                  name: 'test-value',
                  description: null,
                  type: null,
                  jsonSchema: {},
                  sendWriteEvent: true,
                },
              },
            },
            tenantId
          ),
        },
      ]);

      const value = {};
      repositoryMock.writeValues.mockResolvedValueOnce([
        {
          tenantId,
          timestamp: new Date(),
          context: {},
          correlationId: null,
          value,
        },
      ]);

      const handler = writeValue(loggerMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(eventServiceMock.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'value-written' }));
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ value }));
    });

    it('can write array', async () => {
      const req = {
        tenantId,
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value' },
        query: {},
        body: [{ value: {}, correlationId: '123', timestamp: new Date().toISOString() }],
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce([{}]);

      repositoryMock.writeValues.mockImplementationOnce((_ns, _n, _t, vs) => Promise.resolve(vs));

      const handler = writeValue(loggerMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ correlationId: '123', timestamp: expect.any(Date) })])
      );
    });

    it('can handle failed scalar write', async () => {
      const req = {
        tenantId,
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value' },
        query: {},
        body: { value: {}, correlationId: '123', timestamp: new Date().toISOString() },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce([{}]);

      repositoryMock.writeValues.mockRejectedValueOnce(new Error('oh noes!'));

      const handler = writeValue(loggerMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('can handle failed array write', async () => {
      const req = {
        tenantId,
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value' },
        query: {},
        body: [{ value: {}, correlationId: '123', timestamp: new Date().toISOString() }],
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockResolvedValueOnce([{}]);

      repositoryMock.writeValues.mockRejectedValueOnce(new Error('oh noes!'));

      const handler = writeValue(loggerMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('can write value on configuration error', async () => {
      const req = {
        tenantId,
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value' },
        query: {},
        body: {},
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      req.getConfiguration.mockRejectedValueOnce(new Error('oh noes!'));

      const value = {};
      repositoryMock.writeValues.mockResolvedValueOnce([
        {
          tenantId,
          timestamp: new Date(),
          context: {},
          correlationId: null,
          value,
        },
      ]);

      const handler = writeValue(loggerMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ value }));
    });
  });

  describe('readMetrics', () => {
    it('can create handler', () => {
      const handler = readMetrics(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can read metrics', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value', metric: 'count' },
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const metrics = { count: { name: 'count', values: [] } };
      repositoryMock.readMetrics.mockResolvedValueOnce(metrics);
      const handler = readMetrics(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(metrics);
    });

    it('can read metrics with criteria', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value', metric: 'count' },
        query: {
          interval: 'weekly',
          criteria: JSON.stringify({
            metricLike: 'count',
            intervalMin: new Date().toISOString(),
            intervalMax: new Date().toISOString(),
          }),
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const metrics = { count: { name: 'count', values: [] } };
      repositoryMock.readMetrics.mockResolvedValueOnce(metrics);
      const handler = readMetrics(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.readMetrics).toHaveBeenCalledWith(
        tenantId,
        'test-service',
        'test-value',
        100,
        undefined,
        expect.objectContaining({
          interval: 'weekly',
          metricLike: 'count',
          intervalMin: expect.any(Date),
          intervalMax: expect.any(Date),
        })
      );
      expect(res.send).toHaveBeenCalledWith(metrics);
    });

    it('can call next for no tenant context', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value', metric: 'count' },
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = readMetrics(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next for unauthorized user', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test-reader',
          roles: [],
        },
        params: { namespace: 'test-service', name: 'test-value', metric: 'count' },
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = readMetrics(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('readMetric', () => {
    it('can create handler', () => {
      const handler = readMetric(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can read metric', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value', metric: 'count' },
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const metric = { name: 'count', values: [] };
      repositoryMock.readMetric.mockResolvedValueOnce(metric);
      const handler = readMetric(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(metric);
    });

    it('can read metric with criteria', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value', metric: 'count' },
        query: {
          interval: 'weekly',
          criteria: JSON.stringify({ intervalMin: new Date().toISOString(), intervalMax: new Date().toISOString() }),
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const metric = { name: 'count', values: [] };
      repositoryMock.readMetric.mockResolvedValueOnce(metric);
      const handler = readMetric(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.readMetric).toHaveBeenCalledWith(
        tenantId,
        'test-service',
        'test-value',
        'count',
        100,
        undefined,
        expect.objectContaining({ interval: 'weekly', intervalMin: expect.any(Date), intervalMax: expect.any(Date) })
      );
      expect(res.send).toHaveBeenCalledWith(metric);
    });

    it('can call next for no tenant context', async () => {
      const req = {
        user: {
          tenantId,
          id: 'test-reader',
          roles: [ServiceUserRoles.Reader],
        },
        params: { namespace: 'test-service', name: 'test-value', metric: 'count' },
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = readMetric(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next for unauthorized user', async () => {
      const req = {
        tenant: {
          id: tenantId,
        },
        user: {
          tenantId,
          id: 'test-reader',
          roles: [],
        },
        params: { namespace: 'test-service', name: 'test-value', metric: 'count' },
        query: {},
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const handler = readMetric(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });
});
