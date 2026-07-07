class MockHttpRequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

class MockServiceNotInDirectoryError extends Error {
  constructor(urn: string) {
    super(`${urn} was not found in the directory for the configured environment.`);
  }
}

jest.mock('@abgov/adsp-cli', () => ({
  getAccessToken: jest.fn(),
  getDirectoryServiceUrl: jest.fn(),
  getServiceRoles: jest.fn(),
  HttpRequestError: MockHttpRequestError,
  ServiceNotInDirectoryError: MockServiceNotInDirectoryError,
}));

import { getAccessToken, getDirectoryServiceUrl, getServiceRoles, ServiceNotInDirectoryError } from '@abgov/adsp-cli';
import { createServiceRolesTools } from './registerServiceRolesTool';

const mockGetAccessToken = getAccessToken as jest.Mock;
const mockGetDirectoryServiceUrl = getDirectoryServiceUrl as jest.Mock;
const mockGetServiceRoles = getServiceRoles as jest.Mock;

const [listServiceRolesTool] = createServiceRolesTools();

function getText(result: Awaited<ReturnType<typeof listServiceRolesTool.handler>>): string {
  return (result.content[0] as { type: 'text'; text: string }).text;
}

afterEach(() => {
  jest.resetAllMocks();
});

describe('list_service_roles', () => {
  it('has the correct name and a zero-property input schema', () => {
    expect(listServiceRolesTool.name).toBe('list_service_roles');
    expect(listServiceRolesTool.inputSchema).toEqual({ type: 'object', properties: {} });
  });

  it('returns an actionable message when not authenticated', async () => {
    mockGetAccessToken.mockResolvedValue({ status: 'not-authenticated' });

    const result = await listServiceRolesTool.handler({});

    expect(result.isError).toBe(true);
    expect(getText(result)).toContain('npx @abgov/adsp-cli login');
    expect(mockGetServiceRoles).not.toHaveBeenCalled();
  });

  it('returns the flattened role list on the happy path', async () => {
    mockGetAccessToken.mockResolvedValue({ status: 'ok', token: 'token-abc' });
    mockGetDirectoryServiceUrl.mockReturnValue('https://directory-service.example.com');
    mockGetServiceRoles.mockResolvedValue([
      { serviceId: 'urn:ads:platform:event-service', serviceName: 'event-service', role: 'event-sender', description: 'Sender role.' },
    ]);

    const result = await listServiceRolesTool.handler({});

    expect(result.isError).toBeUndefined();
    expect(JSON.parse(getText(result))).toEqual([
      { serviceId: 'urn:ads:platform:event-service', serviceName: 'event-service', role: 'event-sender', description: 'Sender role.' },
    ]);
    expect(mockGetServiceRoles).toHaveBeenCalledWith('token-abc', 'https://directory-service.example.com');
  });

  it('distinguishes a 401 as a stale/invalid token', async () => {
    mockGetAccessToken.mockResolvedValue({ status: 'ok', token: 'token-abc' });
    mockGetDirectoryServiceUrl.mockReturnValue('https://directory-service.example.com');
    mockGetServiceRoles.mockRejectedValue(new MockHttpRequestError(401, 'unauthorized'));

    const result = await listServiceRolesTool.handler({});

    expect(result.isError).toBe(true);
    expect(getText(result)).toContain('npx @abgov/adsp-cli login');
    expect(getText(result)).toContain('401');
  });

  it('distinguishes a 403 as likely wrong realm/environment', async () => {
    mockGetAccessToken.mockResolvedValue({ status: 'ok', token: 'token-abc' });
    mockGetDirectoryServiceUrl.mockReturnValue('https://directory-service.example.com');
    mockGetServiceRoles.mockRejectedValue(new MockHttpRequestError(403, 'forbidden'));

    const result = await listServiceRolesTool.handler({});

    expect(result.isError).toBe(true);
    expect(getText(result)).toContain('wrong tenant realm');
  });

  it('distinguishes a 5xx as a platform outage', async () => {
    mockGetAccessToken.mockResolvedValue({ status: 'ok', token: 'token-abc' });
    mockGetDirectoryServiceUrl.mockReturnValue('https://directory-service.example.com');
    mockGetServiceRoles.mockRejectedValue(new MockHttpRequestError(503, 'unavailable'));

    const result = await listServiceRolesTool.handler({});

    expect(result.isError).toBe(true);
    expect(getText(result)).toContain('outage');
  });

  it('distinguishes a missing directory entry from a network error', async () => {
    mockGetAccessToken.mockResolvedValue({ status: 'ok', token: 'token-abc' });
    mockGetDirectoryServiceUrl.mockReturnValue('https://directory-service.example.com');
    mockGetServiceRoles.mockRejectedValue(new ServiceNotInDirectoryError('urn:ads:platform:configuration-service:v2'));

    const result = await listServiceRolesTool.handler({});

    expect(result.isError).toBe(true);
    expect(getText(result)).toContain('was not found in the directory');
  });

  it('distinguishes a DNS/connection failure', async () => {
    mockGetAccessToken.mockResolvedValue({ status: 'ok', token: 'token-abc' });
    mockGetDirectoryServiceUrl.mockReturnValue('https://directory-service.example.com');
    mockGetServiceRoles.mockRejectedValue(new TypeError('fetch failed'));

    const result = await listServiceRolesTool.handler({});

    expect(result.isError).toBe(true);
    expect(getText(result)).toContain('Could not reach the ADSP platform');
  });
});
