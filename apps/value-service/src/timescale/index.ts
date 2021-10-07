import { knex as initKnex } from 'knex';
import { Logger } from 'winston';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const retry = require('promise-retry');
import { ValuesRepository } from '../values';
import { TimescaleValuesRepository } from './value';

interface TimescaleRepositoryProps {
  logger: Logger;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
}

interface Repositories {
  isConnected: () => Promise<boolean>;
  valueRepository: ValuesRepository;
}

export const createRepositories = async ({
  logger,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
}: TimescaleRepositoryProps): Promise<Repositories> => {
  const knex = initKnex({
    client: 'postgresql',
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD,
    },
    searchPath: ['public'],
    migrations: {
      tableName: 'value_service_migrations',
      directory: __dirname + '/migrations',
    },
  });

  await retry(async (next, count) => {
    logger.debug(`Try ${count}: connecting to timescale and running migration...`);
    try {
      await knex.migrate.latest();
    } catch (err) {
      logger.debug(`Try ${count} failed with error. ${err}`, { context: 'createRepositories' });
      next(err);
    }
  });

  return {
    isConnected: async () => {
      try {
        await knex.raw('SELECT 1');
        return true;
      } catch (err) {
        return false;
      }
    },
    valueRepository: new TimescaleValuesRepository(knex),
  };
};
