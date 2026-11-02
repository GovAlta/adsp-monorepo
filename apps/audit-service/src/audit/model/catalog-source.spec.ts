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

  describe('saveAction', () => {
    const definition = { version: 1, category: 'runtime', severity: 'info', retentionClass: 'standard' } as never;

    it('updates the catalog of the resolved tenant', async () => {
      axiosMock.patch.mockResolvedValue({ data: {} });

      await source.saveAction('case-service', 'case.create', definition, 'token', tenantId);

      const [url, body] = axiosMock.patch.mock.calls[0];
      expect(new URL(url).searchParams.get('tenantId')).toBe(tenantId.toString());
      expect(url).toContain('v2/configuration/audit-service/actions-case-service');
      expect(body).toMatchObject({ operation: 'UPDATE', update: { actions: { 'case.create': definition } } });
    });

    it.each([401, 403])('maps a %s from configuration to an unauthorized error', async (status) => {
      axiosMock.patch.mockRejectedValue({ response: { status } });
      axiosMock.isAxiosError.mockReturnValue(true);

      await expect(
        source.saveAction('case-service', 'case.create', definition, 'token', tenantId),
      ).rejects.toMatchObject({ extra: { statusCode: 401 } });
    });
  });
});
