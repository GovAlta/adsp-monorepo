const env = process.env;

export const environment = {
  KEYCLOAK_ROOT_URL: '',
  KEYCLOAK_REALM: '',
  KEYCLOAK_CLIENT_ID: 'configuration-service',
  KEYCLOAK_CLIENT_SECRET: 'configuration-service',
  LOG_LEVEL: 'debug',
  MONGO_URI: 'mongodb://localhost:27017',
  MONGO_DB: 'event',
  MONGO_USER: null,
  MONGO_PASSWORD: null,
  AMQP_HOST: 'localhost',
  AMQP_USER: 'guest',
  AMQP_PASSWORD: 'guest',
  PORT: 3334,
  VALUE_SERVICE_URL: 'http://localhost:3336',
  ...env,
  production: env.NODE_ENV === 'production'
};