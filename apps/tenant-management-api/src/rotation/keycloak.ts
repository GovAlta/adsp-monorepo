import { RotationKeycloakClient } from '@core-services/client-secret-rotation';
import type KcAdminClient from '@keycloak/keycloak-admin-client';

// The admin client package is ESM only; see ../keycloak/index.ts.
const dynamicImport = async (packageName: string) => new Function(`return import('${packageName}')`)();

/**
 * Creates Keycloak clients that act with the signed-in admin's own token, so Keycloak enforces that admin's
 * permissions and the API holds no realm-admin credential for rotation.
 */
export async function createRotationKeycloakFactory(
  keycloakRootUrl: string,
): Promise<(realm: string, bearer: string) => RotationKeycloakClient> {
  const Client: typeof KcAdminClient = (await dynamicImport('@keycloak/keycloak-admin-client')).default;
  return (realm, bearer) => {
    const client = new Client({ baseUrl: `${keycloakRootUrl}/auth`, realmName: realm });
    client.setAccessToken(bearer);
    return new RotationKeycloakClient(client);
  };
}

/**
 * Creates a Keycloak client for the scheduled notifier. It signs in as a dedicated service account in the master
 * realm. The account holds the master admin role but has "Full scope allowed" off, so each token carries only the
 * roles of the realm's optional client scope (`<scopePrefix><realm>`). That keeps the token small however many realms
 * exist. It signs in again on every call so a long interval between runs never leaves it with an expired token.
 */
export async function createRotationServiceAccountFactory(
  keycloakRootUrl: string,
  clientId: string,
  clientSecret: string,
  scopePrefix: string,
): Promise<(realm: string) => Promise<RotationKeycloakClient>> {
  const Client: typeof KcAdminClient = (await dynamicImport('@keycloak/keycloak-admin-client')).default;
  return async (realm) => {
    const client = new Client({ baseUrl: `${keycloakRootUrl}/auth`, realmName: 'master' });
    await client.auth({ grantType: 'client_credentials', clientId, clientSecret, scopes: [`${scopePrefix}${realm}`] });
    return new RotationKeycloakClient(client);
  };
}
