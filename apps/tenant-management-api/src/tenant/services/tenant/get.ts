import { adspId, AdspId, Tenant } from '@abgov/adsp-service-sdk';
import type RoleRepresentation from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import { createkcAdminClient } from '../../../keycloak';
import { TenantRepository } from '../..';
import { TenantCriteria } from '../../types';

export const getTenant = async (repository: TenantRepository, id: AdspId): Promise<Tenant> => {
  try {
    const objId = id.resource.split('/').pop();
    const entity = await repository.get(objId);
    return Promise.resolve({
      ...entity,
      id: adspId`urn:ads:platform:tenant-service:v2:/tenants/${entity.id}`,
    });
  } catch (e) {
    return Promise.reject(e);
  }
};

export const getTenants = async (repository: TenantRepository, criteria?: TenantCriteria): Promise<Tenant[]> => {
  try {
    const entities = await repository.find(criteria);
    return Promise.resolve(
      entities.map((entity) => ({
        ...entity,
        id: adspId`urn:ads:platform:tenant-service:v2:/tenants/${entity.id}`,
      }))
    );
  } catch (e) {
    return Promise.reject(e);
  }
};

export const getRealmRoles = async (realm: string): Promise<RoleRepresentation[]> => {
  try {
    const client = await createkcAdminClient();
    const roles = await client.roles.find({ realm: realm });
    return Promise.resolve(roles);
  } catch (e) {
    return Promise.reject(e);
  }
};
