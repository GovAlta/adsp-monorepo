import { environment } from '../environments/environment';
import KcAdminClient from 'keycloak-admin';

let kcAdminClient = null;

const options = {
  baseUrl: (environment.KEYCLOAK_ROOT_URL || process.env.KEYCLOAK_ROOT_URL) + '/auth',
  realmName: 'master',
};

const authOptions = {
  grantType: 'client_credentials',
  clientId: process.env.KEYCLOAK_TENANT_REALM_ADMIN_CLIENT_ID || 'tenant-realm-admin',
  clientSecret: process.env.KEYCLOAK_TENANT_REALM_ADMIN_CLIENT_SECRET,
};

export async function createkcAdminClient(): Promise<KcAdminClient> {
  kcAdminClient = new KcAdminClient(options);
  await kcAdminClient.auth(authOptions);

  return Promise.resolve(kcAdminClient);
}
