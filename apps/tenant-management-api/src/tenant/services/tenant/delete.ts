import { TenantRepository } from '../..';
import { createkcAdminClient } from '../../../keycloak';
import { logger } from '../../../middleware/logger';
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

    // If broker client isn't found, that's ok... since end result is the same.
    if (brokerClient) {
      logger.info(brokerClient.id);
      await kcClient.clients.del({
        id: brokerClient.id,
        realm: 'core',
      });
    }

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

const deleteTenantFromDB = async (repository: TenantRepository, realmName: string): Promise<DeleteResponse> => {
  try {
    await repository.delete(realmName);
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

export const deleteTenant = async (
  repository: TenantRepository,
  keycloakRealm: string
): Promise<DeleteTenantResponse> => {
  const deleteTenantResponse: DeleteTenantResponse = {
    keycloakRealm: await deleteKeycloakRealm(keycloakRealm),
    IdPBrokerClient: await deleteKeycloakBrokerClient(keycloakRealm),
    db: await deleteTenantFromDB(repository, keycloakRealm),
  };
  return Promise.resolve(deleteTenantResponse);
};
