import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'http://localhost:8080' }),
    DIRECTORY_URL: envalid.str({ default: 'http://localhost:3333' }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:push-service' }),
    CLIENT_SECRET: envalid.str(),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    AMQP_HOST: envalid.str({ default: 'localhost' }),
    AMQP_USER: envalid.str({ default: 'guest' }),
    AMQP_PASSWORD: envalid.str({ default: 'guest' }),
    REDIS_HOST: envalid.str({ default: 'push-redis' }),
    REDIS_PORT: envalid.num({ default: 6379 }),
    REDIS_PASSWORD: envalid.str({ default: '' }),
    PORT: envalid.num({ default: 3334 }),
    TLS_ENABLED: envalid.bool({ default: true }),
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalid env vars: ${util.inspect(errors)}`);
      }
    },
  }
);
