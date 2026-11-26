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
