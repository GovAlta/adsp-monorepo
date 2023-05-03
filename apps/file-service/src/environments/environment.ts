import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'https://access.adsp-dev.gov.ab.ca' }),
    DIRECTORY_URL: envalid.str({ default: 'https://localhost:3331' }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:file-service' }),
    CLIENT_SECRET: envalid.str({ default: '' }),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    MONGO_URI: envalid.str({ default: 'mongodb://localhost:27017' }),
    MONGO_DB: envalid.str({ default: 'file' }),
    MONGO_USER: envalid.str({ default: '' }),
    MONGO_PASSWORD: envalid.str({ default: '' }),
    MONGO_TLS: envalid.bool({ default: false }),
    STORAGE_PROVIDER: envalid.str({ default: 'file' }),
    FILE_PATH: envalid.str({ default: 'data/file/' }),
    BLOB_ACCOUNT_URL: envalid.str({ default: '' }),
    BLOB_ACCOUNT_NAME: envalid.str({ default: '' }),
    BLOB_ACCOUNT_KEY: envalid.str({ default: '' }),
    AV_HOST: envalid.str({ default: 'localhost' }),
    AV_PORT: envalid.num({ default: 3310 }),
    AV_PROVIDER: envalid.str({ default: 'clam' }),
    AMQP_HOST: envalid.str({ default: 'localhost' }),
    AMQP_USER: envalid.str({ default: 'guest' }),
    AMQP_PASSWORD: envalid.str({ default: 'guest' }),
    PORT: envalid.num({ default: 3337 }),
    TRUSTED_PROXY: envalid.str({ default: 'uniquelocal' }),
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
