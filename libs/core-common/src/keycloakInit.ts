import KcAdminClient from 'keycloak-admin';
import * as Logging from './logging';
import { setAdminAuthToken } from './http';

const logger = Logging.createLogger('[JWT][KeyCloak][INIT]', 'info');
const refreshTimeInterval = (parseInt(process.env.KEYCLOAK_TENANT_API_TOKEN_EXPIRY_INTERVAL) || 3600) * 1000;

let tenantAPIClient;
const options = {
  baseUrl: (process.env.KEYCLOAK_ROOT_URL || 'https://access-dev.os99.gov.ab.ca') + '/auth',
  realmName: 'core',
};

// Have not found any doc to use grant_type client_credentials
export const tenanApiOptions = {
  grantType: 'client_credentials' as const,
  clientId: process.env.KEYCLOAK_TENANT_API_CLIENT || 'tenant-api',
  clientSecret: process.env.KEYCLOAK_TENANT_API_CLIENT_SECRET,
};

export function initTenantApi() {
  (async () => {
    try {
      tenantAPIClient = new KcAdminClient(options);
      await tenantAPIClient.auth(tenanApiOptions);
      const accessToken = await tenantAPIClient.getAccessToken();
      logger.info('Fetched api-tenant client access token and save it to process.env.KEYCLOAK_TENANT_API_AUTH_TOKEN');
      process.env.KEYCLOAK_TENANT_API_AUTH_TOKEN = accessToken;
      setAdminAuthToken();
    } catch (err) {
      if (process.env.APP_ENVIRONMENT !== 'test') {
        logger.warn(
          `Error fetch the tenant api token ${err}. Please double check your envrionment variables. Or, we are running the code for testing`
        );
      }
    }
  })();
}

if (process.env.APP_ENVIRONMENT !== 'test') {
  setInterval(initTenantApi, refreshTimeInterval);
}
