import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'http://localhost:8080' }),
    DIRECTORY_URL: envalid.str({ default: 'http://localhost:3333' }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:value-service' }),
    CLIENT_SECRET: envalid.str(),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    DB_HOST: envalid.str({ default: 'localhost' }),
    DB_PORT: envalid.num({ default: 5432 }),
    DB_NAME: envalid.str({ default: 'values-db' }),
    DB_USER: envalid.str({ default: 'postgres' }),
    DB_PASSWORD: envalid.str({ default: 'guest' }),
    DB_TLS: envalid.bool({ default: false }),
    PORT: envalid.num({ default: 3336 }),
    TRUSTED_PROXY: envalid.str({ default: 'uniquelocal' }),
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalid env vars: ${util.inspect(errors)}`);
      }
    },
  }
);
