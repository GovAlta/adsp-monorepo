import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'https://access-dev.os99.gov.ab.ca' }),
    KEYCLOAK_REALM: envalid.str({ default: 'core' }),
    FILE_PATH: envalid.str({ default: 'data/file/' }),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    MONGO_URI: envalid.str({ default: 'mongodb://localhost:27017' }),
    MONGO_DB: envalid.str({ default: 'file' }),
    MONGO_USER: envalid.str({ default: '' }),
    MONGO_PASSWORD: envalid.str({ default: '' }),
    AMQP_HOST: envalid.str({ default: '' }),
    AMQP_USER: envalid.str({ default: 'guest' }),
    AMQP_PASSWORD: envalid.str({ default: 'guest' }),
    AV_HOST: envalid.str({ default: 'localhost' }),
    AV_PORT: envalid.num({ default: 3310 }),
    AV_PROVIDER: envalid.str({ default: 'clam' }),
    PORT: envalid.num({ default: 3337 }),
    KEYCLOAK_TENANT_API_CLIENT: envalid.str({ default: 'tenant-api' }),
    KEYCLOAK_TENANT_API_CLIENT_SECRET: envalid.str(),
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalidated env vars: ${util.inspect(errors)}`);
      }
    },
  }
);

environment.isProd; // true if NODE_ENV === 'production'
