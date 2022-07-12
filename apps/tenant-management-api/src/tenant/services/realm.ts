import { Tenant } from '../models';
import { ServiceClient } from '../types';

export interface RealmService {
  deleteRealm(tenant: Tenant): Promise<boolean>;
  createRealm(serviceClients: ServiceClient[], { name, realm, adminEmail }: Omit<Tenant, 'id'>): Promise<void>;
}
