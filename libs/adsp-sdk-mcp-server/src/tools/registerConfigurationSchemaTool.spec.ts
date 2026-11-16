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
import { createMetricsTestKit, MetricsTestKit } from '../fixtures/metricsTestKit';
import { installMetrics } from '../metrics';

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

describe('get_service_configuration_schema upstream error metrics', () => {
  let kit: MetricsTestKit;
  let uninstall: () => void;

  function upstreamErrors() {
    return kit.points('mcp.live_tool.upstream.errors').map((point) => ({ attributes: point.attributes, value: point.value }));
  }

  beforeEach(() => {
    kit = createMetricsTestKit();
    ({ uninstall } = installMetrics(kit.provider));
    mockGetDirectoryServiceUrl.mockReturnValue('https://directory.example.test');
  });

  afterEach(async () => {
    uninstall();
    await kit.shutdown();
  });

  it.each([
    [new MockHttpRequestError(503, 'unavailable'), 'http_5xx'],
    [new MockHttpRequestError(404, 'not found'), 'http_4xx'],
    [new MockHttpRequestError(401, 'unauthorized'), 'http_4xx'],
    [new MockServiceNotInDirectoryError('urn:ads:platform:configuration-service'), 'not_in_directory'],
    [new TypeError('fetch failed'), 'network'],
    [new Error('something else'), 'other'],
  ])('counts %p as %s', async (error, errorType) => {
    mockGetAccessToken.mockResolvedValue({ status: 'ok', token: 'token-abc' });
    mockGetServiceConfigurationSchemas.mockRejectedValue(error);

    await getConfigurationSchemaTool.handler({});
    await kit.collect();

    expect(upstreamErrors()).toEqual([
      { attributes: { 'mcp.tool.name': 'get_service_configuration_schema', 'error.type': errorType }, value: 1 },
    ]);
  });

  it('counts a not-authenticated result as not_authenticated', async () => {
    mockGetAccessToken.mockResolvedValue({ status: 'not-authenticated' });

    await getConfigurationSchemaTool.handler({});
    await kit.collect();

    expect(upstreamErrors()).toEqual([
      { attributes: { 'mcp.tool.name': 'get_service_configuration_schema', 'error.type': 'not_authenticated' }, value: 1 },
    ]);
  });

  it('counts nothing when the upstream call succeeds', async () => {
    mockGetAccessToken.mockResolvedValue({ status: 'ok', token: 'token-abc' });
    mockGetServiceConfigurationSchemas.mockResolvedValue([]);

    await getConfigurationSchemaTool.handler({});
    await kit.collect();

    expect(upstreamErrors()).toEqual([]);
  });
});
