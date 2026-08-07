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
  getServiceConfigurationSchemas: jest.fn(),
  HttpRequestError: MockHttpRequestError,
  ServiceNotInDirectoryError: MockServiceNotInDirectoryError,
}));

import {
  getAccessToken,
  getDirectoryServiceUrl,
  getServiceConfigurationSchemas,
  ServiceNotInDirectoryError,
} from '@abgov/adsp-cli';
import { createConfigurationSchemaTools } from './registerConfigurationSchemaTool';

const mockGetAccessToken = getAccessToken as jest.Mock;
const mockGetDirectoryServiceUrl = getDirectoryServiceUrl as jest.Mock;
const mockGetServiceConfigurationSchemas = getServiceConfigurationSchemas as jest.Mock;

const [getConfigurationSchemaTool] = createConfigurationSchemaTools();

function getText(result: Awaited<ReturnType<typeof getConfigurationSchemaTool.handler>>): string {
  return (result.content[0] as { type: 'text'; text: string }).text;
}

afterEach(() => {
  jest.resetAllMocks();
});

describe('get_service_configuration_schema', () => {
  it('has the correct name and an optional serviceId input schema', () => {
    expect(getConfigurationSchemaTool.name).toBe('get_service_configuration_schema');
    expect(getConfigurationSchemaTool.inputSchema).toEqual({
      type: 'object',
      properties: {
        serviceId: { type: 'string', description: expect.any(String) },
      },
    });
  });

  it('returns an actionable message when not authenticated', async () => {
    mockGetAccessToken.mockResolvedValue({ status: 'not-authenticated' });

    const result = await getConfigurationSchemaTool.handler({});

    expect(result.isError).toBe(true);
    expect(getText(result)).toContain('npx @abgov/adsp-cli login');
    expect(mockGetServiceConfigurationSchemas).not.toHaveBeenCalled();
  });

  it('returns all schemas when no serviceId is provided', async () => {
    mockGetAccessToken.mockResolvedValue({ status: 'ok', token: 'token-abc' });
    mockGetDirectoryServiceUrl.mockReturnValue('https://directory-service.example.com');
    mockGetServiceConfigurationSchemas.mockResolvedValue([
      { key: 'form-service', configurationSchema: { type: 'object' }, description: 'Form definitions.' },
      { key: 'task-service', configurationSchema: { type: 'object' }, description: 'Task queues.' },
    ]);

    const result = await getConfigurationSchemaTool.handler({});

    expect(result.isError).toBeUndefined();
    expect(JSON.parse(getText(result))).toHaveLength(2);
    expect(mockGetServiceConfigurationSchemas).toHaveBeenCalledWith('token-abc', 'https://directory-service.example.com', undefined);
  });

  it('passes serviceId through to the helper when provided', async () => {
    mockGetAccessToken.mockResolvedValue({ status: 'ok', token: 'token-abc' });
    mockGetDirectoryServiceUrl.mockReturnValue('https://directory-service.example.com');
    mockGetServiceConfigurationSchemas.mockResolvedValue([
      { key: 'form-service', configurationSchema: { type: 'object' } },
    ]);

    const result = await getConfigurationSchemaTool.handler({ serviceId: 'urn:ads:platform:form-service' });

    expect(result.isError).toBeUndefined();
    expect(mockGetServiceConfigurationSchemas).toHaveBeenCalledWith(
      'token-abc',
      'https://directory-service.example.com',
      'urn:ads:platform:form-service'
    );
  });

  it('distinguishes a 401 as a stale/invalid token', async () => {
    mockGetAccessToken.mockResolvedValue({ status: 'ok', token: 'token-abc' });
    mockGetDirectoryServiceUrl.mockReturnValue('https://directory-service.example.com');
    mockGetServiceConfigurationSchemas.mockRejectedValue(new MockHttpRequestError(401, 'unauthorized'));

    const result = await getConfigurationSchemaTool.handler({});

    expect(result.isError).toBe(true);
    expect(getText(result)).toContain('401');
    expect(getText(result)).toContain('npx @abgov/adsp-cli login');
  });

  it('distinguishes a missing directory entry', async () => {
    mockGetAccessToken.mockResolvedValue({ status: 'ok', token: 'token-abc' });
    mockGetDirectoryServiceUrl.mockReturnValue('https://directory-service.example.com');
    mockGetServiceConfigurationSchemas.mockRejectedValue(
      new ServiceNotInDirectoryError('urn:ads:platform:configuration-service:v2')
    );

    const result = await getConfigurationSchemaTool.handler({});

    expect(result.isError).toBe(true);
    expect(getText(result)).toContain('was not found in the directory');
  });

  it('distinguishes a 403 as likely wrong realm/environment', async () => {
    mockGetAccessToken.mockResolvedValue({ status: 'ok', token: 'token-abc' });
    mockGetDirectoryServiceUrl.mockReturnValue('https://directory-service.example.com');
    mockGetServiceConfigurationSchemas.mockRejectedValue(new MockHttpRequestError(403, 'forbidden'));

    const result = await getConfigurationSchemaTool.handler({});

    expect(result.isError).toBe(true);
    expect(getText(result)).toContain('wrong tenant realm');
  });

  it('distinguishes a 5xx as a platform outage', async () => {
    mockGetAccessToken.mockResolvedValue({ status: 'ok', token: 'token-abc' });
    mockGetDirectoryServiceUrl.mockReturnValue('https://directory-service.example.com');
    mockGetServiceConfigurationSchemas.mockRejectedValue(new MockHttpRequestError(503, 'unavailable'));

    const result = await getConfigurationSchemaTool.handler({});

    expect(result.isError).toBe(true);
    expect(getText(result)).toContain('outage');
  });

  it('distinguishes a DNS/connection failure', async () => {
    mockGetAccessToken.mockResolvedValue({ status: 'ok', token: 'token-abc' });
    mockGetDirectoryServiceUrl.mockReturnValue('https://directory-service.example.com');
    mockGetServiceConfigurationSchemas.mockRejectedValue(new TypeError('fetch failed'));

    const result = await getConfigurationSchemaTool.handler({});

    expect(result.isError).toBe(true);
    expect(getText(result)).toContain('Could not reach the ADSP platform');
  });
});
