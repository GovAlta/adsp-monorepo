import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

// Keycloak redirect URIs must be exact; plain http is only allowed for a server run on localhost.
const callbackUrls = envalid.makeValidator<string[]>((value) => {
  const urls = value
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
  for (const url of urls) {
    const { protocol, hostname } = new URL(url);
    if (url.includes('*') || !(protocol === 'https:' || (protocol === 'http:' && hostname === 'localhost'))) {
      throw new envalid.EnvError(`Invalid MCP server callback URL: ${url}`);
    }
  }
  return urls;
});

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
    API_APP_HOST: envalid.str({ default: 'http://localhost:4200' }),
    // Comma separated. Production: only https://<public-url>/oauth/callback; dev and UAT also add the localhost one.
    // Deployed images set NODE_ENV=production, so there an unset value gives no redirect URIs, never a localhost one.
    MCP_SERVER_CALLBACK_URLS: callbackUrls({ default: [], devDefault: ['http://localhost:3000/oauth/callback'] }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:tenant-service' }),
    CLIENT_SECRET: envalid.str({ default: '' }),
    APP_ENVIRONMENT: envalid.str({ default: 'dev' }),
    TRUSTED_PROXY: envalid.str({ default: 'uniquelocal' }),
    DIRECTORY_URL: envalid.str({ default: 'https://directory-service.adsp-dev.gov.ab.ca' }),
    TENANT_RETENTION_DAYS: envalid.num({ default: 30 }),
    // Link to the rotation runbook shown in notifications; set to an empty value to omit it from emails.
    CLIENT_SECRET_ROTATION_RUNBOOK_URL: envalid.str({
      default:
        'https://goa-dio.atlassian.net/wiki/spaces/ADSPA/pages/5230921156/Runbook+Client+secret+rotation+in+Keycloak+manual+steps',
    }),
    TENANT_PURGE_ENABLED: envalid.bool({ default: false }),
    TENANT_PURGE_SCHEDULE: envalid.str({ default: '0 2 * * *' }),
    // Runs on one replica only. The service account holds only the rotation roles in the tenant realms.
    CLIENT_SECRET_ROTATION_NOTICE_JOB_ENABLED: envalid.bool({ default: false }),
    CLIENT_SECRET_ROTATION_NOTICE_JOB_SCHEDULE: envalid.str({ default: '0 15 * * *' }),
    CLIENT_SECRET_ROTATION_NOTICE_JOB_CLIENT_ID: envalid.str({ default: 'tenant-client-secret-rotation-notifier' }),
    CLIENT_SECRET_ROTATION_NOTICE_JOB_CLIENT_SECRET: envalid.str({ default: '' }),
    CLIENT_SECRET_ROTATION_NOTICE_JOB_SCOPE_PREFIX: envalid.str({ default: 'rotation-notice-' }),
    // Small master client (manage-clients and view-clients on master-realm) that only creates the notice scope of a new realm.
    CLIENT_SECRET_ROTATION_SCOPE_ADMIN_CLIENT_ID: envalid.str({ default: '' }),
    CLIENT_SECRET_ROTATION_SCOPE_ADMIN_CLIENT_SECRET: envalid.str({ default: '' }),
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalidated env vars: ${util.inspect(errors)}`);
      }
    },
  },
);
