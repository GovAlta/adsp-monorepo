import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import * as HttpStatusCodes from 'http-status-codes';
import axios from 'axios';
import { Request, Response } from 'express';
import { FormServiceRoles } from '..';
import { createRegisterRouter, getRegister, updateRegister } from './register';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('register router', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const directoryMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('token')),
  };

  const weekdaysDefinition = {
    configurationSchema: { type: 'array', items: { type: 'string' } },
    description: 'Days of the week',
  };

  beforeEach(() => {
    axiosMock.get.mockReset();
    axiosMock.patch.mockReset();
    directoryMock.getServiceUrl.mockReset();
    tokenProviderMock.getAccessToken.mockReturnValue(Promise.resolve('token'));
  });

  it('can create router', () => {
    const router = createRegisterRouter({ directory: directoryMock, tokenProvider: tokenProviderMock });
    expect(router).toBeTruthy();
  });

  describe('getRegister', () => {
    it('can create handler', () => {
      const handler = getRegister(directoryMock, tokenProviderMock);
      expect(handler).toBeTruthy();
    });

    it('can call next with unauthorized for non-admin', async () => {
      const req = {
        user: { tenantId, id: 'tester', roles: ['test-applicant'] },
        params: { namespace: 'data-register', name: 'weekdays' },
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getRegister(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can return 404 when register not found in platform config', async () => {
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);
      axiosMock.get.mockResolvedValue({ data: { configuration: {} } });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin] },
        params: { namespace: 'data-register', name: 'missing' },
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getRegister(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(res.send).not.toHaveBeenCalled();
    });

    it('can return 404 when data endpoint returns 404', async () => {
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);

      axiosMock.get
        .mockResolvedValueOnce({ data: { configuration: { 'data-register:weekdays': weekdaysDefinition } } })
        .mockResolvedValueOnce({ status: HttpStatusCodes.NOT_FOUND, data: null });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin] },
        params: { namespace: 'data-register', name: 'weekdays' },
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getRegister(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(res.send).not.toHaveBeenCalled();
    });

    it('can return register on success', async () => {
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);

      axiosMock.get
        .mockResolvedValueOnce({ data: { configuration: { 'data-register:weekdays': weekdaysDefinition } } })
        .mockResolvedValueOnce({
          status: HttpStatusCodes.OK,
          data: { configuration: ['Monday', 'Tuesday', 'Wednesday'] },
        });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin] },
        params: { namespace: 'data-register', name: 'weekdays' },
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getRegister(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith({
        namespace: 'data-register',
        name: 'weekdays',
        description: 'Days of the week',
        entries: ['Monday', 'Tuesday', 'Wednesday'],
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('can return empty description when definition has no description', async () => {
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);

      axiosMock.get
        .mockResolvedValueOnce({
          data: {
            configuration: {
              'data-register:simple': { configurationSchema: { type: 'array', items: { type: 'string' } } },
            },
          },
        })
        .mockResolvedValueOnce({ status: HttpStatusCodes.OK, data: { configuration: ['A', 'B'] } });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin] },
        params: { namespace: 'data-register', name: 'simple' },
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getRegister(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ description: '', entries: ['A', 'B'] }));
      expect(next).not.toHaveBeenCalled();
    });

    it('can call config service with tenant id', async () => {
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);

      axiosMock.get
        .mockResolvedValueOnce({ data: { configuration: { 'data-register:weekdays': weekdaysDefinition } } })
        .mockResolvedValueOnce({ status: HttpStatusCodes.OK, data: { configuration: [] } });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin] },
        params: { namespace: 'data-register', name: 'weekdays' },
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getRegister(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(axiosMock.get).toHaveBeenCalledWith(
        expect.stringContaining('platform/configuration-service/latest'),
        expect.objectContaining({ params: expect.objectContaining({ tenantId: tenantId.toString() }) }),
      );
    });
  });

  describe('updateRegister', () => {
    it('can create handler', () => {
      const handler = updateRegister(directoryMock, tokenProviderMock);
      expect(handler).toBeTruthy();
    });

    it('can call next with unauthorized for non-admin', async () => {
      const req = {
        user: { tenantId, id: 'tester', roles: ['test-applicant'] },
        params: { namespace: 'data-register', name: 'weekdays' },
        body: { entries: ['Monday'] },
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = updateRegister(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can return 404 when register does not exist', async () => {
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);
      axiosMock.get.mockResolvedValue({ data: { configuration: {} } });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { namespace: 'data-register', name: 'missing' },
        body: { entries: ['Monday'] },
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = updateRegister(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(axiosMock.patch).not.toHaveBeenCalled();
    });

    it('can update entries without changing description', async () => {
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);
      axiosMock.get.mockResolvedValue({
        data: { configuration: { 'data-register:weekdays': weekdaysDefinition } },
      });
      axiosMock.patch.mockResolvedValue({ data: { latest: { configuration: ['Monday', 'Tuesday'] } } });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { namespace: 'data-register', name: 'weekdays' },
        body: { entries: ['Monday', 'Tuesday'] },
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = updateRegister(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      // Only one patch call — entries only, no description update
      expect(axiosMock.patch).toHaveBeenCalledTimes(1);
      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.stringContaining('data-register/weekdays'),
        expect.objectContaining({ operation: 'REPLACE', configuration: ['Monday', 'Tuesday'] }),
        expect.any(Object),
      );
      expect(res.send).toHaveBeenCalledWith({
        namespace: 'data-register',
        name: 'weekdays',
        description: 'Days of the week',
        entries: ['Monday', 'Tuesday'],
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('can update both description and entries', async () => {
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);
      axiosMock.get.mockResolvedValue({
        data: { configuration: { 'data-register:weekdays': weekdaysDefinition } },
      });
      axiosMock.patch.mockResolvedValue({ data: { latest: { configuration: ['Mon', 'Tue'] } } });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { namespace: 'data-register', name: 'weekdays' },
        body: { description: 'Updated description', entries: ['Mon', 'Tue'] },
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = updateRegister(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      // Two patch calls — one for description, one for entries
      expect(axiosMock.patch).toHaveBeenCalledTimes(2);
      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.stringContaining('platform/configuration-service'),
        expect.objectContaining({
          operation: 'UPDATE',
          update: expect.objectContaining({
            'data-register:weekdays': expect.objectContaining({ description: 'Updated description' }),
          }),
        }),
        expect.any(Object),
      );
      expect(res.send).toHaveBeenCalledWith({
        namespace: 'data-register',
        name: 'weekdays',
        description: 'Updated description',
        entries: ['Mon', 'Tue'],
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('can update with empty entries array', async () => {
      const configurationServiceUrl = new URL('http://configuration-service');
      directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);
      axiosMock.get.mockResolvedValue({
        data: { configuration: { 'data-register:weekdays': weekdaysDefinition } },
      });
      axiosMock.patch.mockResolvedValue({ data: { latest: { configuration: [] } } });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { namespace: 'data-register', name: 'weekdays' },
        body: { entries: [] },
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = updateRegister(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ entries: [] }));
      expect(next).not.toHaveBeenCalled();
    });
  });
});
