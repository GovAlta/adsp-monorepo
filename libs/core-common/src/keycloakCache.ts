import * as request from 'request';
import * as Logging from './logging';
import * as util from 'util';

const TENANT_MAGEMENT_API_HOST = process.env.TENANT_MAGEMENT_API_HOST || 'http://localhost:3333';

// Must set default Issuer appropriately. Otherwise,the code will in an infinite loop
const DEFAULT_TOKEN_ISSUER = 'https://access-dev.os99.gov.ab.ca/auth/realms/core';
const DEFAULT_REALM_TENANT_NAME_MAPPING = {
  master: 'master',
  core: 'core',
};

const logger = Logging.createLogger('[Auth][JWT][CACHE]', 'info');

const issuerCache = [DEFAULT_TOKEN_ISSUER];

export const validateIssuer = (issuer: string) => {
  if (!issuerCache.includes(issuer)) {
    // issuer not in the cache, update the issuer cache
    const headers = {
      Authorization: `Bearer ${process.env.KEYCLOAK_TENANT_API_AUTH_TOKEN}`,
    };

    request.get(
      {
        url: `${TENANT_MAGEMENT_API_HOST}/api/tenant/v1/issuers`,
        headers: headers,
      },
      (err, res, body) => {
        if (err) {
          logger.error(err);
          throw Error('Error fetching the keycloak issuers');
        }
        const tokenIssuers = JSON.parse(body);
        logger.info(`Token Issuers from remote: ${tokenIssuers}`);
        for (const newToken of tokenIssuers) {
          if (!issuerCache.includes(newToken)) {
            issuerCache.push(newToken);
          }
        }

        logger.info(`Updated issuer cache: ${issuerCache}`);

        // After issuers update, try once more:
        if (!issuerCache.includes(issuer)) {
          logger.error(`Unexpected issuer: ${issuer}`);
          return false;
        }
      }
    );
  }

  return true;
};

let mappingCache = DEFAULT_REALM_TENANT_NAME_MAPPING;

export const validateRealm = (realm: string) => {
  if (!(realm in mappingCache)) {
    logger.info(`realm-tenantName maping does not include realm ${realm}. Start to sync the local cache with remote`);
    const headers = {
      Authorization: `Bearer ${process.env.KEYCLOAK_TENANT_API_AUTH_TOKEN}`,
    };

    request.get(
      {
        url: `${TENANT_MAGEMENT_API_HOST}/api/tenant/v1/realms/names`,
        headers: headers,
      },
      (err, res, body) => {
        if (err) {
          logger.error(err);
          return false;
        }

        mappingCache = {
          ...mappingCache,
          ...JSON.parse(body),
        };

        logger.info(`Realm-tenant mapping: ${util.inspect(mappingCache)}`);

        // After issuers update, try once more:
        if (!(realm in mappingCache)) {
          logger.error(`Cannot find realm-tennat mapping for realm ${realm}`);
          return false;
        }
      }
    );
  }

  return true;
};

export const getTenantName = (realm: string) => {
  return mappingCache[realm];
};
