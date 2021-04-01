const env = process.env;

export const environment = {
  KEYCLOAK_ROOT_URL: '',
  KEYCLOAK_REALM: '',
  LOG_LEVEL: 'debug',
  MONGO_URI: 'mongodb://localhost:27017',
  MONGO_DB: 'push',
  MONGO_USER: null,
  MONGO_PASSWORD: null,
  AMQP_HOST: 'localhost',
  AMQP_USER: 'guest',
  AMQP_PASSWORD: 'guest',
  // EVENT_SERVICE_URL: 'http://localhost:3334',
  PORT: 3333,
  ...env,
  production: env.NODE_ENV === 'production',
};
