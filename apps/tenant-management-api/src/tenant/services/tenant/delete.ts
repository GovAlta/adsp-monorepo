import { createkcAdminClient } from '../../../keycloak';
import { logger } from '../../../middleware/logger';
import { TenantError } from './error';
import * as HttpStatusCodes from 'http-status-codes';
import * as TenantModel from '../../models/tenant';
import { brokerClientName } from './create';
interface DeleteResponse {
  isDeleted: boolean;
  errors?: string[];
}

interface DeleteTenantResponse {
  keycloakRealm: DeleteResponse;
  IdPBrokerClient: DeleteResponse;
  db: DeleteResponse;
}

const deleteKeycloakRealm = async (realm): Promise<DeleteResponse> => {
  try {
    /**
     * As default, the tenant name is same as realm name
     * We might need to update this part in the future
     *  */

    logger.info(`Start to delete keycloak realm ${realm}`);

    const kcClient = await createkcAdminClient();

    await kcClient.realms.del({
      realm: realm,
    });

    return Promise.resolve({
      isDeleted: true,
    });
  } catch (err) {
    const errMessage = `Failed deleting the keycloak realm with error: ${err.message}`;
    logger.error(errMessage);
    return Promise.resolve({
      isDeleted: false,
      errors: [errMessage],
    });
  }
};

const deleteKeycloakBrokerClient = async (keycloakRealm): Promise<DeleteResponse> => {
  try {
    logger.info(`Start to delete IdP client in core`);

    const kcClient = await createkcAdminClient();

    const clientsOnCore = await kcClient.clients.find({
      realm: 'core',
    });
    const brokerClient = clientsOnCore.find((client) => {
      return client.clientId === brokerClientName(keycloakRealm);
    });

    logger.info(brokerClient.id);
    await kcClient.clients.del({
      id: brokerClient.id,
      realm: 'core',
    });

    return Promise.resolve({
      isDeleted: true,
    });
  } catch (err) {
    const errMessage = `Failed deleting the IdP client with error: ${err.message}`;
    logger.error(errMessage);

    return Promise.resolve({
      isDeleted: false,
      errors: [errMessage],
    });
  }
};

const deleteTenantFromDB = async (keycloakName): Promise<DeleteResponse> => {
  try {
    await TenantModel.deleteTenantByRealm(keycloakName);
    return Promise.resolve({
      isDeleted: true,
    });
  } catch (err) {
    const errMessage = `Failed deleting tenant DB entry: ${err.message}`;
    logger.error(errMessage);
    return Promise.resolve({
      isDeleted: false,
      errors: [errMessage],
    });
  }
};

export const deleteTenant = async (keycloakRealm): Promise<DeleteTenantResponse> => {
  const deleteTenantResponse: DeleteTenantResponse = {
    keycloakRealm: await deleteKeycloakRealm(keycloakRealm),
    IdPBrokerClient: await deleteKeycloakBrokerClient(keycloakRealm),
    db: await deleteTenantFromDB(keycloakRealm),
  };
  return Promise.resolve(deleteTenantResponse);
};
