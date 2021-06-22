import { executeAdminGet, HOSTS } from './http';
import * as util from 'util';
import { logger } from './logger';

// Initial issuer is required to prevent infinite loop
const DEFAULT_TOKEN_ISSUER = `${HOSTS.keycloakHost}/auth/realms/core`;
const DEFAULT_REALM_TENANT_NAME_MAPPING = {
  master: 'master',
  core: 'core',
};

let mappingCache = DEFAULT_REALM_TENANT_NAME_MAPPING;

const issuerCache = [DEFAULT_TOKEN_ISSUER];
const updateIssuers = async () => {
  try {
    const url = `${HOSTS.tenantAPI}/api/tenant/v1/issuers`;
    const issuers = await executeAdminGet(url);
    logger.info(`Issuers from remote: ${util.inspect(issuers)}`);
    for (const issuer of issuers) {
      if (!issuerCache.includes(issuer)) {
        logger.info(`Add new issuer: ${issuer}`);
        issuerCache.push(issuer);
      }
    }

    return Promise.resolve();
  } catch (error) {
    logger.error(`Error fetching issuers from remote: ${error}`);
    return Promise.reject({
      errors: [error],
    });
  }
};

const updateRealmNameMapping = async () => {
  try {
    const url = `${HOSTS.tenantAPI}/api/tenant/v1/realms/names`;

    logger.info(`Tenant realm-name mapping from remote: ${util.inspect(url)}`);

    const mapping = await executeAdminGet(url);
    mappingCache = {
      ...mappingCache,
      ...mapping,
    };

    logger.info(`Tenant realm-name mapping: ${util.inspect(mappingCache)}`);

    return Promise.resolve();
  } catch (error) {
    logger.error(`Error fetching tenant realm-name from remote: ${error}`);
    return Promise.reject({
      errors: [error],
    });
  }
};

export const updateCache = () => {
  return Promise.all([updateRealmNameMapping(), updateIssuers()]);
};

export const validateIssuer = (issuer: string) => {
  return issuerCache.includes(issuer);
};

export const getTenantName = (issuer: string) => {
  const realm = issuer.split('/').slice(-1)[0];
  return mappingCache[realm];
};
