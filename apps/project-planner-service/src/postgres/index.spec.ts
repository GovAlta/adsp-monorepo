import { retry } from '@abgov/adsp-service-sdk';
import { knex as initKnex } from 'knex';
import { Logger } from 'winston';
import { createRepositories } from './index';
import { PostgresSolutionRepository } from './solution';

jest.mock('knex', () => ({ knex: jest.fn() }));
jest.mock('./solution', () => ({ PostgresSolutionRepository: jest.fn() }));
jest.mock('@abgov/adsp-service-sdk', () => ({
  ...jest.requireActual('@abgov/adsp-service-sdk'),
  retry: { execute: jest.fn() },
}));

describe('createRepositories', () => {
  const knexMock = { migrate: { latest: jest.fn() }, raw: jest.fn() };
  const initKnexMock = initKnex as unknown as jest.Mock;
  const retryMock = retry.execute as jest.Mock;
  const logger = { debug: jest.fn(), info: jest.fn() };
  const props = {
    logger: logger as unknown as Logger,
    DB_HOST: 'localhost',
    DB_PORT: 5432,
    DB_NAME: 'planner',
    DB_USER: 'planner-user',
    DB_PASSWORD: 'planner-password',
    DB_TLS: true,
  };

  beforeEach(() => {
    initKnexMock.mockReturnValue(knexMock);
    retryMock.mockImplementation((fn) => fn({ attempt: 1 }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('initializes knex with the connection settings', async () => {
    await createRepositories(props);

    expect(initKnexMock).toHaveBeenCalledWith(
      expect.objectContaining({
        client: 'postgresql',
        connection: {
          host: 'localhost',
          port: 5432,
          database: 'planner',
          user: 'planner-user',
          password: 'planner-password',
          ssl: true,
        },
      }),
    );
  });

  it('runs migrations to latest', async () => {
    await createRepositories(props);

    expect(knexMock.migrate.latest).toHaveBeenCalledTimes(1);
  });

  it('creates the solution repository with the knex instance', async () => {
    await createRepositories(props);

    expect(PostgresSolutionRepository).toHaveBeenCalledWith(knexMock);
  });

  it('rethrows migration failures so they can be retried', async () => {
    knexMock.migrate.latest.mockRejectedValueOnce(new Error('connection refused'));

    await expect(createRepositories(props)).rejects.toThrow('connection refused');
  });

  it('reports connected when the database responds', async () => {
    knexMock.raw.mockResolvedValueOnce(undefined);

    const { isConnected } = await createRepositories(props);

    expect(await isConnected()).toBe(true);
  });

  it('reports not connected when the database query fails', async () => {
    knexMock.raw.mockRejectedValueOnce(new Error('connection refused'));

    const { isConnected } = await createRepositories(props);

    expect(await isConnected()).toBe(false);
  });
});
