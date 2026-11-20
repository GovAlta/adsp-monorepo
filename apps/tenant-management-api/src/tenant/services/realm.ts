import { Tenant } from '../models';
import { ServiceClient } from '../types';

export type RealmClientBackfillStatus = 'added' | 'present' | 'wouldAdd';

export interface RealmService {
  /**
   * Disables the realm in keycloak
   * @param tenant
   */
  disableRealm(tenant: Tenant): Promise<void>;

  /**
   * Enable the realm keycloak
   * @param tenant
   */
  enableRealm(tenant: Tenant): Promise<void>;
  deleteRealm(tenant: Tenant): Promise<boolean>;
  createRealm(serviceClients: ServiceClient[], { name, realm, adminEmail }: Omit<Tenant, 'id'>): Promise<void>;

  /**
   * Adds the adsp-mcp client to an existing realm, configured as createRealm configures it for a new realm.
   * A realm that already has the client is left unchanged; a dry run makes no changes.
   */
  addAdspMcpClient(realm: string, dryRun: boolean): Promise<RealmClientBackfillStatus>;
  findUserId(realm: string, email: string): Promise<string>;
  deleteUserIdp(userId: string, realm: string, idpName?: string): Promise<void>;
  checkUserDefaultIdpInCore(userId: string): Promise<boolean>;
}
