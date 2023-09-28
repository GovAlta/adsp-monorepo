import { Session } from '@store/session/models';
import Keycloak, { KeycloakConfig, KeycloakInitOptions, KeycloakInstance } from 'keycloak-js';

const LOGOUT_REDIRECT = '/logout-redirect';
const LOGIN_REDIRECT = '/login-redirect';

export enum LOGIN_TYPES {
  tenantAdmin = 'tenant-admin',
  tenantCreationInit = 'tenant-creation-init',
  tenant = 'tenant',
}

let authInstance: KeycloakAuthImpl = null;
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

  keycloak: KeycloakInstance;

  constructor(config: KeycloakConfig & KeycloakInitOptions) {
    this.config = config;
    this.loginRedirect = `${window.location.origin}${LOGIN_REDIRECT}`;
    this.logoutRedirect = `${window.location.origin}${LOGOUT_REDIRECT}`;
  }

  public async initialize(realm: string) {
    if (realm !== this.keycloak?.realm) {
      this.keycloak = Keycloak({ ...this.config, realm });
      await this.keycloak.init({ ...this.config });
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
      const authenticated =
        this.keycloak.authenticated || (await this.keycloak.init({ ...this.config, onLoad: 'check-sso' }));
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

  async loginByTenant(idp: string) {
    let redirectUri = `${this.loginRedirect}?realm=${this.keycloak.realm}&type=${LOGIN_TYPES.tenant}`;
    console.debug(`Keycloak redirect URL: ${redirectUri}`);
    redirectUri += `&kc_idp_hint=${idp}`;
    await this.keycloak.login({ idpHint: idp, redirectUri });
  }

  async refreshToken(): Promise<Session> {
    try {
      const refreshed = await this.keycloak.updateToken(60);
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

  private convertToSession(kc: KeycloakInstance): Session {
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
