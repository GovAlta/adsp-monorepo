/* eslint-disable @typescript-eslint/no-explicit-any */
import { retry } from '@abgov/adsp-service-sdk';
import { knex as initKnex } from 'knex';
import { Logger } from 'winston';
import { createRepositories } from './index';

jest.mock('knex', () => ({ knex: jest.fn() }));
jest.mock('./topic', () => ({ PostgresTopicRepository: jest.fn() }));

jest.mock('@abgov/adsp-service-sdk', () => ({
  ...jest.requireActual('@abgov/adsp-service-sdk'),
  retry: { execute: jest.fn() },
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
  DB_NAME: 'comment-db',
  DB_USER: 'postgres',
  DB_PASSWORD: 'secret',
  DB_TLS: false,
};

const createKnexStub = () => {
  const knex: any = jest.fn();
  knex.migrate = { latest: jest.fn() };
  knex.raw = jest.fn();
  return knex;
};

describe('createRepositories', () => {
  const retryExecute = retry.execute as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (initKnex as unknown as jest.Mock).mockReturnValue(createKnexStub());
    retryExecute.mockImplementation((work: (context: { attempt: number }) => Promise<void>) => work({ attempt: 1 }));
  });

  it('does not log an error when a migration retry recovers', async () => {
    const connectionError = new Error('connection unavailable');
    const knex = createKnexStub();
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
    const knex = createKnexStub();
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
      `Failed to connect to postgres and run migrations after retries. ${terminalError}`,
      { context: 'createRepositories' },
    );
    expect(retryExecute).toHaveBeenCalledTimes(1);
  });
});
