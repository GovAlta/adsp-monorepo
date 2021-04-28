import KcAdminClient from 'keycloak-admin';
import * as Logging from './logging';
import { setAdminAuthToken } from './http';
import { fetchConfig } from './config';

const logger = Logging.createLogger('[JWT][KeyCloak][INIT]', 'info');
const refreshTimeInterval = (parseInt(process.env.KEYCLOAK_TENANT_API_TOKEN_EXPIRY_INTERVAL) || 3600) * 1000;

let tenantAPIClient;
let locker = false;
export let ready = false;
const options = {
  baseUrl: (process.env.KEYCLOAK_ROOT_URL || 'https://access-dev.os99.gov.ab.ca') + '/auth',
  realmName: 'core',
};

// Have not found any doc to use grant_type client_credentials
export const tenantApiOptions = {
  grantType: 'client_credentials' as const,
  clientId: process.env.KEYCLOAK_TENANT_API_CLIENT || 'tenant-api',
  clientSecret: process.env.KEYCLOAK_TENANT_API_CLIENT_SECRET,
};

export const isReady = () => {
  return ready;
};

export function initService(refresh = false) {
  (async () => {
    try {
      if (locker) {
        logger.info(`Another module are trying to load the tenant token as well. Skip the loading`);
      }

      if (process.env.KEYCLOAK_TENANT_API_AUTH_TOKEN === undefined || refresh) {
        locker = true;
        tenantAPIClient = new KcAdminClient(options);
        await tenantAPIClient.auth(tenantApiOptions);
        const accessToken = await tenantAPIClient.getAccessToken();
        logger.info('Fetched api-tenant client access token and save it to process.env.KEYCLOAK_TENANT_API_AUTH_TOKEN');
        process.env.KEYCLOAK_TENANT_API_AUTH_TOKEN = accessToken;
        ready = true;
        setAdminAuthToken();
        if (process.env.APP_ENVIRONMENT !== 'test') {
          fetchConfig();
        }
      } else {
        logger.info('Skip fetching tenant api auth token');
      }
    } catch (err) {
      if (process.env.APP_ENVIRONMENT !== 'test') {
        logger.warn(
          `Error fetching the tenant api token ${err}. Please double check your environment variables. Or, we are running the code for testing`
        );
      }
    }
  })();
}

if (process.env.APP_ENVIRONMENT !== 'test') {
  setInterval(initService, refreshTimeInterval, true);
}
