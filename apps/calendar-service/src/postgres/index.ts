import { retry } from '@abgov/adsp-service-sdk';
import { knex as initKnex } from 'knex';
import { Logger } from 'winston';
import { CalendarRepository } from '../calendar/repository';
import { PostgresCalendarRepository } from './calendar';

interface PostgresRepositoryProps {
  logger: Logger;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_TLS: boolean;
}

interface Repositories {
  isConnected: () => Promise<boolean>;
  calendarRepository: CalendarRepository;
}

export const createRepositories = async ({
  logger,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_TLS,
}: PostgresRepositoryProps): Promise<Repositories> => {
  const knex = initKnex({
    client: 'postgresql',
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD,
      ssl: DB_TLS,
    },
    searchPath: ['public'],
    migrations: {
      tableName: 'calendar_service_migrations',
      directory: __dirname + '/migrations',
    },
  });

  await retry.execute(async ({ attempt }) => {
    logger.debug(`Try ${attempt}: connecting to postgres and running migration...`);
    try {
      await knex.migrate.latest();

      logger.info('Database migrations upped to latest.');
    } catch (err) {
      logger.debug(`Try ${attempt} failed with error. ${err}`, { context: 'createRepositories' });
      throw err;
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
    calendarRepository: new PostgresCalendarRepository(knex),
  };
};
