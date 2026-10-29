import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { ConfigurationCatalogSource } from './catalog-source';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('ConfigurationCatalogSource', () => {
  const directory: jest.Mocked<ServiceDirectory> = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };
  const tokenProvider: jest.Mocked<TokenProvider> = { getAccessToken: jest.fn() };
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/case-team`;
  const source = new ConfigurationCatalogSource(directory, tokenProvider);

  beforeEach(() => {
    jest.resetAllMocks();
    directory.getServiceUrl.mockResolvedValue(new URL('https://configuration-service/'));
    tokenProvider.getAccessToken.mockResolvedValue('token');
  });

  it('lists application names of actions-* entries across pages', async () => {
    axiosMock.get
      .mockResolvedValueOnce({
        data: { results: [{ name: 'actions-case-service' }, { name: 'retention' }], page: { next: 'n1' } },
      })
      .mockResolvedValueOnce({ data: { results: [{ name: 'actions-file-service' }], page: {} } });

    expect(await source.listApplications()).toEqual(['case-service', 'file-service']);

    expect(axiosMock.get).toHaveBeenNthCalledWith(
      1,
      'https://configuration-service/v2/configuration/audit-service',
      expect.objectContaining({
        headers: { Authorization: 'Bearer token' },
        params: { top: 50, after: undefined, tenantId: undefined },
      }),
    );
    expect(axiosMock.get).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.objectContaining({ params: { top: 50, after: 'n1', tenantId: undefined } }),
    );
  });

  it('lists within the tenant context and skips entries that are not valid application catalogs', async () => {
    axiosMock.get.mockResolvedValue({
      data: { results: [{ name: 'actions-Bad_Name' }, { name: 'retention-case-service' }, { name: 'actions-ok' }] },
    });

    expect(await source.listApplications(tenantId)).toEqual(['ok']);
    expect(axiosMock.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ params: expect.objectContaining({ tenantId: tenantId.toString() }) }),
    );
  });
});
