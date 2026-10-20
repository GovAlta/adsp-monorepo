jest.mock('knex', () => ({ knex: jest.fn() }));
jest.mock('@abgov/adsp-service-sdk', () => ({
  ...jest.requireActual('@abgov/adsp-service-sdk'),
  retry: { execute: jest.fn(async (operation) => operation({ attempt: 1 })) },
}));

import { knex } from 'knex';
import { createLogger, transports } from 'winston';
import { createDatabase } from './index';

describe('audit database initialization', () => {
  const logger = createLogger({ transports: [new transports.Console({ silent: true })] });
  const database = {
    migrate: { latest: jest.fn() },
    raw: jest.fn(),
    destroy: jest.fn(),
  };
  const options = {
    logger,
    DB_HOST: 'localhost',
    DB_PORT: 5433,
    DB_NAME: 'audit',
    DB_USER: 'audit_owner',
    DB_PASSWORD: 'test-only',
    DB_TLS: false,
    DB_POOL_MAX: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(knex).mockImplementation(jest.fn().mockReturnValue(database));
    database.migrate.latest.mockResolvedValue(undefined);
    database.destroy.mockResolvedValue(undefined);
    database.raw.mockResolvedValue({ rows: [{ result: 1 }] });
  });

  it('runs migrations before exposing the shared connection pool', async () => {
    const result = await createDatabase(options);

    expect(result.knex).toBe(database);
    expect(database.migrate.latest).toHaveBeenCalledTimes(1);
    expect(knex).toHaveBeenCalledWith(
      expect.objectContaining({
        pool: { min: 0, max: 5, acquireTimeoutMillis: 30000 },
        migrations: expect.objectContaining({ tableName: 'audit_service_migrations' }),
      }),
    );
  });

  it('closes the pool if migrations fail', async () => {
    const failure = new Error('Migration unavailable');
    database.migrate.latest.mockRejectedValue(failure);

    await expect(createDatabase(options)).rejects.toBe(failure);
    expect(database.destroy).toHaveBeenCalledTimes(1);
  });

  it('reports a reachable database', async () => {
    const result = await createDatabase(options);

    await expect(result.isConnected()).resolves.toBe(true);
    expect(database.raw).toHaveBeenCalledWith('SELECT 1');
  });

  it('reports a failed database health query', async () => {
    const result = await createDatabase(options);
    database.raw.mockRejectedValue(new Error('Connection refused'));

    await expect(result.isConnected()).resolves.toBe(false);
  });
});
