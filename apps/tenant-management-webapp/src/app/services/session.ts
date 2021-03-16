import Keycloak, { KeycloakConfig, KeycloakInstance } from 'keycloak-js';
import { Credentials, Session } from '../store/session/models';

type onSuccessFn = (session: Session) => void;
type onErrorFn = (err: string) => void;

export let keycloak: KeycloakInstance;

export function getToken(): string {
  return keycloak?.token ?? '';
}

export async function refreshToken(): Promise<[boolean, Credentials]> {
  if (!keycloak) {
    console.error('keycloak has not been instantiated');
    return;
  }
  // refresh the token if less than 60s are left
  const refreshed = await keycloak.updateToken(60);
  const credentials = {
    token: keycloak.token,
    tokenExp: keycloak.tokenParsed.exp,
    refreshToken: keycloak.refreshToken,
    refreshTokenExp: keycloak.refreshTokenParsed.exp,
  };
  return [refreshed, credentials];
}

export function isAuthenticated(): boolean {
  return keycloak?.authenticated ?? false;
}

export function login(config: KeycloakConfig, onSuccess: onSuccessFn, onError: onErrorFn) {
  keycloak = keycloak || Keycloak(config);
  keycloak.init({ onLoad: 'login-required' }).then((authenticated) => {
    if (authenticated) {
      keycloak.loadUserInfo().then(() => onSuccess(mapKeyCloakToSession(keycloak)));
    } else {
      onError('Failed to authenticate');
    }
  });
}

function mapKeyCloakToSession(kc: KeycloakInstance): Session {
  return {
    authenticated: kc.authenticated,
    clientId: kc.clientId,
    realm: kc.realm,
    userInfo: {
      email: kc.userInfo['email'],
      name: kc.userInfo['name'],
      preferredUsername: kc.userInfo['preferred_username'],
      emailVerified: kc.userInfo['email_verified'],
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
