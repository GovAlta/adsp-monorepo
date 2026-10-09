import { AdspId, User } from '@abgov/adsp-service-sdk';

export interface UserSessionData extends User {
  accessToken: string;
  refreshToken: string;
  // ID token from login, which identifies the session when logging out of access service.
  idToken?: string;
  exp: number;
  refreshExp: number;
  authenticatedBy: string;
}

export type Prompt = 'none' | 'login' | 'consent' | 'select_account';
export interface Client {
  tenantId: AdspId;
  id: string;
  name: string;
  idpHint?: string;
  prompt?: Prompt;
  scope?: string | string[];
  authCallbackUrl?: string;
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
  // Whether logout also ends the session in access service; requires post logout redirect URIs on the client.
  keycloakLogout?: boolean;
  targets: Record<string, Target>;
}

export interface ClientCredentials {
  realm: string;
  clientId: string;
  clientSecret: string;
  registrationUrl: string;
  registrationToken: string;
}

export interface Target {
  id: string;
  upstream: AdspId;
}
