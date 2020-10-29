const env = process.env;

export const environment = {
  KEYCLOAK_ROOT_URL: 'localhost:8090',
  KEYCLOAK_REALM: 'master',
  LOG_LEVEL: 'debug',
  DB_HOST: 'localhost',
  DB_PORT: 5432,
  DB_NAME: 'values-db',
  DB_USER: 'postgres',
  DB_PASSWORD: 'value-service',
  PORT: 3336,
  ...env,
  production: env.NODE_ENV === 'production'
};
