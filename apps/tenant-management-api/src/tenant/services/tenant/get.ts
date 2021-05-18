import { adspId, AdspId } from '@abgov/adsp-service-sdk';
import { Tenant } from '../../models/tenant';

interface TenantEntity {
  id: AdspId;
  name: string;
  realm: string;
  createdBy: string;
}

export const getTenant = async (id: AdspId): Promise<TenantEntity> => {
  return new Promise((resolve, reject) => {
    Tenant.findOne({ _id: id.resource }, {}, {}, (err, doc) =>
      err
        ? reject(err)
        : resolve({
            id: adspId`urn:ads:platform:tenant-service:v2:/tenants/${doc._id}`,
            name: doc.name,
            realm: doc.realm,
            createdBy: doc.createdBy,
          })
    );
  });
};

export const getTenants = async (): Promise<TenantEntity[]> => {
  return new Promise((resolve, reject) => {
    Tenant.find({}, (err, results) =>
      err
        ? reject(err)
        : resolve(
            results?.map((doc) => ({
              id: adspId`urn:ads:platform:tenant-service:v2:/tenants/${doc._id}`,
              name: doc.name,
              realm: doc.realm,
              createdBy: doc.createdBy,
            }))
          )
    );
  });
};