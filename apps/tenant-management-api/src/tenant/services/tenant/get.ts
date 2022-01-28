import { AdspId } from '@abgov/adsp-service-sdk';
import type RoleRepresentation from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import { TenantEntity } from '../../models';
import { createkcAdminClient } from '../../../keycloak';
import { TenantRepository } from '../..';

export const getTenant = async (repository: TenantRepository, id: AdspId): Promise<TenantEntity> => {
  try {
    const objId = id.resource.split('/').pop();
    const entity = await repository.findBy({ _id: objId });
    return Promise.resolve(entity);
  } catch (e) {
    return Promise.reject(e);
  }
};

export const hasTenantOfRealm = async (_realm: string): Promise<boolean> => {
  try {
    return Promise.resolve(true);
  } catch (e) {
    return Promise.resolve(false);
  }
};

export const getTenants = async (repository: TenantRepository): Promise<TenantEntity[]> => {
  try {
    const entities = await repository.find();
    return Promise.resolve(entities);
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

export function testGet(): boolean {
  return true;
}
