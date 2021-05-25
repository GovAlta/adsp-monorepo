import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    ALLOW_SWAGGER_UI: envalid.bool({ default: false }),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    MONGO_USER: envalid.str({ default: '' }),
    MONGO_PASSWORD: envalid.str({ default: '' }),
    MONGO_URI: envalid.str({ default: 'mongodb://localhost:27017' }),
    MONGO_DB: envalid.str({ default: 'tenantDb' }),
    PORT: envalid.num({ default: 3333 }),
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'https://access-dev.os99.gov.ab.ca' }),
    KEYCLOAK_TENANT_REALM_ADMIN_CLIENT_ID: envalid.str({ default: 'tenant-realm-admin' }),
    KEYCLOAK_TENANT_REALM_ADMIN_CLIENT_SECRET: envalid.str(),
    TENANT_WEB_APP_CLIENT_ID: envalid.str({ default: 'urn:ads:platform:tenant-admin-app' }),
    TENANT_WEB_APP_HOST: envalid.str({ default: 'http://localhost:4200' }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:tenant-service' }),
    CLIENT_SECRET: envalid.str(),
    APP_ENVIRONMENT: envalid.str({ default: 'dev' }),
    DIRECTORY_BOOTSTRAP: envalid.str({ default: '' })
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalidated env vars: ${util.inspect(errors)}`);
      }
    },
  }
);
