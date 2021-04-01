import * as HttpStatusCodes from 'http-status-codes';
import { createLogger } from '@core-services/core-common';
const logger = createLogger('[JWT][SERVICE]', 'info');

interface ServiceAuthConfig {
  realm?: string;
  client?: string;
  tenantName?: string;
}

const serviceAuth = (authConfig: ServiceAuthConfig, user) => {
  logger.info(`tenant: ${user.client}`);
  try {
    console.log();
    if (authConfig.realm) {
      const realm = user.tokenIssuer.split('/').slice(-1)[0];

      if (realm !== authConfig.realm) {
        logger.warning(`Expect realm ${authConfig.realm}, but current realm is ${user.realm}`);
        return false;
      }
    }

    if (authConfig.tenantName) {
      if (user.tenantName !== authConfig.tenantName) {
        logger.warning(`Expect realm ${authConfig.tenantName}, but current realm is ${user.tenantName}`);

        return false;
      }
    }

    if (authConfig.client) {
      if (user.client != authConfig.client) {
        logger.warning(`Expect realm ${authConfig.client}, but current realm is ${user.client}`);

        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

export const serviceAuthMiddleware = (authConfig: ServiceAuthConfig) => async (req, res, next: () => void) => {
  if (serviceAuth(authConfig, req.user)) {
    next();
  } else {
    return res.send(HttpStatusCodes.UNAUTHORIZED);
  }
};

export const tenantApiAdminOnly = async (req, res, next: () => void) => {
  const authConfig: ServiceAuthConfig = {
    realm: 'core',
    client: 'tenant-api',
  };

  if (serviceAuth(authConfig, req.user)) {
    next();
  } else {
    res.send(HttpStatusCodes.UNAUTHORIZED);
  }
};

export default serviceAuthMiddleware;
