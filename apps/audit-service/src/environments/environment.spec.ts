jest.mock('dotenv', () => ({ config: jest.fn() }));

import type { environment as Environment } from './environment';

describe('retention environment settings', () => {
  const originalEnv = process.env;

  function loadEnvironment(overrides: Record<string, string> = {}): typeof Environment {
    process.env = {
      CLIENT_SECRET: 'test-client-secret',
      DB_PASSWORD: 'test-database-password',
      ...overrides,
    };
    jest.resetModules();
    return jest.requireActual<typeof import('./environment')>('./environment').environment;
  }

  afterEach(() => {
    process.env = originalEnv;
  });

  it('keeps scheduled retention off serving replicas unless explicitly enabled', () => {
    expect(loadEnvironment().RETENTION_ENABLED).toBe(false);
  });

  it.each([
    ['true', true],
    ['false', false],
  ] as const)('honors explicit RETENTION_ENABLED=%s', (value, expected) => {
    expect(loadEnvironment({ RETENTION_ENABLED: value }).RETENTION_ENABLED).toBe(expected);
  });

  it('keeps the default daily schedule at 02:00 UTC', () => {
    expect(loadEnvironment().RETENTION_SCHEDULE).toBe('0 2 * * *');
  });
});
