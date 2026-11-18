import { adspId, AdspId, Tenant } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { TenantRepository } from '../..';
import { TenantCriteria } from '../../types';

export const getTenant = async (repository: TenantRepository, id: AdspId): Promise<Tenant> => {
  try {
    const objId = id.resource.split('/').pop();
    const entity = await repository.get(objId);
    if (entity.status === 'archived') {
      throw new NotFoundError('Tenant', objId);
    }

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
    const entities = await repository.find({ ...criteria, excludeArchived: true });
    return Promise.resolve(
      entities.map((entity) => ({
        ...entity,
        id: adspId`urn:ads:platform:tenant-service:v2:/tenants/${entity.id}`,
      })),
    );
  } catch (e) {
    return Promise.reject(e);
  }
};
