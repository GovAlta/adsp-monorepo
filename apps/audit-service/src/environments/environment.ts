import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'http://localhost:8080' }),
    DIRECTORY_URL: envalid.str({ default: 'http://localhost:3331' }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:audit-service' }),
    CLIENT_SECRET: envalid.str(),
    DB_HOST: envalid.str({ default: 'localhost' }),
    DB_PORT: envalid.num({ default: 5433 }),
    DB_NAME: envalid.str({ default: 'audit' }),
    DB_USER: envalid.str({ default: 'audit_owner' }),
    DB_PASSWORD: envalid.str(),
    DB_TLS: envalid.bool({ default: false }),
    DB_POOL_MAX: envalid.num({ default: 5 }),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    PORT: envalid.num({ default: 3352 }),
    TRUSTED_PROXY: envalid.str({ default: 'uniquelocal' }),
    OTEL_EXPORTER_OTLP_ENDPOINT: envalid.str({ default: '' }),
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalid env vars: ${util.inspect(errors)}`);
      }
    },
  },
);
