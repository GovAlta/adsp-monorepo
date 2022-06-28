import KcAdminClient from '@keycloak/keycloak-admin-client';
import { Logger } from 'winston';
import { environment } from '../environments/environment';
import { RealmService } from '../tenant';
import { KeycloakRealmServiceImpl } from './keycloak';

interface Options {
  baseUrl?: string;
  realmName?: string;
}

const defaultOptions: Options = {
  baseUrl: environment.KEYCLOAK_ROOT_URL + '/auth',
  realmName: 'master',
};

export async function createkcAdminClient(opts?: Options): Promise<KcAdminClient> {
  const client = new KcAdminClient({
    ...defaultOptions,
    ...opts,
  });

  // Client credentials grant shouldn't require username and password.
  await client.auth({
    username: null,
    password: null,
    grantType: 'client_credentials',
    clientId: environment.KEYCLOAK_TENANT_REALM_ADMIN_CLIENT_ID,
    clientSecret: environment.KEYCLOAK_TENANT_REALM_ADMIN_CLIENT_SECRET,
  });

  return client;
}

interface RealmServiceProps {
  logger: Logger;
  KEYCLOAK_ROOT_URL: string;
}

export function createKeycloakRealmService({ logger, KEYCLOAK_ROOT_URL }: RealmServiceProps): RealmService {
  return new KeycloakRealmServiceImpl(logger, KEYCLOAK_ROOT_URL, 'core', createkcAdminClient);
}
