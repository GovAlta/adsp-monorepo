const env = process.env;

export const environment = {
  KEYCLOAK_ROOT_URL: '',
  KEYCLOAK_REALM: '',
  FILE_PATH: 'data/file/',
  LOG_LEVEL: 'debug',
  MONGO_URI: 'mongodb://localhost:27017',
  MONGO_DB: 'file',
  MONGO_USER: null,
  MONGO_PASSWORD: null,
  AMQP_HOST: 'localhost',
  AMQP_USER: 'guest',
  AMQP_PASSWORD: 'guest',
  AV_HOST: 'localhost',
  AV_PORT: 3310,
  AV_PROVIDER: 'clam',
  PORT: 3337,
  ...env,
  production: env.NODE_ENV === 'production'
};
