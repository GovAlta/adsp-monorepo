export interface RotationLinks {
  portalUrl?: string;
  runbookUrl?: string;
  /** The Keycloak root; events get the client's Credentials page. */
  keycloakUrl?: string;
}

/** Opens the client's Credentials tab in the Keycloak admin console, where the new secret is read. */
export const getClientCredentialsUrl = (keycloakUrl: string, realm: string, id: string) =>
  `${keycloakUrl}/admin/${realm}/console/#/${realm}/clients/${id}/credentials`;
