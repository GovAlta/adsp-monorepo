import Keycloak, { KeycloakConfig, KeycloakInstance } from 'keycloak-js';
export let keycloak: KeycloakInstance;

export let keycloakAuth: KeycloakAuth = null;

const LOGOUT_REDIRECT = '/logout-redirect';

export const LOGIN_TYPES = {
  tenantAdmin: 'tenant-admin',
  tenantCreationInit: 'tenant-creation-init',
  tenant: 'tenant',
};

export const createKeycloakAuth = (config: KeycloakConfig, loginRedirectUrl?: string): void => {
  keycloakAuth = new KeycloakAuth(config, loginRedirectUrl);
};

type checkSSOSuccess = (keycloak: KeycloakInstance) => void;

type checkSSOError = () => void;

class KeycloakAuth {
  config: KeycloakConfig;
  keycloak: KeycloakInstance;
  loginRedirect: string;
  logoutRedirect: string;

  constructor(config: KeycloakConfig, loginRedirectUrl?: string) {
    this.config = config;
    this.keycloak = this.initKeycloak();
    this.loginRedirect = loginRedirectUrl;
    this.logoutRedirect = `${window.location.origin}${LOGOUT_REDIRECT}`;
  }

  initKeycloak() {
    // TODO: find the right type for keycloak
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (Keycloak as any)(this.config);
  }

  updateRealm(realm: string) {
    this.config.realm = realm;
  }

  getRealm() {
    return this.config.realm;
  }

  updateRealmWithInit(realm: string) {
    if (realm !== this.config.realm) {
      this.updateRealm(realm);
      this.keycloak = this.initKeycloak();
    }
  }

  loginByCore(type: string) {
    const location: string = window.location.href;
    const skipSSO = location.indexOf('kc_idp_hint') > -1;
    const urlParams = new URLSearchParams(window.location.search);
    const idpFromUrl = encodeURIComponent(urlParams.get('kc_idp_hint'));
    const code = encodeURIComponent(urlParams.get('code'));
    let redirectUri = `${this.loginRedirect}?type=${type}&realm=core`;

    if (code) {
      redirectUri += `&code=${code}`;
    }

    try {
      this.updateRealmWithInit('core');

      if (skipSSO && !idpFromUrl) {
        redirectUri += `&kc_idp_hint=`;
        Promise.all([this.keycloak.init({}), this.keycloak.login({ idpHint: ' ', redirectUri })]);
      } else {
        if (idpFromUrl) {
          redirectUri += `&kc_idp_hint=${idpFromUrl}`;
        }

        this.keycloak
          .init({ onLoad: 'login-required', redirectUri })
          .then((authenticated) => {
            if (authenticated) {
              console.debug(`Keycloak IdP login is successful`);
            }
          })
          .catch((e) => {
            console.error(`Failed to login`, e);
          });
      }
    } catch (e) {
      console.error(`Failed to login`, e);
    }
  }

  logout() {
    this.keycloak.logout({ redirectUri: this.logoutRedirect });
  }

  checkSSO(successHandler: checkSSOSuccess, errorHandler: checkSSOError) {
    try {
      this.keycloak
        .init({ onLoad: 'check-sso' })
        .then((authenticated: boolean) => {
          if (authenticated) {
            this.keycloak
              .loadUserInfo()
              .then(() => {
                successHandler(this.keycloak);
              })
              .catch((e) => {
                console.error('failed loading user info', e);
                errorHandler();
              });
          } else {
            console.error('Unauthorized');
            errorHandler();
          }
        })
        .catch(() => {
          console.error('failed to initialize');
          errorHandler();
        });
    } catch (e) {
      console.error('failed to initialize', e);
      errorHandler();
    }
  }

  loginByIdP(idp: string, realm: string) {
    this.updateRealmWithInit(realm);

    const location: string = window.location.href;
    const skipSSO = location.indexOf('kc_idp_hint') > -1;

    const urlParams = new URLSearchParams(window.location.search);
    const idpFromUrl = urlParams.has('kc_idp_hint') ? encodeURIComponent(urlParams.get('kc_idp_hint')) : null;
    const code = encodeURIComponent(urlParams.get('code'));
    const smscode = encodeURIComponent(urlParams.get('smscode'));

    let redirectUri = `${this.loginRedirect}/${realm}`;
    console.debug(`Keycloak redirect URL: ${redirectUri}`);

    if (skipSSO && !idpFromUrl) {
      // kc_idp_hint with empty value, skip checkSSO
      Promise.all([
        this.keycloak.init({ checkLoginIframe: false }),
        this.keycloak.login({ idpHint: ' ', redirectUri }),
      ]);
    } else {
      /**
       * Paul Li - Tried to use keycloak.init().then(()=>{keycloak.login}). But, it does not work.
       */

      let paramCount = 0;

      if (idpFromUrl) {
        idp = idpFromUrl;
        if (idp !== 'null') {
          redirectUri += `?kc_idp_hint=${idp}`;
          paramCount += 1;
        }
      } 

      if (code && code !== 'null') {
        redirectUri = redirectUri + (paramCount > 0 ? '&' : '?');
        redirectUri += `code=${code}`;
        paramCount += 1;
      }
      if (smscode && smscode !== 'null') {
        redirectUri = redirectUri + (paramCount > 0 ? '&' : '?');
        redirectUri += `smscode=${smscode}`;
      }

      Promise.all([
        this.keycloak.init({ checkLoginIframe: false }),
        this.keycloak.login({ idpHint: idp, redirectUri }),
      ]);
    }
  }

  refreshToken(successHandler: checkSSOSuccess, errorHandler: checkSSOError) {
    try {
      this.keycloak
        .updateToken(70)
        .then(() => {
          successHandler(this.keycloak);
          console.debug('Keycloak token was refreshed');
        })
        .catch((e) => {
          errorHandler();
          console.error(`Failed to refresh the keycloak token: ${e.message}`);
        });
    } catch (e) {
      console.error(`Failed to refresh the keycloak token: ${e.message}`);
    }
  }
}

export function createKeycloakInstance(config: KeycloakConfig): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keycloak = new (Keycloak as any)(config);
}
