import { retry } from '@abgov/adsp-service-sdk';
import { knex as initKnex, Knex } from 'knex';
import { Logger } from 'winston';

export interface PostgresProps {
  logger: Logger;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_TLS: boolean;
  DB_POOL_MAX: number;
}

export interface Database {
  knex: Knex;
  isConnected: () => Promise<boolean>;
}

const MIGRATIONS_TABLE = 'audit_service_migrations';

const createKnex = (props: PostgresProps): Knex =>
  initKnex({
    client: 'postgresql',
    connection: {
      host: props.DB_HOST,
      port: props.DB_PORT,
      database: props.DB_NAME,
      user: props.DB_USER,
      password: props.DB_PASSWORD,
      ssl: props.DB_TLS,
    },
    searchPath: ['public'],
    // The floor is dropped so idle replicas hand connections back, and the ceiling is configurable
    // because it is multiplied by the replica count against one shared server. Acquiring is bounded so a
    // caller fails rather than queueing without end.
    pool: {
      min: 0,
      max: props.DB_POOL_MAX,
      acquireTimeoutMillis: 30000,
    },
    migrations: {
      tableName: MIGRATIONS_TABLE,
      directory: __dirname + '/migrations',
    },
  });

const runMigrations = async (knex: Knex, logger: Logger) => {
  // Retry covers the database not yet being reachable and replicas racing to create the migrations table.
  await retry.execute(async ({ attempt }) => {
    logger.debug(`Try ${attempt}: connecting to database and running migration...`);
    try {
      await knex.migrate.latest();
      logger.info('Completed running knex migrations.');
    } catch (err) {
      logger.debug(`Try ${attempt} failed with error. ${err}`, { context: 'createDatabase' });
      throw err;
    }
  });
};

export const createDatabase = async (props: PostgresProps): Promise<Database> => {
  // MVP: one database user both runs migrations and serves requests, as in the other services.
  const knex = createKnex(props);
  await runMigrations(knex, props.logger);

  return {
    knex,
    isConnected: async () => {
      try {
        await knex.raw('SELECT 1');
        return true;
      } catch {
        return false;
      }
    },
  };
};
