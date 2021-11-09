import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'https://access-dev.os99.gov.ab.ca' }),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    MONGO_URI: envalid.str({ default: 'mongodb://localhost:27017' }),
    MONGO_DB: envalid.str({ default: 'config' }),
    MONGO_TLS: envalid.bool({ default: false }),
    MONGO_USER: envalid.str({ default: '' }),
    MONGO_PASSWORD: envalid.str({ default: '' }),
    PORT: envalid.num({ default: 3337 }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:configuration-service' }),
    CLIENT_SECRET: envalid.str(),
    DIRECTORY_URL: envalid.str({ default: 'https://tenant-management-api-core-services-dev.os99.gov.ab.ca' }),
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
