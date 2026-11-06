import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'https://access.adsp-dev.gov.ab.ca' }),
    DIRECTORY_URL: envalid.str({ default: 'http://localhost:3331' }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:test-sharepoint-service' }),
    CLIENT_SECRET: envalid.str(),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    PORT: envalid.num({ default: 3350 }),
    TRUSTED_PROXY: envalid.str({ default: 'uniquelocal' }),
    OTEL_EXPORTER_OTLP_ENDPOINT: envalid.str({ default: '' }),
    MONGO_URI: envalid.str({ default: 'mongodb://localhost:27017' }),
    MONGO_DB: envalid.str({ default: 'sharepointDb' }),
    MONGO_USER: envalid.str({ default: '' }),
    MONGO_PASSWORD: envalid.str({ default: '' }),
    MONGO_TLS: envalid.bool({ default: false }),
    CREDENTIALS_KEY: envalid.str(),
    CREDENTIALS_KEY_VERSION: envalid.num({ default: 1 }),
    ENTRA_AUTHORITY_URL: envalid.str({ default: 'https://login.microsoftonline.com' }),
    GRAPH_URL: envalid.str({ default: 'https://graph.microsoft.com/v1.0' }),
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalid env vars: ${util.inspect(errors)}`);
      }
    },
  },
);
