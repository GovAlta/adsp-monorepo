import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { createErrorHandler, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import * as HttpStatusCodes from 'http-status-codes';
import * as express from 'express';
import { Request, Response } from 'express';
import * as request from 'supertest';
import { DataRegisterClient } from '../dataRegisterClient';
import { ConfigurationServiceRoles, FormServiceRoles } from '../roles';
import {
  createRegister,
  createRegisterRouter,
  deleteRegister,
  findRegisters,
  getRegister,
  REGISTER_NAME_PATTERN,
  updateRegister,
} from './register';

describe('register router', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const clientMock = {
    find: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const client = clientMock as unknown as DataRegisterClient;

  const loggerMock = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };

  const register = {
    namespace: 'data-register',
    name: 'weekdays',
    description: 'Days of the week',
    entries: ['Monday'],
  };

  const createReq = (props: Record<string, unknown>) =>
    ({
      user: { id: 'admin', name: 'Admin', tenantId, roles: [FormServiceRoles.Admin], isCore: false },
      tenant: { id: tenantId },
      body: {},
      params: {},
      ...props,
    }) as unknown as Request;

  const createRes = (): Response & { status: jest.Mock; send: jest.Mock; sendStatus: jest.Mock } =>
    ({
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      sendStatus: jest.fn(),
    }) as unknown as Response & { status: jest.Mock; send: jest.Mock; sendStatus: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('can create router', () => {
    expect(createRegisterRouter({ client, logger: loggerMock as never })).toBeTruthy();
  });

  describe('REGISTER_NAME_PATTERN', () => {
    it('accepts a name containing an underscore', () => {
      expect(REGISTER_NAME_PATTERN.test('week_days')).toBe(true);
    });

    it('accepts a name containing a space', () => {
      expect(REGISTER_NAME_PATTERN.test('week days')).toBe(true);
    });

    it('rejects a name with characters outside the allowed set', () => {
      expect(REGISTER_NAME_PATTERN.test('weekdays!')).toBe(false);
    });
  });

  describe('findRegisters', () => {
    it('calls next with unauthorized for a user with no matching role', async () => {
      const req = createReq({ user: { id: 'none', name: 'None', tenantId, roles: [], isCore: false } });
      const res = createRes();
      const next = jest.fn();

      await findRegisters(client)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(clientMock.find).not.toHaveBeenCalled();
    });

    it('calls next with invalid operation when there is no tenant context', async () => {
      const req = createReq({ tenant: undefined });
      const res = createRes();
      const next = jest.fn();

      await findRegisters(client)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('sends the registers for a form-admin user', async () => {
      clientMock.find.mockResolvedValue([register]);
      const req = createReq({});
      const res = createRes();
      const next = jest.fn();

      await findRegisters(client)(req, res, next);

      expect(res.send).toHaveBeenCalledWith([register]);
      expect(next).not.toHaveBeenCalled();
    });

    it('allows a user holding only the configuration-admin role', async () => {
      clientMock.find.mockResolvedValue([register]);
      const req = createReq({
        user: {
          id: 'config-admin',
          name: 'Config Admin',
          tenantId,
          roles: [ConfigurationServiceRoles.ConfigurationAdmin],
          isCore: false,
        },
      });
      const res = createRes();
      const next = jest.fn();

      await findRegisters(client)(req, res, next);

      expect(res.send).toHaveBeenCalledWith([register]);
      expect(next).not.toHaveBeenCalled();
    });

    it('allows a core user holding the admin role', async () => {
      clientMock.find.mockResolvedValue([register]);
      const req = createReq({
        user: {
          id: 'core-admin',
          name: 'Core Admin',
          tenantId: undefined,
          roles: [FormServiceRoles.Admin],
          isCore: true,
        },
      });
      const res = createRes();
      const next = jest.fn();

      await findRegisters(client)(req, res, next);

      expect(res.send).toHaveBeenCalledWith([register]);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getRegister', () => {
    it('calls next with unauthorized for a user with no matching role', async () => {
      const req = createReq({
        user: { id: 'none', name: 'None', tenantId, roles: [], isCore: false },
        params: { name: 'weekdays' },
      });
      const res = createRes();
      const next = jest.fn();

      await getRegister(client)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('calls next with the client error when the register is not found', async () => {
      clientMock.get.mockRejectedValue(new NotFoundError('data register', 'missing'));
      const req = createReq({ params: { name: 'missing' } });
      const res = createRes();
      const next = jest.fn();

      await getRegister(client)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('sends the register on success', async () => {
      clientMock.get.mockResolvedValue(register);
      const req = createReq({ params: { name: 'weekdays' } });
      const res = createRes();
      const next = jest.fn();

      await getRegister(client)(req, res, next);

      expect(clientMock.get).toHaveBeenCalledWith(tenantId, 'weekdays');
      expect(res.send).toHaveBeenCalledWith(register);
    });
  });

  describe('createRegister', () => {
    it('calls next with unauthorized for a user with no matching role', async () => {
      const req = createReq({
        user: { id: 'none', name: 'None', tenantId, roles: [], isCore: false },
        body: { name: 'weekdays' },
      });
      const res = createRes();
      const next = jest.fn();

      await createRegister(client, loggerMock as never)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(clientMock.create).not.toHaveBeenCalled();
    });

    it('sends 201 with the created register', async () => {
      clientMock.create.mockResolvedValue(register);
      const req = createReq({ body: { name: 'weekdays', description: 'Days of the week', entries: ['Monday'] } });
      const res = createRes();
      const next = jest.fn();

      await createRegister(client, loggerMock as never)(req, res, next);

      expect(clientMock.create).toHaveBeenCalledWith(tenantId, req.body);
      expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.CREATED);
      expect(res.send).toHaveBeenCalledWith(register);
      expect(next).not.toHaveBeenCalled();
    });

    it('logs the acting user on success', async () => {
      clientMock.create.mockResolvedValue(register);
      const req = createReq({ body: { name: 'weekdays' } });
      const res = createRes();

      await createRegister(client, loggerMock as never)(req, res, jest.fn());

      expect(loggerMock.info).toHaveBeenCalledWith(
        expect.stringContaining('created by Admin'),
        expect.objectContaining({ context: 'register-router', tenant: tenantId.toString() }),
      );
    });

    it('calls next with the client error on conflict', async () => {
      clientMock.create.mockRejectedValue(
        new InvalidOperationError(`Data register 'weekdays' already exists.`, { statusCode: HttpStatusCodes.CONFLICT }),
      );
      const req = createReq({ body: { name: 'weekdays' } });
      const res = createRes();
      const next = jest.fn();

      await createRegister(client, loggerMock as never)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('updateRegister', () => {
    it('calls next with unauthorized for a user with no matching role', async () => {
      const req = createReq({
        user: { id: 'none', name: 'None', tenantId, roles: [], isCore: false },
        params: { name: 'weekdays' },
        body: { entries: ['Monday'] },
      });
      const res = createRes();
      const next = jest.fn();

      await updateRegister(client, loggerMock as never)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(clientMock.update).not.toHaveBeenCalled();
    });

    it('sends the updated register', async () => {
      const updated = { ...register, description: 'Updated' };
      clientMock.update.mockResolvedValue(updated);
      const req = createReq({ params: { name: 'weekdays' }, body: { description: 'Updated' } });
      const res = createRes();
      const next = jest.fn();

      await updateRegister(client, loggerMock as never)(req, res, next);

      expect(clientMock.update).toHaveBeenCalledWith(tenantId, 'weekdays', req.body);
      expect(res.send).toHaveBeenCalledWith(updated);
    });

    it('calls next with the client error when the register is not found', async () => {
      clientMock.update.mockRejectedValue(new NotFoundError('data register', 'missing'));
      const req = createReq({ params: { name: 'missing' }, body: { entries: ['Monday'] } });
      const res = createRes();
      const next = jest.fn();

      await updateRegister(client, loggerMock as never)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('deleteRegister', () => {
    it('calls next with unauthorized for a user with no matching role', async () => {
      const req = createReq({
        user: { id: 'none', name: 'None', tenantId, roles: [], isCore: false },
        params: { name: 'weekdays' },
      });
      const res = createRes();
      const next = jest.fn();

      await deleteRegister(client, loggerMock as never)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
      expect(clientMock.delete).not.toHaveBeenCalled();
    });

    it('sends 204 on success', async () => {
      clientMock.delete.mockResolvedValue(undefined);
      const req = createReq({ params: { name: 'weekdays' } });
      const res = createRes();
      const next = jest.fn();

      await deleteRegister(client, loggerMock as never)(req, res, next);

      expect(clientMock.delete).toHaveBeenCalledWith(tenantId, 'weekdays');
      expect(res.sendStatus).toHaveBeenCalledWith(HttpStatusCodes.NO_CONTENT);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next with the client error when neither part of the register exists', async () => {
      clientMock.delete.mockRejectedValue(new NotFoundError('data register', 'missing'));
      const req = createReq({ params: { name: 'missing' } });
      const res = createRes();
      const next = jest.fn();

      await deleteRegister(client, loggerMock as never)(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('request validation', () => {
    const buildApp = (): express.Express => {
      const app = express();
      app.use(express.json());
      app.use((req, _res, next) => {
        req.user = { id: 'admin', name: 'Admin', tenantId, roles: [FormServiceRoles.Admin], isCore: false } as never;
        req.isAuthenticated = (() => true) as never;
        req.tenant = { id: tenantId } as never;
        next();
      });
      app.use(createRegisterRouter({ client, logger: loggerMock as never }));
      app.use(createErrorHandler(loggerMock as never));
      return app;
    };

    it('accepts a name containing an underscore and a space', async () => {
      clientMock.create.mockResolvedValue(register);

      const res = await request(buildApp()).post('/registers').send({ name: 'week_days one' });

      expect(res.status).toBe(HttpStatusCodes.CREATED);
    });

    it('rejects a name with characters outside the allowed pattern', async () => {
      const res = await request(buildApp()).post('/registers').send({ name: 'weekdays!' });

      expect(res.status).toBe(HttpStatusCodes.BAD_REQUEST);
      expect(clientMock.create).not.toHaveBeenCalled();
    });

    it('rejects an entry that is neither a string nor an object', async () => {
      const res = await request(buildApp())
        .post('/registers')
        .send({ name: 'weekdays', entries: [42] });

      expect(res.status).toBe(HttpStatusCodes.BAD_REQUEST);
      expect(clientMock.create).not.toHaveBeenCalled();
    });

    it('accepts entries that are strings or objects', async () => {
      clientMock.create.mockResolvedValue(register);

      const res = await request(buildApp())
        .post('/registers')
        .send({ name: 'weekdays', entries: ['Monday', { label: 'Tuesday', value: 2 }] });

      expect(res.status).toBe(HttpStatusCodes.CREATED);
    });
  });
});
