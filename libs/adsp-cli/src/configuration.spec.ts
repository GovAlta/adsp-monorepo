import { getConfiguration } from './configuration';
import { HttpRequestError } from './httpError';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getConfiguration', () => {
  it('GETs the latest configuration with a bearer token', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ 'urn:ads:platform:event-service': { roles: [] } }),
    });
    global.fetch = fetchMock as never;

    const result = await getConfiguration('token-abc', 'https://configuration-service.example.com', 'platform', 'tenant-service');

    expect(result).toEqual({ 'urn:ads:platform:event-service': { roles: [] } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://configuration-service.example.com/configuration/v2/configuration/platform/tenant-service/latest');
    expect(init.headers.Authorization).toBe('Bearer token-abc');
  });

  it('throws an HttpRequestError carrying the status on a non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 }) as never;

    await expect(
      getConfiguration('token-abc', 'https://configuration-service.example.com', 'platform', 'tenant-service')
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      getConfiguration('token-abc', 'https://configuration-service.example.com', 'platform', 'tenant-service')
    ).rejects.toBeInstanceOf(HttpRequestError);
  });
});
