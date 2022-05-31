import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'https://access.adsp-dev.gov.ab.ca' }),
    DIRECTORY_URL: envalid.str({ default: 'https://directory-service.adsp-dev.gov.ab.ca' }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:configuration-service' }),
    CLIENT_SECRET: envalid.str(),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    MONGO_URI: envalid.str({ default: 'mongodb://localhost:27017' }),
    MONGO_DB: envalid.str({ default: 'config' }),
    MONGO_TLS: envalid.bool({ default: false }),
    MONGO_USER: envalid.str({ default: '' }),
    MONGO_PASSWORD: envalid.str({ default: '' }),
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
