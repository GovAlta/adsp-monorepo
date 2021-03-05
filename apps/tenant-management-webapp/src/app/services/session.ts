import Keycloak, { KeycloakConfig, KeycloakInstance } from 'keycloak-js';

type onSuccessFn = (session: KeycloakInstance) => void;
type onErrorFn = (err: string) => void;

export let keycloak: KeycloakInstance;

export function getToken(): string {
  return keycloak?.token ?? ''
}

export function isAuthenticated(): boolean {
  return keycloak?.authenticated ?? false;
}

export function login(config: KeycloakConfig, onSuccess: onSuccessFn, onError: onErrorFn) {
  keycloak = Keycloak(config);
  keycloak.init({ onLoad: 'login-required' }).then((authenticated) => {
    if (authenticated) {
      keycloak.loadUserInfo().then(() => onSuccess(keycloak))
      keycloak.updateToken(30)
    } else {
      onError('Failed to authenticate');
    }
  });
}

export function logout() {
  if (keycloak?.authenticated) {
    keycloak.logout();
  }
}
