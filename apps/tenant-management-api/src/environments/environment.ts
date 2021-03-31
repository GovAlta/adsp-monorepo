import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    MONGO_USER: envalid.str({ default: '' }),
    MONGO_PASSWORD: envalid.str({ default: '' }),
    MONGO_URI: envalid.str({ default: 'mongodb://localhost:27017' }),
    MONGO_DB: envalid.str({ default: 'tenantDb' }),
    PORT: envalid.num({ default: 3333 }),
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'https://access-dev.os99.gov.ab.ca' }),
    FILE_SERVICE_HOST: envalid.str({ default: 'https://file-service-core-services-dev.os99.gov.ab.ca' }),
    KEYCLOAK_TENANT_API_CLIENT_SECRET: envalid.str(),
    KEYCLOAK_TENANT_REALM_ADMIN_CLIENT_ID: envalid.str(),
    APP_ENVIRONMENT: envalid.str(),
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalidated env vars: ${util.inspect(errors)}`);
      }
    },
  }
);
