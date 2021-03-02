import { environment } from '../environments/environment';
import KcAdminClient from 'keycloak-admin';

let kcAdminClient = null;

const options = {
  baseUrl:
    (environment.KEYCLOAK_ROOT_URL || process.env.KEYCLOAK_ROOT_URL) + '/auth',
  realmName: 'master',
};

const authOptions = {
  username:
    environment.REALM_ADMIN_USERNAME || process.env.REALM_ADMIN_USERNAME,
  password:
    environment.REALM_ADMIN_PASSWORD || process.env.REALM_ADMIN_PASSWORD,
  grantType: 'password',
  clientId:
    environment.KEYCLOAK_ADMIN_CLIENT_ID ||
    process.env.KEYCLOAK_ADMIN_CLIENT_ID,
};

export async function createkcAdminClient(): Promise<KcAdminClient> {
  kcAdminClient = new KcAdminClient(options);
  await kcAdminClient.auth(authOptions);

  return Promise.resolve(kcAdminClient);
}
