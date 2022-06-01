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
    MONGO_TLS: envalid.bool({ default: false }),
    PORT: envalid.num({ default: 3333 }),
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'https://access.adsp-dev.gov.ab.ca' }),
    KEYCLOAK_TENANT_REALM_ADMIN_CLIENT_ID: envalid.str({ default: 'tenant-realm-admin' }),
    KEYCLOAK_TENANT_REALM_ADMIN_CLIENT_SECRET: envalid.str({ default: '' }),
    TENANT_WEB_APP_CLIENT_ID: envalid.str({ default: 'urn:ads:platform:tenant-admin-app' }),
    SUBSCRIBER_APP_CLIENT_ID: envalid.str({ default: 'urn:ads:platform:subscriber-app' }),
    TENANT_WEB_APP_HOST: envalid.str({ default: 'http://localhost:4200' }),
    SUBSCRIBER_APP_HOST: envalid.str({ default: 'http://localhost:4200' }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:tenant-service' }),
    CLIENT_SECRET: envalid.str({ default: '' }),
    APP_ENVIRONMENT: envalid.str({ default: 'dev' }),
    TRUSTED_PROXY: envalid.str({ default: 'uniquelocal' }),
    DIRECTORY_URL: envalid.str({ default: 'https://directory-service.adsp-dev.gov.ab.ca' })
  },
    {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalidated env vars: ${util.inspect(errors)}`);
      }
    },
  }
);
