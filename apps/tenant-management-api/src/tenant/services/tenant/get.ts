import { AdspId } from '@abgov/adsp-service-sdk';
import { tenantRepository } from '../../repository';
import { TenantEntity } from '../../models';

export const getTenant = async (id: AdspId): Promise<TenantEntity> => {
  try {
    const objId = id.resource.split('/').pop();
    const entity = await tenantRepository.findBy({ _id: objId });
    return Promise.resolve(entity);
  } catch (e) {
    return Promise.reject(e);
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
