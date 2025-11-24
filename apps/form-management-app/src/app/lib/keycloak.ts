import { Session } from '../state/types';
import Keycloak, { KeycloakConfig, KeycloakInitOptions } from 'keycloak-js';

const LOGOUT_REDIRECT = '/logout-redirect';
const LOGIN_REDIRECT = '/login-redirect';

export const MAX_ALLOWED_IDLE_IN_MINUTE = 28;
export const REFRESH_TOKEN_EXPIRY_IN_MINUTE = 30;

export enum LOGIN_TYPES {
  tenantAdmin = 'tenant-admin',
  tenantCreationInit = 'tenant-creation-init',
  tenant = 'tenant',
}

export let authInstance: KeycloakAuthImpl = null;
export const getOrCreateKeycloakAuth = async (config: KeycloakConfig, realm: string): Promise<KeycloakAuth> => {
  if (!realm) {
    throw new Error('Realm value not set on keycloak retrieval.');
  }

  // Lazy create singleton and reinitialize if realm changes
  if (!authInstance) {
    authInstance = new KeycloakAuthImpl(config);
  }
  await authInstance.initialize(realm);

  return authInstance;
};

export const getIdpHint = () => {
  const location: string = window.location.href;
  const urlParams = new URLSearchParams(window.location.search);
  const skipSSO = location.indexOf('kc_idp_hint') > -1 && urlParams.get('kc_idp_hint') !== 'null';
  if (skipSSO) {
    const idpFromUrl = encodeURIComponent(urlParams.get('kc_idp_hint'));
    return idpFromUrl;
  }

  return null;
};

export interface KeycloakAuth {
  loginByCore(type: string, idpHint: string | null): Promise<void>;
  loginByTenant(idp: string): Promise<void>;
  logout(): Promise<void>;
  checkSSO(): Promise<Session>;
  refreshToken(): Promise<Session>;
}

class KeycloakAuthImpl implements KeycloakAuth {
  config: KeycloakConfig & KeycloakInitOptions;
  loginRedirect: string;
  logoutRedirect: string;

  keycloak: Keycloak;

  constructor(config: KeycloakConfig & KeycloakInitOptions) {
    this.config = config;
    this.loginRedirect = `${window.location.origin}${LOGIN_REDIRECT}`;
    this.logoutRedirect = `${window.location.origin}${LOGOUT_REDIRECT}`;
  }

  public async initialize(realm: string) {
    if (realm !== this.keycloak?.realm) {
      this.keycloak = new Keycloak({ ...this.config, realm });
      await this.keycloak.init({ ...this.config, onLoad: 'check-sso' });
    }
  }

  async loginByCore(type: string, idpHint: string | null) {
    let redirectUri = `${this.loginRedirect}?type=${type}&realm=core`;
    try {
      if (idpHint === null) {
        await this.keycloak.login({ redirectUri });
      } else {
        redirectUri += `&kc_idp_hint=${idpHint}`;
        await this.keycloak.login({ idpHint: ' ', redirectUri });
      }
    } catch (e) {
      console.error(`Failed to login`, e);
    }
  }

  async logout() {
    await this.keycloak.logout({ redirectUri: this.logoutRedirect });
  }

  async checkSSO() {
    try {
      const authenticated = this.keycloak.authenticated;
      if (authenticated) {
        return this.convertToSession(this.keycloak);
      } else {
        return null;
      }
    } catch (e) {
      console.error('Failed to initialize', e);
      throw e;
    }
  }

  public getExpiryTime() {
    return this.keycloak.refreshTokenParsed.exp;
  }

  async loginByTenant(idp: string) {
    let redirectUri = `${this.loginRedirect}?realm=${this.keycloak.realm}&type=${LOGIN_TYPES.tenant}`;
    console.debug(`Keycloak redirect URL: ${redirectUri}`);
    redirectUri += `&kc_idp_hint=${idp}`;
    await this.keycloak.login({ idpHint: idp, redirectUri });
  }

  async refreshToken(): Promise<Session> {
    try {
      const refreshed = await this.keycloak.updateToken(60 * MAX_ALLOWED_IDLE_IN_MINUTE);
      if (refreshed) {
        console.debug('Keycloak token was refreshed');
        return this.convertToSession(this.keycloak);
      } else {
        return null;
      }
    } catch (e) {
      console.error(`Failed to refresh the keycloak token: ${e.message}`);
      throw e;
    }
  }

  private convertToSession(kc: Keycloak): Session {
    return {
      authenticated: kc.authenticated,
      clientId: kc.clientId,
      realm: kc.realm,
      userInfo: {
        sub: kc.tokenParsed?.['sub'],
        email: kc.tokenParsed?.['email'],
        name: kc.tokenParsed?.['name'],
        preferredUsername: kc.tokenParsed?.['preferred_username'],
        emailVerified: kc.tokenParsed?.['email_verified'],
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
}
