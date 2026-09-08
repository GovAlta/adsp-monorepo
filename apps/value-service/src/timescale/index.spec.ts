/* eslint-disable @typescript-eslint/no-explicit-any */
import { knex as initKnex } from 'knex';
import { Logger } from 'winston';
import { createRepositories } from './index';

jest.mock('knex', () => ({ knex: jest.fn() }));

jest.mock('@abgov/adsp-service-sdk', () => ({
  ...jest.requireActual('@abgov/adsp-service-sdk'),
  retry: { execute: jest.fn((work: (context: { attempt: number }) => Promise<void>) => work({ attempt: 1 })) },
}));

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as unknown as Logger;

const props = {
  logger,
  DB_HOST: 'localhost',
  DB_PORT: 5432,
  DB_NAME: 'values-db',
  DB_USER: 'postgres',
  DB_PASSWORD: 'secret',
  DB_TLS: false,
  DB_POOL_MAX: 4,
  METRIC_INTERVAL_ROLLUP_STATEMENT_TIMEOUT_MS: 30000,
};

const createKnexStub = () => {
  const raw = jest.fn((sql: string) =>
    Promise.resolve(sql.includes('pg_try_advisory_xact_lock') ? { rows: [{ locked: true }] } : {}),
  );
  const knex: any = jest.fn();
  knex.migrate = { latest: jest.fn() };
  knex.raw = raw;
  knex.transaction = jest.fn((work: (trx: unknown) => Promise<unknown>) => work(knex));

  return { knex, raw };
};

describe('createRepositories', () => {
  const config = () => (initKnex as unknown as jest.Mock).mock.calls[0][0];

  beforeEach(() => {
    (initKnex as unknown as jest.Mock).mockReset();
    (initKnex as unknown as jest.Mock).mockReturnValue(createKnexStub().knex);
  });

  // The ceiling is multiplied by the replica count against one server, and knex's implicit default
  // also holds a floor of two connections open for the life of an idle process.
  it('bounds what a replica can take from the database', async () => {
    await createRepositories(props);

    expect(config().pool).toEqual({ min: 0, max: 4, acquireTimeoutMillis: 30000 });
  });

  it('connects with the configured credentials', async () => {
    await createRepositories(props);

    expect(config().connection).toEqual({
      host: 'localhost',
      port: 5432,
      database: 'values-db',
      user: 'postgres',
      password: 'secret',
      ssl: false,
    });
  });

  it('runs migrations before handing back the repositories', async () => {
    const { knex } = createKnexStub();
    (initKnex as unknown as jest.Mock).mockReturnValue(knex);

    const repositories = await createRepositories(props);

    expect(knex.migrate.latest).toHaveBeenCalled();
    expect(repositories.metricIntervalRollupRepository).toBeDefined();
  });

  // A refresh that runs away would otherwise hold its connection for as long as it takes, and the
  // pool it comes from is the one serving the API.
  it('gives the rollup repository the configured statement timeout', async () => {
    const { knex, raw } = createKnexStub();
    (initKnex as unknown as jest.Mock).mockReturnValue(knex);

    const { metricIntervalRollupRepository } = await createRepositories(props);
    await metricIntervalRollupRepository.withRollupLock(async () => 0);

    expect(raw).toHaveBeenCalledWith('SET LOCAL statement_timeout = 30000');
  });

  it('reports the connection as down when the check query throws', async () => {
    const { knex } = createKnexStub();
    knex.raw = jest.fn().mockRejectedValue(new Error('no connection slots'));
    (initKnex as unknown as jest.Mock).mockReturnValue(knex);

    const repositories = await createRepositories(props);

    expect(await repositories.isConnected()).toBe(false);
  });
});
