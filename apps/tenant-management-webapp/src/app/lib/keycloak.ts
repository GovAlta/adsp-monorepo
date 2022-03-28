import { Session } from '@store/session/models';
import Keycloak, { KeycloakConfig, KeycloakInstance } from 'keycloak-js';

const LOGOUT_REDIRECT = '/logout-redirect';
const LOGIN_REDIRECT = '/login-redirect';

export enum LOGIN_TYPES {
  tenantAdmin = 'tenant-admin',
  tenantCreationInit = 'tenant-creation-init',
  tenant = 'tenant',
}

let authInstance: KeycloakAuthImpl = null;
export const createKeycloakAuth = (config: KeycloakConfig): KeycloakAuth => {
  // Lazy create singleton and reinitialize if realm changes ()
  if (!authInstance || authInstance.config.realm !== config.realm) {
    authInstance = new KeycloakAuthImpl(config);
  }
  return authInstance;
};

export interface KeycloakAuth {
  loginByCore(type: string): Promise<void>;
  loginByIdP(idp: string, realm: string): Promise<void>;
  logout(): Promise<void>;
  checkSSO(): Promise<Session>;
  refreshToken(): Promise<Session>;
}

class KeycloakAuthImpl implements KeycloakAuth {
  config: KeycloakConfig;
  keycloak: KeycloakInstance;
  loginRedirect: string;
  logoutRedirect: string;

  constructor(config: KeycloakConfig) {
    this.config = config;
    this.keycloak = this.initKeycloak();
    this.loginRedirect = `${window.location.origin}${LOGIN_REDIRECT}`;
    this.logoutRedirect = `${window.location.origin}${LOGOUT_REDIRECT}`;
  }

  private initKeycloak(realm?: string) {
    if (realm) {
      this.config.realm = realm;
    }
    return Keycloak(this.config);
  }

  private updateRealmWithInit(realm: string) {
    if (realm !== this.config.realm) {
      this.keycloak = this.initKeycloak(realm);
    }
  }

  async loginByCore(type: string) {
    const location: string = window.location.href;
    const skipSSO = location.indexOf('kc_idp_hint') > -1;
    const urlParams = new URLSearchParams(window.location.search);
    const idpFromUrl = urlParams.get('kc_idp_hint');
    let redirectUri = `${this.loginRedirect}?type=${type}&realm=core`;

    try {
      this.updateRealmWithInit('core');

      if (skipSSO && !idpFromUrl) {
        redirectUri += `&kc_idp_hint=`;
        await this.keycloak.init({});
        await this.keycloak.login({ idpHint: ' ', redirectUri });
      } else {
        if (idpFromUrl) {
          redirectUri += `&kc_idp_hint=${idpFromUrl}`;
        }

        const authenticated = await this.keycloak.init({ onLoad: 'login-required', redirectUri });
        if (authenticated) {
          console.debug(`Keycloak IdP login is successful`);
        }
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
      const authenticated = this.keycloak.authenticated || (await this.keycloak.init({ onLoad: 'check-sso' }));
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

  async loginByIdP(idp: string, realm: string) {
    this.updateRealmWithInit(realm);

    const location: string = window.location.href;
    const skipSSO = location.indexOf('kc_idp_hint') > -1;

    const urlParams = new URLSearchParams(window.location.search);
    const idpFromUrl = urlParams.get('kc_idp_hint');

    let redirectUri = `${this.loginRedirect}?realm=${realm}&type=${LOGIN_TYPES.tenant}`;
    console.debug(`Keycloak redirect URL: ${redirectUri}`);

    if (skipSSO && !idpFromUrl) {
      // kc_idp_hint with empty value, skip checkSSO
      redirectUri += `&kc_idp_hint=`;
      await this.keycloak.init({ checkLoginIframe: false });
      await this.keycloak.login({ idpHint: ' ', redirectUri });
    } else {
      /**
       * Paul Li - Tried to use keycloak.init().then(()=>{keycloak.login}). But, it does not work.
       */

      if (idpFromUrl) {
        idp = idpFromUrl;
        redirectUri += `&kc_idp_hint=${idp}`;
      }

      await this.keycloak.init({ checkLoginIframe: false });
      await this.keycloak.login({ idpHint: idp, redirectUri });
    }
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
