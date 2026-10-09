// Client and target IDs are used in API paths and configuration paths; this matches the configuration schema.
export const TOKEN_HANDLER_ID_MAX_LENGTH = 50;
export const TOKEN_HANDLER_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export interface TokenHandlerTarget {
  id: string;
  upstream: string;
}

export interface TokenHandlerClient {
  id: string;
  name: string;
  description?: string;
  idpHint?: string;
  prompt?: 'none' | 'login' | 'consent' | 'select_account';
  scope?: string;
  authCallbackUrl?: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  targets?: Record<string, TokenHandlerTarget>;
}

export interface TokenHandlerState {
  clients: Record<string, TokenHandlerClient> | null;
  // Keycloak client ID by client: undefined when unknown (not loaded), null when not registered.
  registrations: Partial<Record<string, string | null>>;
  registrationErrors: Partial<Record<string, boolean>>;
  // Keycloak internal ID (UUID) by client, used to link to the client in the admin console.
  keycloakUuids: Partial<Record<string, string>>;
  busyClients: Partial<Record<string, boolean>>;
}

export const TOKEN_HANDLER_INIT: TokenHandlerState = {
  clients: null,
  registrations: {},
  registrationErrors: {},
  keycloakUuids: {},
  busyClients: {},
};
