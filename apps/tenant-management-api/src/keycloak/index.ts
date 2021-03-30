import { environment } from '../environments/environment';
import KcAdminClient from 'keycloak-admin';

interface Options {
  baseUrl?: string;
  realmName?: string;
}

const defaultOptions: Options = {
  baseUrl: process.env.KEYCLOAK_ROOT_URL + '/auth',
  realmName: 'master',
};

export async function createkcAdminClient(opts?: Options): Promise<KcAdminClient> {
  const client = new KcAdminClient({
    ...defaultOptions,
    ...opts,
  });

  await client.auth({
    username: process.env.KEYCLOAK_TENANT_API_CLIENT,
    password: process.env.KEYCLOAK_TENANT_API_CLIENT_SECRET,
    grantType: 'client_credentials',
    clientId: process.env.KEYCLOAK_TENANT_REALM_ADMIN_CLIENT_ID || 'tenant-realm-admin',
    clientSecret: process.env.KEYCLOAK_TENANT_REALM_ADMIN_CLIENT_SECRET,
  });

  return Promise.resolve(client);
}
