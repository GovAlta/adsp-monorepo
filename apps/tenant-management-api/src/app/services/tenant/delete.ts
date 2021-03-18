import { createkcAdminClient } from '../../../keycloak';
import { logger } from '../../../middleware/logger';
import { TenantError } from './error';
import * as HttpStatusCodes from 'http-status-codes';
import * as TenantModel from '../../models/tenant';
import { brokerClientName } from './create';

export const deleteTenantByRealm = async (realmName) => {
  try {
    const kcClient = await createkcAdminClient();

    logger.info(`Start to delete realm - ${realmName}`);

    await kcClient.realms.del({
      realm: realmName,
    });

    logger.info(`Start to delete IdP client in core`);

    const clientsOnCore = await kcClient.clients.find({
      realm: 'core',
    });

    const brokerClient = clientsOnCore.find((client) => {
      return client.clientId === brokerClientName(realmName);
    });

    logger.info(brokerClient.id);

    await kcClient.clients.del({
      id: brokerClient.id,
      realm: 'core',
    });
    logger.info(`Start to delete tenant entry in database`);

    await TenantModel.deleteTenantByRealm(realmName);
  } catch (err) {
    throw new TenantError(err.message, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};
