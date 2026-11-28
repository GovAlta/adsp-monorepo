/* eslint-disable @typescript-eslint/no-explicit-any */
import { knex as initKnex } from 'knex';
import { retry } from '@abgov/adsp-service-sdk';
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
  const retryExecute = retry.execute as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (initKnex as unknown as jest.Mock).mockReset();
    (initKnex as unknown as jest.Mock).mockReturnValue(createKnexStub().knex);
    retryExecute.mockImplementation((work: (context: { attempt: number }) => Promise<void>) => work({ attempt: 1 }));
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

  it('does not log an error when a migration retry recovers', async () => {
    const connectionError = new Error('connection unavailable');
    const { knex } = createKnexStub();
    knex.migrate.latest.mockRejectedValueOnce(connectionError).mockResolvedValueOnce(undefined);
    (initKnex as unknown as jest.Mock).mockReturnValue(knex);
    retryExecute.mockImplementation(async (work: (context: { attempt: number }) => Promise<void>) => {
      await expect(work({ attempt: 1 })).rejects.toBe(connectionError);
      return work({ attempt: 2 });
    });

    await createRepositories(props);

    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith(`Try 1 failed with error. ${connectionError}`, {
      context: 'createRepositories',
    });
    expect(knex.migrate.latest).toHaveBeenCalledTimes(2);
  });

  it('logs one contextual error and preserves the exhausted retry error', async () => {
    const terminalError = new Error('database unavailable');
    const { knex } = createKnexStub();
    knex.migrate.latest.mockRejectedValue(terminalError);
    (initKnex as unknown as jest.Mock).mockReturnValue(knex);
    retryExecute.mockImplementation(async (work: (context: { attempt: number }) => Promise<void>) => {
      await expect(work({ attempt: 1 })).rejects.toBe(terminalError);
      await expect(work({ attempt: 2 })).rejects.toBe(terminalError);
      throw terminalError;
    });

    await expect(createRepositories(props)).rejects.toBe(terminalError);

    expect(logger.debug).toHaveBeenCalledWith(`Try 2 failed with error. ${terminalError}`, {
      context: 'createRepositories',
    });
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      `Failed to connect to timescale and run migrations after retries. ${terminalError}`,
      { context: 'createRepositories' },
    );
    expect(retryExecute).toHaveBeenCalledTimes(1);
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
