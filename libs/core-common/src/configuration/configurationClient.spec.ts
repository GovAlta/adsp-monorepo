import { adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { ConfigurationClient } from './configurationClient';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

interface TestEntry {
  name: string;
  description: string;
}

describe('ConfigurationClient', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('https://configuration/configuration/'))),
    getResourceUrl: jest.fn(),
  };
  const tokenProviderMock = { getAccessToken: jest.fn(() => Promise.resolve('token')) };
  const configurationUrl = 'https://configuration/configuration/v2/configuration/platform/test-service';
  const headers = { Authorization: 'Bearer token' };
  const entry: TestEntry = { name: 'test', description: 'Test entry' };

  let client: ConfigurationClient<Record<string, TestEntry>>;

  beforeEach(() => {
    axiosMock.get.mockReset();
    axiosMock.patch.mockReset();
    client = new ConfigurationClient(directoryMock, tokenProviderMock, 'platform', 'test-service');
  });

  it('can get tenant configuration', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { test: entry } });

    const result = await client.getTenantConfiguration(tenantId);

    expect(result).toEqual({ test: entry });
    expect(axiosMock.get).toHaveBeenCalledWith(`${configurationUrl}/latest`, {
      headers,
      params: { tenantId: tenantId.toString() },
    });
  });

  it('can get core configuration', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: null });

    const result = await client.getCoreConfiguration();

    expect(result).toEqual({});
    expect(axiosMock.get).toHaveBeenCalledWith(`${configurationUrl}/latest`, { headers, params: { core: '' } });
  });

  it('can get configuration for a different namespace and name', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { test: entry } });
    const other = new ConfigurationClient(directoryMock, tokenProviderMock, 'form-service', 'test-form');

    await other.getCoreConfiguration();

    expect(axiosMock.get).toHaveBeenCalledWith(
      'https://configuration/configuration/v2/configuration/form-service/test-form/latest',
      { headers, params: { core: '' } },
    );
  });

  it('can update entry', async () => {
    axiosMock.patch.mockResolvedValueOnce({ data: { latest: { configuration: { test: entry } } } });

    const result = await client.updateEntry(tenantId, 'test', entry);

    expect(result).toEqual({ test: entry });
    expect(axiosMock.patch).toHaveBeenCalledWith(
      configurationUrl,
      { operation: 'UPDATE', update: { test: entry } },
      { headers, params: { tenantId: tenantId.toString() } },
    );
  });

  it('can delete entry', async () => {
    axiosMock.patch.mockResolvedValueOnce({ data: {} });

    const result = await client.deleteEntry(tenantId, 'test');

    expect(result).toEqual({});
    expect(axiosMock.patch).toHaveBeenCalledWith(
      configurationUrl,
      { operation: 'DELETE', property: 'test' },
      { headers, params: { tenantId: tenantId.toString() } },
    );
  });
});
