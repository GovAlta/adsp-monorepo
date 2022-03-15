import { Session } from '@store/session/models';
import { KeycloakInstance } from 'keycloak-js';

export function convertToSession(kc: KeycloakInstance): Session {
  return {
    authenticated: kc.authenticated,
    clientId: kc.clientId,
    realm: kc.realm,
    userInfo: {
      sub: kc.userInfo?.['sub'],
      email: kc.userInfo?.['email'],
      name: kc.userInfo?.['name'],
      preferredUsername: kc.userInfo?.['preferred_username'],
      emailVerified: kc.userInfo?.['email_verified'],
    },
    realmAccess: kc.realmAccess,
    resourceAccess: kc.resourceAccess,
    credentials: {
      token: kc.token,
      tokenExp: kc.tokenParsed.exp,
      refreshToken: kc.refreshToken,
      refreshTokenExp: kc.refreshTokenParsed.exp,
    },
  };
}
