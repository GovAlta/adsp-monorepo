import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'http://localhost:8080' }),
    DIRECTORY_URL: envalid.str({ default: 'http://localhost:3331' }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:project-planner-service' }),
    CLIENT_SECRET: envalid.str(),
    DB_HOST: envalid.str({ default: 'localhost' }),
    DB_PORT: envalid.num({ default: 5432 }),
    DB_NAME: envalid.str({ default: 'postgres' }),
    DB_USER: envalid.str({ default: 'postgres' }),
    DB_PASSWORD: envalid.str({ default: 'guest' }),
    DB_TLS: envalid.bool({ default: false }),
    OTEL_EXPORTER_OTLP_ENDPOINT: envalid.str({ default: '' }),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    PORT: envalid.num({ default: 3381 }),
    TRUSTED_PROXY: envalid.str({ default: 'uniquelocal' }),
    MAAS_API_KEY: envalid.str({ default: '' }),
    MAAS_BASE_URL: envalid.str({ default: 'https://maas.int.gov.ab.ca/v1' }),
    MAAS_MODEL: envalid.str({ default: 'GOA-Default' }),
    MAAS_TIMEOUT_MS: envalid.num({ default: 120000 }),
    MAAS_INSECURE_TLS: envalid.bool({ default: false }),
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalid env vars: ${util.inspect(errors)}`);
      }
    },
  },
);
