import { retry } from '@abgov/adsp-service-sdk';
import { knex as initKnex } from 'knex';
import { Logger } from 'winston';
import { MetricIntervalRollupRepository, ServiceMetricRollupRepository, ValuesRepository } from '../values';
import { TimescaleValuesRepository } from './value';
import { TimescaleMetricIntervalRollupRepository, TimescaleServiceMetricRollupRepository } from '../values/repository';

interface TimescaleRepositoryProps {
  logger: Logger;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_TLS: boolean;
  DB_POOL_MAX: number;
  METRIC_INTERVAL_ROLLUP_STATEMENT_TIMEOUT_MS: number;
}

interface Repositories {
  isConnected: () => Promise<boolean>;
  valueRepository: ValuesRepository;
  serviceMetricRollupRepository: ServiceMetricRollupRepository;
  metricIntervalRollupRepository: MetricIntervalRollupRepository;
}

export const createRepositories = async ({
  logger,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_TLS,
  DB_POOL_MAX,
  METRIC_INTERVAL_ROLLUP_STATEMENT_TIMEOUT_MS,
}: TimescaleRepositoryProps): Promise<Repositories> => {
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
    // Left implicit, knex keeps a floor of two connections open per replica for the life of the
    // process and caps at ten. The floor is dropped so idle replicas hand their connections back,
    // and the ceiling is configurable because it is multiplied by the replica count against one
    // shared server. Acquiring is bounded so a caller fails rather than queueing without end.
    pool: {
      min: 0,
      max: DB_POOL_MAX,
      acquireTimeoutMillis: 30000,
    },
    migrations: {
      tableName: 'value_service_migrations',
      directory: __dirname + '/migrations',
    },
  });

  await retry.execute(async ({ attempt }) => {
    logger.debug(`Try ${attempt}: connecting to timescale and running migration...`);
    try {
      await knex.migrate.latest();
      logger.info('Completed running knex migrations on timescale.');
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
      } catch {
        return false;
      }
    },
    valueRepository: new TimescaleValuesRepository(knex, logger),
    serviceMetricRollupRepository: new TimescaleServiceMetricRollupRepository(knex),
    metricIntervalRollupRepository: new TimescaleMetricIntervalRollupRepository(
      knex,
      METRIC_INTERVAL_ROLLUP_STATEMENT_TIMEOUT_MS,
    ),
  };
};
