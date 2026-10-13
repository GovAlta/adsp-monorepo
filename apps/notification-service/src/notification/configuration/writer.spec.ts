import { adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import axios from 'axios';
import { NotificationConfigurationWriter } from './writer';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('NotificationConfigurationWriter', () => {
  const serviceId = adspId`urn:ads:platform:notification-service`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('https://configuration-service/configuration/v2'))),
    getResourceUrl: jest.fn(),
  };
  const tokenProviderMock = { getAccessToken: jest.fn(() => Promise.resolve('token')) };
  const configurationServiceMock = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
    getConfigurationRevision: jest.fn(),
    getServiceConfigurationRevision: jest.fn(),
    clearCached: jest.fn(),
  };

  const writer = new NotificationConfigurationWriter(
    serviceId,
    directoryMock,
    tokenProviderMock,
    configurationServiceMock as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    axiosMock.isAxiosError.mockImplementation((err) => !!err?.isAxiosError);
  });

  it('updates keys of the tenant configuration and clears the cached configuration', async () => {
    axiosMock.patch.mockResolvedValueOnce({ data: {} });

    await writer.update(tenantId, { test: { id: 'test' } });

    expect(axiosMock.patch).toHaveBeenCalledWith(
      'https://configuration-service/configuration/v2/configuration/platform/notification-service',
      { operation: 'UPDATE', update: { test: { id: 'test' } } },
      { headers: { Authorization: 'Bearer token' }, params: { tenantId: tenantId.toString() } },
    );
    expect(configurationServiceMock.clearCached).toHaveBeenCalledWith(tenantId, 'platform', 'notification-service');
  });

  it('deletes a key of the tenant configuration', async () => {
    axiosMock.patch.mockResolvedValueOnce({ data: {} });

    await writer.delete(tenantId, 'test');

    expect(axiosMock.patch).toHaveBeenCalledWith(
      expect.any(String),
      { operation: 'DELETE', property: 'test' },
      expect.any(Object),
    );
    expect(configurationServiceMock.clearCached).toHaveBeenCalled();
  });

  it('throws invalid operation when the configuration service rejects the change', async () => {
    axiosMock.patch.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 400, data: { errorMessage: 'Configuration is not valid.' } },
    });

    await expect(writer.update(tenantId, {})).rejects.toThrow(new InvalidOperationError('Configuration is not valid.'));
    expect(configurationServiceMock.clearCached).not.toHaveBeenCalled();
  });

  it('throws invalid operation with a default message when the rejection has none', async () => {
    axiosMock.patch.mockRejectedValueOnce({ isAxiosError: true, response: { status: 400 } });

    await expect(writer.update(tenantId, {})).rejects.toThrow('Configuration service rejected the change.');
  });

  it('rethrows other errors', async () => {
    const error = { isAxiosError: true, response: { status: 500 } };
    axiosMock.patch.mockRejectedValueOnce(error);

    await expect(writer.delete(tenantId, 'test')).rejects.toBe(error);
  });
});
