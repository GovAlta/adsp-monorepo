import { ServiceStatusEntity } from '../app';
import { ServiceStatusRepository } from '../app/repository/serviceStatus';

export default class MongoHealthRepository implements ServiceStatusRepository {
  getByTenantId(tenantId: string): Promise<ServiceStatusEntity> {
    throw new Error('Method not implemented.');
  }
  delete(entity: ServiceStatusEntity): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  get(id: string): Promise<ServiceStatusEntity> {
    throw new Error('Method not implemented.');
  }
  save(entity: ServiceStatusEntity): Promise<ServiceStatusEntity> {
    throw new Error('Method not implemented.');
  }
}

export { MongoHealthRepository };
