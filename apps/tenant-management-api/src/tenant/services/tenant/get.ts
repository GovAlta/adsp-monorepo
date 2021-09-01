import { AdspId } from '@abgov/adsp-service-sdk';
import { tenantRepository } from '../../repository';
import { TenantEntity } from '../../models';
import { createkcAdminClient } from '../../../keycloak';
import type RoleRepresentation from 'keycloak-admin/lib/defs/roleRepresentation';

export const getTenant = async (id: AdspId): Promise<TenantEntity> => {
  try {
    const objId = id.resource.split('/').pop();
    const entity = await tenantRepository.findBy({ _id: objId });
    return Promise.resolve(entity);
  } catch (e) {
    return Promise.reject(e);
  }
};

export const hasTenantOfRealm = async (realm: string): Promise<boolean> => {
  try {
    return Promise.resolve(true);
  } catch (e) {
    return Promise.resolve(false);
  }
};

export const getTenants = async (): Promise<TenantEntity[]> => {
  try {
    const entities = await tenantRepository.find();
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
