const mockDotenvConfig = jest.fn();
jest.mock('dotenv', () => ({ config: mockDotenvConfig }));

import type { environment as Environment } from './environment';

describe('environment', () => {
  const originalEnv = process.env;

  const loadEnvironment = (env: Record<string, string> = {}): typeof Environment => {
    process.env = { CLIENT_SECRET: 'test-client-secret', ...env };
    jest.resetModules();
    return jest.requireActual('./environment').environment;
  };

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
    mockDotenvConfig.mockReset();
  });

  it('loads variables from a dotenv file', () => {
    loadEnvironment();

    expect(mockDotenvConfig).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['KEYCLOAK_ROOT_URL', 'http://localhost:8080'],
    ['DIRECTORY_URL', 'http://localhost:3331'],
    ['CLIENT_ID', 'urn:ads:platform:project-planner-service'],
    ['DB_HOST', 'localhost'],
    ['DB_PORT', 5432],
    ['DB_NAME', 'postgres'],
    ['DB_USER', 'postgres'],
    ['DB_PASSWORD', 'guest'],
    ['DB_TLS', false],
    ['OTEL_EXPORTER_OTLP_ENDPOINT', ''],
    ['LOG_LEVEL', 'debug'],
    ['PORT', 3381],
    ['TRUSTED_PROXY', 'uniquelocal'],
    ['MAAS_API_KEY', ''],
    ['MAAS_BASE_URL', 'https://maas.int.gov.ab.ca/v1'],
    ['MAAS_MODEL', 'GOA-Default'],
    ['MAAS_TIMEOUT_MS', 120000],
  ])('defaults %s to %p when not set', (name, expected) => {
    const environment = loadEnvironment();

    expect(environment[name as keyof typeof environment]).toBe(expected);
  });

  it('reads the client secret from the environment', () => {
    const environment = loadEnvironment({ CLIENT_SECRET: 'another-test-secret' });

    expect(environment.CLIENT_SECRET).toBe('another-test-secret');
  });

  it('parses PORT as a number', () => {
    const environment = loadEnvironment({ PORT: '4000' });

    expect(environment.PORT).toBe(4000);
  });

  it('parses DB_PORT as a number', () => {
    const environment = loadEnvironment({ DB_PORT: '6543' });

    expect(environment.DB_PORT).toBe(6543);
  });

  it('parses DB_TLS as a boolean', () => {
    const environment = loadEnvironment({ DB_TLS: 'true' });

    expect(environment.DB_TLS).toBe(true);
  });

  it('overrides string defaults from the environment', () => {
    const environment = loadEnvironment({ MAAS_MODEL: 'GOA-Large' });

    expect(environment.MAAS_MODEL).toBe('GOA-Large');
  });

  it('does not report errors when all required variables are present', () => {
    loadEnvironment();

    expect(console.error).not.toHaveBeenCalled();
  });

  it('reports invalid environment variables when the client secret is missing', () => {
    process.env = {};
    jest.resetModules();

    jest.requireActual('./environment');

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Invalid env vars'));
  });
});
