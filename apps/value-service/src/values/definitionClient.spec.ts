import { adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { DefinitionConfigurationClient } from './definitionClient';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('DefinitionConfigurationClient', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const directoryMock = {
    getServiceUrl: jest.fn(() => Promise.resolve(new URL('https://configuration/configuration/'))),
    getResourceUrl: jest.fn(),
  };
  const tokenProviderMock = { getAccessToken: jest.fn(() => Promise.resolve('token')) };
  const configurationUrl = 'https://configuration/configuration/v2/configuration/platform/value-service';
  const headers = { Authorization: 'Bearer token' };
  const namespace = { name: 'test', description: null, definitions: {} };

  let client: DefinitionConfigurationClient;

  beforeEach(() => {
    axiosMock.get.mockReset();
    axiosMock.patch.mockReset();
    client = new DefinitionConfigurationClient(directoryMock, tokenProviderMock);
  });

  it('can get tenant configuration', async () => {
    axiosMock.get.mockResolvedValueOnce({ data: { test: namespace } });

    const result = await client.getTenantConfiguration(tenantId);

    expect(result).toEqual({ test: namespace });
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

  it('can update namespace', async () => {
    axiosMock.patch.mockResolvedValueOnce({ data: { latest: { configuration: { test: namespace } } } });

    const result = await client.updateNamespace(tenantId, namespace);

    expect(result).toEqual({ test: namespace });
    expect(axiosMock.patch).toHaveBeenCalledWith(
      configurationUrl,
      { operation: 'UPDATE', update: { test: namespace } },
      { headers, params: { tenantId: tenantId.toString() } },
    );
  });

  it('can delete namespace', async () => {
    axiosMock.patch.mockResolvedValueOnce({ data: {} });

    const result = await client.deleteNamespace(tenantId, 'test');

    expect(result).toEqual({});
    expect(axiosMock.patch).toHaveBeenCalledWith(
      configurationUrl,
      { operation: 'DELETE', property: 'test' },
      { headers, params: { tenantId: tenantId.toString() } },
    );
  });
});
