const env = process.env;

export const environment = {
  LOG_LEVEL: 'debug',
  MONGO_URI: 'mongodb://localhost:27017',
  MONGO_DB: 'serviceConfig',
  MONGO_USER: null,
  MONGO_PASSWORD: null,
  AMQP_HOST: 'localhost',
  AMQP_USER: 'guest',
  AMQP_PASSWORD: 'guest',
  PORT: 3335,
  ...env,
  production: env.NODE_ENV === 'production'
};