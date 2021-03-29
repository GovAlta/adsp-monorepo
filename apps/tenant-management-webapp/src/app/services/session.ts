import Keycloak, { KeycloakConfig, KeycloakInstance } from 'keycloak-js';
import { Session } from '../store/session/models';

export let keycloak: KeycloakInstance;

export function createKeycloakInstance(config: KeycloakConfig) {
  keycloak = Keycloak(config);
}

export function convertToSession(kc: KeycloakInstance): Session {
  return {
    authenticated: kc.authenticated,
    clientId: kc.clientId,
    realm: kc.realm,
    userInfo: {
      email: kc.userInfo?.['email'],
      name: kc.userInfo?.['name'],
      preferredUsername: kc.userInfo?.['preferred_username'],
      emailVerified: kc.userInfo?.['email_verified'],
    },
    realmAccess: kc.realmAccess,
    credentials: {
      token: kc.token,
      tokenExp: kc.tokenParsed.exp,
      refreshToken: kc.refreshToken,
      refreshTokenExp: kc.refreshTokenParsed.exp,
    },
  };
}

export function logout() {
  if (keycloak?.authenticated) {
    keycloak.logout();
  }
}
