import { AdspId, adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { CredentialNotSetError } from '../errors';
import { SharePointConnection } from '../types';
import { GraphTokenProvider } from './token';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('GraphTokenProvider', () => {
  const authorityUrl = 'https://login.example';
  const tenantA = adspId`urn:ads:platform:tenant-service:v2:/tenants/a`;
  const tenantB = adspId`urn:ads:platform:tenant-service:v2:/tenants/b`;
  const connection: SharePointConnection = {
    id: 'hr-site',
    name: 'HR site',
    entraTenantId: 'entra-tenant',
    clientId: 'client-1',
    siteId: 'contoso.sharepoint.com,site,web',
  };
  const tokenResponse = (accessToken: string) => ({ data: { access_token: accessToken, expires_in: 3600 } });

  beforeEach(() => {
    axiosMock.post.mockReset();
    axiosMock.isAxiosError.mockReset();
  });

  it('requests a client credentials token for the connection from its Entra tenant', async () => {
    axiosMock.post.mockResolvedValueOnce(tokenResponse('token-1'));
    const provider = new GraphTokenProvider(authorityUrl, { getSecret: async () => 'secret-1' });

    expect(await provider.getToken(tenantA, connection)).toBe('token-1');

    const [url, body, config] = axiosMock.post.mock.calls[0];
    expect(url).toBe('https://login.example/entra-tenant/oauth2/v2.0/token');
    expect(Object.fromEntries(new URLSearchParams(body as string))).toEqual({
      grant_type: 'client_credentials',
      client_id: 'client-1',
      client_secret: 'secret-1',
      scope: 'https://graph.microsoft.com/.default',
    });
    expect(config).toEqual({ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  });

  it('caches the token for a tenant and connection', async () => {
    axiosMock.post.mockResolvedValueOnce(tokenResponse('token-1'));
    const secrets = { getSecret: jest.fn().mockResolvedValue('secret-1') };
    const provider = new GraphTokenProvider(authorityUrl, secrets);

    await provider.getToken(tenantA, connection);
    expect(await provider.getToken(tenantA, connection)).toBe('token-1');
    expect(axiosMock.post).toHaveBeenCalledTimes(1);
    expect(secrets.getSecret).toHaveBeenCalledTimes(1);
  });

  it('does not share cached tokens across tenants', async () => {
    axiosMock.post.mockResolvedValueOnce(tokenResponse('token-a'));
    const secrets = {
      getSecret: jest.fn(async (tenantId: AdspId) => (tenantId.toString() === tenantA.toString() ? 'secret-a' : null)),
    };
    const provider = new GraphTokenProvider(authorityUrl, secrets);

    await provider.getToken(tenantA, connection);
    await expect(provider.getToken(tenantB, connection)).rejects.toBeInstanceOf(CredentialNotSetError);
    expect(axiosMock.post).toHaveBeenCalledTimes(1);
  });

  it('fetches a new token after eviction', async () => {
    axiosMock.post.mockResolvedValueOnce(tokenResponse('token-1')).mockResolvedValueOnce(tokenResponse('token-2'));
    const provider = new GraphTokenProvider(authorityUrl, { getSecret: async () => 'secret-1' });

    await provider.getToken(tenantA, connection);
    provider.evict(tenantA, connection.id);
    expect(await provider.getToken(tenantA, connection)).toBe('token-2');
  });

  it('refreshes the token once it is near expiry', async () => {
    axiosMock.post.mockResolvedValueOnce(tokenResponse('token-1')).mockResolvedValueOnce(tokenResponse('token-2'));
    let now = Date.now();
    const provider = new GraphTokenProvider(authorityUrl, { getSecret: async () => 'secret-1' }, () => now);

    await provider.getToken(tenantA, connection);
    now += 3540 * 1000;
    expect(await provider.getToken(tenantA, connection)).toBe('token-2');
  });

  it('maps a rejected secret to a non-retryable Entra error', async () => {
    axiosMock.isAxiosError.mockReturnValue(true);
    axiosMock.post.mockRejectedValueOnce({
      response: { status: 401, data: { error: 'invalid_client', error_codes: [7000215] } },
    });
    const provider = new GraphTokenProvider(authorityUrl, { getSecret: async () => 'wrong' });

    await expect(provider.getToken(tenantA, connection)).rejects.toMatchObject({
      errorCode: 'entra:AADSTS7000215',
      retryable: false,
    });
  });
});
