import { adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import * as HttpStatusCodes from 'http-status-codes';
import axios from 'axios';
import { Request, Response } from 'express';
import { FormServiceRoles } from '..';
import { createRegisterRouter, findDataRegisters, getRegister, updateRegister } from './register';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('register router', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const configurationServiceUrl = new URL('http://configuration-service');

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
    directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);
    tokenProviderMock.getAccessToken.mockReturnValue(Promise.resolve('token'));
  });

  // Mocks both config-service GET calls for getRegister: entries data first, then platform config.
  function mockGetResponses(dataResponse: object) {
    axiosMock.get
      .mockResolvedValueOnce(dataResponse)
      .mockResolvedValueOnce({ data: { configuration: { 'data-register:weekdays': weekdaysDefinition } } });
  }

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
        params: { name: 'weekdays' },
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getRegister(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can return 404 when entries data endpoint returns 404', async () => {
      axiosMock.get.mockResolvedValueOnce({ status: HttpStatusCodes.NOT_FOUND, data: null });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin] },
        params: { name: 'missing' },
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
      mockGetResponses({ status: HttpStatusCodes.NOT_FOUND, data: null });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin] },
        params: { name: 'weekdays' },
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
      mockGetResponses({ status: HttpStatusCodes.OK, data: { configuration: ['Monday', 'Tuesday', 'Wednesday'] } });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin] },
        params: { name: 'weekdays' },
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
      axiosMock.get
        .mockResolvedValueOnce({ status: HttpStatusCodes.OK, data: { configuration: ['A', 'B'] } })
        .mockResolvedValueOnce({
          data: {
            configuration: {
              'data-register:simple': { configurationSchema: { type: 'array', items: { type: 'string' } } },
            },
          },
        });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin] },
        params: { name: 'simple' },
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
      mockGetResponses({ status: HttpStatusCodes.OK, data: { configuration: [] } });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin] },
        params: { name: 'weekdays' },
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

    it('accepts OK and NOT_FOUND on entries endpoint validateStatus', async () => {
      mockGetResponses({ status: HttpStatusCodes.OK, data: { configuration: [] } });
      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin] },
        params: { name: 'weekdays' },
        tenant: { id: tenantId },
      };
      const handler = getRegister(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, { send: jest.fn() } as unknown as Response, jest.fn());
      const { validateStatus } = axiosMock.get.mock.calls[0][1] as { validateStatus: (s: number) => boolean };
      expect(validateStatus(HttpStatusCodes.OK)).toBe(true);
      expect(validateStatus(HttpStatusCodes.NOT_FOUND)).toBe(true);
      expect(validateStatus(500)).toBe(false);
    });
  });

  describe('updateRegister', () => {
    beforeEach(() => {
      // First GET: existence check (returns OK), Second GET: platform config with descriptions
      axiosMock.get
        .mockResolvedValueOnce({ status: HttpStatusCodes.OK, data: { configuration: [] } })
        .mockResolvedValueOnce({ data: { configuration: { 'data-register:weekdays': weekdaysDefinition } } });
    });

    it('can create handler', () => {
      const handler = updateRegister(directoryMock, tokenProviderMock);
      expect(handler).toBeTruthy();
    });

    it('can call next with unauthorized for non-admin', async () => {
      const req = {
        user: { tenantId, id: 'tester', roles: ['test-applicant'] },
        params: { name: 'weekdays' },
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
      axiosMock.get.mockReset();
      axiosMock.get.mockResolvedValueOnce({ status: HttpStatusCodes.NOT_FOUND, data: null });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { name: 'missing' },
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
      axiosMock.patch.mockResolvedValue({ data: { latest: { configuration: ['Monday', 'Tuesday'] } } });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { name: 'weekdays' },
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
      axiosMock.patch.mockResolvedValue({ data: { latest: { configuration: ['Mon', 'Tue'] } } });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { name: 'weekdays' },
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
      axiosMock.patch.mockResolvedValue({ data: { latest: { configuration: [] } } });

      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { name: 'weekdays' },
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

    it('accepts OK and NOT_FOUND on existence check validateStatus', async () => {
      axiosMock.patch.mockResolvedValue({ data: { latest: { configuration: [] } } });
      const req = {
        user: { tenantId, id: 'tester', roles: [FormServiceRoles.Admin], isCore: true },
        params: { name: 'weekdays' },
        body: { entries: [] },
        tenant: { id: tenantId },
      };
      const handler = updateRegister(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, { send: jest.fn() } as unknown as Response, jest.fn());
      const { validateStatus } = axiosMock.get.mock.calls[0][1] as { validateStatus: (s: number) => boolean };
      expect(validateStatus(HttpStatusCodes.OK)).toBe(true);
      expect(validateStatus(HttpStatusCodes.NOT_FOUND)).toBe(true);
      expect(validateStatus(500)).toBe(false);
    });
  });

  describe('findDataRegisters', () => {
    it('can create handler', () => {
      const handler = findDataRegisters(directoryMock, tokenProviderMock);
      expect(handler).toBeTruthy();
    });

    it('can get all registers', async () => {
      axiosMock.get
        .mockResolvedValueOnce({
          data: {
            configuration: { 'data-register:weekdays': weekdaysDefinition },
          },
        })
        .mockResolvedValueOnce({
          data: {
            results: [
              {
                name: 'weekdays',
                namespace: 'data-register',
                latest: { configuration: ['Monday', 'Tuesday'] },
              },
            ],
          },
        });

      const req = {
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = findDataRegisters(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith([
        {
          name: 'weekdays',
          namespace: 'data-register',
          description: 'Days of the week',
          entries: ['Monday', 'Tuesday'],
        },
      ]);
      expect(next).not.toHaveBeenCalled();
    });

    it('can return empty array when no registers exist', async () => {
      axiosMock.get
        .mockResolvedValueOnce({ data: { configuration: {} } })
        .mockResolvedValueOnce({ data: { results: [] } });

      const req = {
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = findDataRegisters(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith([]);
      expect(next).not.toHaveBeenCalled();
    });

    it('can return empty array when results field is absent from response', async () => {
      axiosMock.get.mockResolvedValueOnce({ data: { configuration: {} } }).mockResolvedValueOnce({ data: {} }); // no results key — exercises ?. ?? [] fallback

      const req = { tenant: { id: tenantId } };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = findDataRegisters(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith([]);
      expect(next).not.toHaveBeenCalled();
    });

    it('can default description to empty string when no platform config definition exists', async () => {
      axiosMock.get.mockResolvedValueOnce({ data: { configuration: {} } }).mockResolvedValueOnce({
        data: {
          results: [
            {
              name: 'weekdays',
              namespace: 'data-register',
              latest: { configuration: ['Monday'] },
            },
          ],
        },
      });

      const req = { tenant: { id: tenantId } };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = findDataRegisters(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith([expect.objectContaining({ description: '', name: 'weekdays' })]);
    });

    it('can default entries to empty array when latest configuration is absent', async () => {
      axiosMock.get
        .mockResolvedValueOnce({
          data: { configuration: { 'data-register:weekdays': weekdaysDefinition } },
        })
        .mockResolvedValueOnce({
          data: {
            results: [{ name: 'weekdays', namespace: 'data-register', latest: {} }],
          },
        });

      const req = { tenant: { id: tenantId } };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = findDataRegisters(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith([expect.objectContaining({ entries: [] })]);
    });

    it('can call next with error on failure', async () => {
      axiosMock.get.mockRejectedValueOnce(new Error('network error'));

      const req = {
        tenant: { id: tenantId },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = findDataRegisters(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('accepts OK and NOT_FOUND on data-register endpoint validateStatus', async () => {
      axiosMock.get
        .mockResolvedValueOnce({ data: { configuration: {} } })
        .mockResolvedValueOnce({ data: { results: [] } });
      const req = { tenant: { id: tenantId } };
      const handler = findDataRegisters(directoryMock, tokenProviderMock);
      await handler(req as unknown as Request, { send: jest.fn() } as unknown as Response, jest.fn());
      // validateStatus is on the second GET call (the data-register namespace listing)
      const { validateStatus } = axiosMock.get.mock.calls[1][1] as { validateStatus: (s: number) => boolean };
      expect(validateStatus(HttpStatusCodes.OK)).toBe(true);
      expect(validateStatus(HttpStatusCodes.NOT_FOUND)).toBe(true);
      expect(validateStatus(500)).toBe(false);
    });
  });
});
