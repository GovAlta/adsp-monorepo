import * as initKnex from 'knex';
import { TimescaleValuesRepository } from './value';

interface TimescaleRepositoryProps {
  DB_HOST: string
  DB_PORT: number
  DB_NAME: string
  DB_USER: string
  DB_PASSWORD: string
}

export const createRepositories = ({
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD
}: TimescaleRepositoryProps) => {
  
  const knex = initKnex({
    client: 'postgresql',
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      database : DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD
    },
    searchPath: ['public'],
    migrations: {
      tableName: 'value_service_migrations',
      directory: __dirname + '/migrations'
    }
  });

  return knex.migrate.latest()
  .then(() => ({
    valueRepository: new TimescaleValuesRepository(knex)
  }));
}
