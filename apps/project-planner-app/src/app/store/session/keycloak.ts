import Keycloak from 'keycloak-js';

let client: Keycloak | undefined;

export function createKeycloakClient(access: { url: string; realm: string; client_id: string }): Keycloak {
  client = new Keycloak({ url: `${access.url}/auth`, realm: access.realm, clientId: access.client_id });
  return client;
}

export const getKeycloakClient = (): Keycloak | undefined => client;
