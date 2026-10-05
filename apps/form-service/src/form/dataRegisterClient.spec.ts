import { adspId } from '@abgov/adsp-service-sdk';
import { ConfigurationClient, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import axios from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import { DataRegisterClient, REGISTER_SCHEMA } from './dataRegisterClient';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

jest.mock('@core-services/core-common', () => ({
  ...jest.requireActual('@core-services/core-common'),
  ConfigurationClient: jest.fn(),
}));
const ConfigurationClientMock = ConfigurationClient as jest.Mock;

describe('DataRegisterClient', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const configurationServiceUrl = new URL('https://configuration-service');

  const directoryMock = { getServiceUrl: jest.fn(), getResourceUrl: jest.fn() };
  const tokenProviderMock = { getAccessToken: jest.fn() };

  const definitionsClientMock = {
    getTenantConfiguration: jest.fn(),
    getCoreConfiguration: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
  };

  const weekdaysDefinition = { configurationSchema: REGISTER_SCHEMA, description: 'Days of the week' };

  let client: DataRegisterClient;

  beforeEach(() => {
    jest.clearAllMocks();
    directoryMock.getServiceUrl.mockResolvedValue(configurationServiceUrl);
    tokenProviderMock.getAccessToken.mockResolvedValue('token');
    ConfigurationClientMock.mockImplementation(() => definitionsClientMock);
    definitionsClientMock.getTenantConfiguration.mockResolvedValue({});

    client = new DataRegisterClient(directoryMock as never, tokenProviderMock as never);
  });

  it('constructs its definitions client against the shared platform/configuration-service document', () => {
    expect(ConfigurationClientMock).toHaveBeenCalledWith(
      directoryMock,
      tokenProviderMock,
      'platform',
      'configuration-service',
    );
  });

  describe('find', () => {
    it('returns registers that have both a definition and a data document', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({
        'data-register:weekdays': weekdaysDefinition,
      });
      axiosMock.get.mockResolvedValueOnce({
        data: {
          results: [
            { name: 'weekdays', namespace: 'data-register', latest: { revision: 1, configuration: ['Monday'] } },
          ],
          page: {},
        },
      });

      const registers = await client.find(tenantId);

      expect(registers).toEqual([
        { namespace: 'data-register', name: 'weekdays', description: 'Days of the week', entries: ['Monday'] },
      ]);
    });

    it('excludes a data document with no matching definition', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({});
      axiosMock.get.mockResolvedValueOnce({
        data: {
          results: [{ name: 'orphan', namespace: 'data-register', latest: { revision: 1, configuration: [] } }],
          page: {},
        },
      });

      const registers = await client.find(tenantId);

      expect(registers).toEqual([]);
    });

    it('excludes a definition with no matching data document', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({
        'data-register:orphan': weekdaysDefinition,
      });
      axiosMock.get.mockResolvedValueOnce({ data: { results: [], page: {} } });

      const registers = await client.find(tenantId);

      expect(registers).toEqual([]);
    });

    it('prefers the active revision over the latest revision', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({
        'data-register:weekdays': weekdaysDefinition,
      });
      axiosMock.get.mockResolvedValueOnce({
        data: {
          results: [
            {
              name: 'weekdays',
              namespace: 'data-register',
              latest: { revision: 2, configuration: ['Monday', 'Tuesday'] },
              active: { revision: 1, configuration: ['Monday'] },
            },
          ],
          page: {},
        },
      });

      const registers = await client.find(tenantId);

      expect(registers[0].entries).toEqual(['Monday']);
    });

    it('follows page.next to list more than a page of data documents', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({
        'data-register:first': weekdaysDefinition,
        'data-register:second': weekdaysDefinition,
      });
      axiosMock.get
        .mockResolvedValueOnce({
          data: {
            results: [{ name: 'first', namespace: 'data-register', latest: { revision: 1, configuration: ['A'] } }],
            page: { next: 'page-2' },
          },
        })
        .mockResolvedValueOnce({
          data: {
            results: [{ name: 'second', namespace: 'data-register', latest: { revision: 1, configuration: ['B'] } }],
            page: {},
          },
        });

      const registers = await client.find(tenantId);

      expect(registers.map((register) => register.name)).toEqual(['first', 'second']);
      expect(axiosMock.get).toHaveBeenCalledTimes(2);
      expect(axiosMock.get.mock.calls[1][1]).toEqual(
        expect.objectContaining({ params: expect.objectContaining({ after: 'page-2' }) }),
      );
    });

    it('excludes a definition whose configuration schema is not an array', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({
        'data-register:not-a-register': { configurationSchema: { type: 'object' }, description: '' },
      });
      axiosMock.get.mockResolvedValueOnce({
        data: {
          results: [{ name: 'not-a-register', namespace: 'data-register', latest: { revision: 1, configuration: [] } }],
          page: {},
        },
      });

      const registers = await client.find(tenantId);

      expect(registers).toEqual([]);
    });
  });

  describe('get', () => {
    it('returns the entries of the pinned active revision rather than the latest', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({
        'data-register:weekdays': weekdaysDefinition,
      });
      axiosMock.get.mockResolvedValueOnce({
        data: { latest: { revision: 3, configuration: ['Draft'] }, active: { revision: 1, configuration: ['Monday'] } },
      });

      const register = await client.get(tenantId, 'weekdays');

      expect(register.entries).toEqual(['Monday']);
    });

    it('returns the register when both the definition and the data document exist', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({
        'data-register:weekdays': weekdaysDefinition,
      });
      axiosMock.get.mockResolvedValueOnce({ data: { latest: { revision: 1, configuration: ['Monday', 'Tuesday'] } } });

      const register = await client.get(tenantId, 'weekdays');

      expect(register).toEqual({
        namespace: 'data-register',
        name: 'weekdays',
        description: 'Days of the week',
        entries: ['Monday', 'Tuesday'],
      });
    });

    it('throws not found when the data document comes back with an empty body', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({
        'data-register:weekdays': weekdaysDefinition,
      });
      axiosMock.get.mockResolvedValueOnce({ data: '' });

      await expect(client.get(tenantId, 'weekdays')).rejects.toThrow(NotFoundError);
    });

    it('throws not found when the definition does not exist', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({});
      axiosMock.get.mockResolvedValueOnce({ data: { latest: { revision: 1, configuration: [] } } });

      await expect(client.get(tenantId, 'weekdays')).rejects.toThrow(NotFoundError);
    });

    it('calls configuration-service with the tenant id', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({
        'data-register:weekdays': weekdaysDefinition,
      });
      axiosMock.get.mockResolvedValueOnce({ data: { latest: { revision: 1, configuration: [] } } });

      await client.get(tenantId, 'weekdays');

      expect(axiosMock.get).toHaveBeenCalledWith(
        expect.stringMatching(/\/data-register\/weekdays$/),
        expect.objectContaining({ params: { tenantId: tenantId.toString() } }),
      );
    });
  });

  describe('create', () => {
    beforeEach(() => {
      axiosMock.get.mockResolvedValue({ data: '' });
      axiosMock.patch.mockResolvedValue({ data: { latest: { revision: 1, configuration: ['one', 'two'] } } });
    });

    it('writes the definition before the data', async () => {
      await client.create(tenantId, { name: 'test-register', description: 'Test register', entries: ['one', 'two'] });

      expect(definitionsClientMock.updateEntry.mock.invocationCallOrder[0]).toBeLessThan(
        axiosMock.patch.mock.invocationCallOrder[0],
      );
      expect(definitionsClientMock.updateEntry).toHaveBeenCalledWith(tenantId, 'data-register:test-register', {
        configurationSchema: REGISTER_SCHEMA,
        description: 'Test register',
      });
      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.stringContaining('/data-register/test-register'),
        { operation: 'REPLACE', configuration: ['one', 'two'] },
        expect.objectContaining({ params: { tenantId: tenantId.toString() } }),
      );
    });

    it('moves the pin of a leftover data document to the entries just written', async () => {
      axiosMock.get.mockResolvedValue({
        data: { latest: { revision: 2, configuration: ['old'] }, active: { revision: 0, configuration: ['older'] } },
      });
      axiosMock.patch.mockResolvedValue({ data: { latest: { revision: 2, configuration: ['one', 'two'] } } });

      await client.create(tenantId, { name: 'test-register', entries: ['one', 'two'] });

      expect(axiosMock.post).toHaveBeenCalledWith(
        expect.stringMatching(/\/data-register\/test-register$/),
        { operation: 'SET-ACTIVE-REVISION', revision: 2 },
        expect.any(Object),
      );
    });

    it('defaults entries to an empty array', async () => {
      await client.create(tenantId, { name: 'empty-register' });

      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.any(String),
        { operation: 'REPLACE', configuration: [] },
        expect.any(Object),
      );
    });

    it('returns the created register', async () => {
      const register = await client.create(tenantId, {
        name: 'test-register',
        description: 'Test',
        entries: ['one', 'two'],
      });

      expect(register).toEqual({
        namespace: 'data-register',
        name: 'test-register',
        description: 'Test',
        entries: ['one', 'two'],
      });
    });

    it('rejects with conflict when both the definition and the data already exist', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({
        'data-register:weekdays': weekdaysDefinition,
      });
      axiosMock.get.mockResolvedValue({ data: { latest: { revision: 1, configuration: ['Monday'] } } });

      await expect(client.create(tenantId, { name: 'weekdays' })).rejects.toThrow(InvalidOperationError);
      expect(definitionsClientMock.updateEntry).not.toHaveBeenCalled();
    });

    it('completes creation when only the definition is left over from a partial failure', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({
        'data-register:weekdays': weekdaysDefinition,
      });
      axiosMock.get.mockResolvedValue({ data: '' });

      await client.create(tenantId, { name: 'weekdays', entries: ['Monday'] });

      expect(axiosMock.patch).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    beforeEach(() => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({
        'data-register:weekdays': { ...weekdaysDefinition, anonymousRead: true },
      });
      axiosMock.get.mockResolvedValue({ data: { latest: { revision: 1, configuration: ['Monday'] } } });
    });

    it('throws not found when the register does not exist', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({});
      axiosMock.get.mockResolvedValue({ data: '' });

      await expect(client.update(tenantId, 'missing', { entries: ['Monday'] })).rejects.toThrow(NotFoundError);
    });

    it('does not touch the data document when only the description is sent', async () => {
      await client.update(tenantId, 'weekdays', { description: 'Updated description' });

      expect(axiosMock.patch).not.toHaveBeenCalled();
      expect(definitionsClientMock.updateEntry).toHaveBeenCalledWith(
        tenantId,
        'data-register:weekdays',
        expect.objectContaining({ description: 'Updated description' }),
      );
    });

    it('does not touch the definition when only entries are sent', async () => {
      axiosMock.patch.mockResolvedValue({ data: { latest: { revision: 2, configuration: ['Monday', 'Tuesday'] } } });

      await client.update(tenantId, 'weekdays', { entries: ['Monday', 'Tuesday'] });

      expect(definitionsClientMock.updateEntry).not.toHaveBeenCalled();
      expect(axiosMock.patch).toHaveBeenCalledWith(
        expect.stringContaining('/data-register/weekdays'),
        { operation: 'REPLACE', configuration: ['Monday', 'Tuesday'] },
        expect.any(Object),
      );
    });

    it('preserves anonymousRead when only the description changes', async () => {
      await client.update(tenantId, 'weekdays', { description: 'Updated' });

      expect(definitionsClientMock.updateEntry).toHaveBeenCalledWith(
        tenantId,
        'data-register:weekdays',
        expect.objectContaining({ anonymousRead: true }),
      );
    });

    it('returns the existing entries when entries are not sent', async () => {
      const register = await client.update(tenantId, 'weekdays', { description: 'Updated' });

      expect(register.entries).toEqual(['Monday']);
    });

    it('writes the entries before the description', async () => {
      const writes: string[] = [];
      axiosMock.patch.mockImplementationOnce(async () => {
        writes.push('entries');
        return { data: { latest: { revision: 2, configuration: ['Tuesday'] } } };
      });
      definitionsClientMock.updateEntry.mockImplementationOnce(async () => {
        writes.push('description');
        return {};
      });

      await client.update(tenantId, 'weekdays', { description: 'Updated', entries: ['Tuesday'] });

      expect(writes).toEqual(['entries', 'description']);
    });

    describe('when an older revision is pinned as active', () => {
      beforeEach(() => {
        axiosMock.get.mockResolvedValue({
          data: {
            latest: { revision: 3, configuration: ['Draft'] },
            active: { revision: 1, configuration: ['Monday'] },
          },
        });
        axiosMock.patch.mockResolvedValue({ data: { latest: { revision: 3, configuration: ['Tuesday'] } } });
      });

      it('moves the pin to the revision the entries were written to', async () => {
        await client.update(tenantId, 'weekdays', { entries: ['Tuesday'] });

        expect(axiosMock.post).toHaveBeenCalledWith(
          expect.stringMatching(/\/data-register\/weekdays$/),
          { operation: 'SET-ACTIVE-REVISION', revision: 3 },
          expect.objectContaining({ params: { tenantId: tenantId.toString() } }),
        );
      });

      it('moves the pin only after the entries are written', async () => {
        await client.update(tenantId, 'weekdays', { entries: ['Tuesday'] });

        expect(axiosMock.patch.mock.invocationCallOrder[0]).toBeLessThan(axiosMock.post.mock.invocationCallOrder[0]);
      });

      it('leaves the pin alone when only the description is sent', async () => {
        await client.update(tenantId, 'weekdays', { description: 'Updated' });

        expect(axiosMock.post).not.toHaveBeenCalled();
      });

      it('returns the entries of the pinned revision when entries are not sent', async () => {
        const register = await client.update(tenantId, 'weekdays', { description: 'Updated' });

        expect(register.entries).toEqual(['Monday']);
      });

      it('maps a refused pin move (service account without configuration-admin) to 502', async () => {
        axiosMock.post.mockRejectedValueOnce({ response: { status: HttpStatusCodes.FORBIDDEN, data: {} } });
        axiosMock.isAxiosError.mockReturnValueOnce(true);

        await expect(client.update(tenantId, 'weekdays', { entries: ['Tuesday'] })).rejects.toThrow(
          expect.objectContaining({ extra: expect.objectContaining({ statusCode: HttpStatusCodes.BAD_GATEWAY }) }),
        );
      });
    });

    it('does not set an active revision when none is pinned', async () => {
      axiosMock.patch.mockResolvedValue({ data: { latest: { revision: 1, configuration: ['Tuesday'] } } });

      await client.update(tenantId, 'weekdays', { entries: ['Tuesday'] });

      expect(axiosMock.post).not.toHaveBeenCalled();
    });

    it('does not move a pin that is already on the latest revision', async () => {
      axiosMock.get.mockResolvedValue({
        data: { latest: { revision: 2, configuration: ['Monday'] }, active: { revision: 2, configuration: ['Monday'] } },
      });
      axiosMock.patch.mockResolvedValue({ data: { latest: { revision: 2, configuration: ['Tuesday'] } } });

      await client.update(tenantId, 'weekdays', { entries: ['Tuesday'] });

      expect(axiosMock.post).not.toHaveBeenCalled();
    });

    it('leaves the description unchanged when configuration-service rejects the entries', async () => {
      axiosMock.patch.mockRejectedValueOnce({ response: { status: HttpStatusCodes.BAD_REQUEST, data: {} } });
      axiosMock.isAxiosError.mockReturnValueOnce(true);

      await expect(
        client.update(tenantId, 'weekdays', { description: 'Updated', entries: [{ code: 'AB' }] }),
      ).rejects.toThrow(InvalidOperationError);
      expect(definitionsClientMock.updateEntry).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes both the data document and the definition when both exist', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({
        'data-register:weekdays': weekdaysDefinition,
      });
      axiosMock.get.mockResolvedValue({ data: { latest: { revision: 1, configuration: ['Monday'] } } });

      await client.delete(tenantId, 'weekdays');

      expect(axiosMock.delete).toHaveBeenCalledWith(
        expect.stringContaining('/data-register/weekdays'),
        expect.objectContaining({ params: { tenantId: tenantId.toString() } }),
      );
      expect(definitionsClientMock.deleteEntry).toHaveBeenCalledWith(tenantId, 'data-register:weekdays');
    });

    it('deletes only the data document when the definition is already gone', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({});
      axiosMock.get.mockResolvedValue({ data: { latest: { revision: 1, configuration: ['Monday'] } } });

      await client.delete(tenantId, 'weekdays');

      expect(axiosMock.delete).toHaveBeenCalled();
      expect(definitionsClientMock.deleteEntry).not.toHaveBeenCalled();
    });

    it('deletes only the definition when the data document is already gone', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({
        'data-register:weekdays': weekdaysDefinition,
      });
      axiosMock.get.mockResolvedValue({ data: '' });

      await client.delete(tenantId, 'weekdays');

      expect(axiosMock.delete).not.toHaveBeenCalled();
      expect(definitionsClientMock.deleteEntry).toHaveBeenCalledWith(tenantId, 'data-register:weekdays');
    });

    it('throws not found only when neither the definition nor the data exist', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({});
      axiosMock.get.mockResolvedValue({ data: '' });

      await expect(client.delete(tenantId, 'missing')).rejects.toThrow(NotFoundError);
      expect(axiosMock.delete).not.toHaveBeenCalled();
      expect(definitionsClientMock.deleteEntry).not.toHaveBeenCalled();
    });
  });

  describe('error mapping', () => {
    beforeEach(() => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({
        'data-register:weekdays': weekdaysDefinition,
      });
    });

    it('maps a configuration-service 403 to a 502 bad gateway error', async () => {
      const responseError = { response: { status: HttpStatusCodes.FORBIDDEN, data: {} }, message: 'Forbidden' };
      axiosMock.get.mockRejectedValue(responseError);
      axiosMock.isAxiosError.mockReturnValue(true);

      await expect(client.get(tenantId, 'weekdays')).rejects.toThrow(
        expect.objectContaining({ extra: expect.objectContaining({ statusCode: HttpStatusCodes.BAD_GATEWAY }) }),
      );
    });

    it('maps a configuration-service 400 to a 400 invalid operation error', async () => {
      const responseError = {
        response: { status: HttpStatusCodes.BAD_REQUEST, data: { errorMessage: 'Invalid request' } },
        message: 'Bad Request',
      };
      axiosMock.get.mockRejectedValue(responseError);
      axiosMock.isAxiosError.mockReturnValue(true);

      await expect(client.get(tenantId, 'weekdays')).rejects.toThrow(
        expect.objectContaining({
          message: 'Invalid request',
          extra: expect.objectContaining({ statusCode: HttpStatusCodes.BAD_REQUEST }),
        }),
      );
    });

    it('maps a configuration-service 500 to a 502 bad gateway error', async () => {
      const responseError = {
        response: { status: HttpStatusCodes.INTERNAL_SERVER_ERROR, data: {} },
        message: 'Server error',
      };
      axiosMock.get.mockRejectedValue(responseError);
      axiosMock.isAxiosError.mockReturnValue(true);

      await expect(client.get(tenantId, 'weekdays')).rejects.toThrow(
        expect.objectContaining({ extra: expect.objectContaining({ statusCode: HttpStatusCodes.BAD_GATEWAY }) }),
      );
    });

    it('propagates a NotFoundError thrown by the client unchanged', async () => {
      definitionsClientMock.getTenantConfiguration.mockResolvedValue({});
      axiosMock.get.mockResolvedValue({ data: '' });

      await expect(client.get(tenantId, 'missing')).rejects.toThrow(NotFoundError);
    });
  });
});
