import Keycloak, { KeycloakConfig, KeycloakInstance } from 'keycloak-js';
export let keycloak: KeycloakInstance;

export let keycloakAuth: KeycloakAuth = null;

const LOGOUT_REDIRECT = '/logout-redirect';

const LOGIN_REDIRECT = '/login-redirect';

export const LOGIN_TYPES = {
  tenantAdmin: 'tenant-admin',
  tenantCreationInit: 'tenant-creation-init',
  tenant: 'tenant',
};

export const createKeycloakAuth = (config: KeycloakConfig) => {
  keycloakAuth = new KeycloakAuth(config);
};

type checkSSOSuccess = (keycloak: KeycloakInstance) => void;

type checkSSOError = () => void;

class KeycloakAuth {
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

  initKeycloak() {
    // TODO: find the right type for keycloak
    return new (Keycloak as any)(this.config);
  }

  updateRealm(realm: string) {
    this.config.realm = realm;
  }

  getRealm() {
    return this.config.realm;
  }

  updateRealmWithInit(realm: string) {
    if (realm != this.config.realm) {
      this.updateRealm(realm);
      this.keycloak = this.initKeycloak();
    }
  }

  loginByCore(type: string) {
    const location: string = window.location.href;
    const skipSSO = location.indexOf('kc_idp_hint') > -1;
    const urlParams = new URLSearchParams(window.location.search);
    const idpFromUrl = urlParams.get('kc_idp_hint');
    let redirectUri = `${this.loginRedirect}?type=${type}&realm=core`;

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
                console.log('check-sso');
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
    const idpFromUrl = urlParams.get('kc_idp_hint');

    let redirectUri = `${this.loginRedirect}?realm=${realm}&type=${LOGIN_TYPES.tenant}`;
    console.debug(`Keycloak redirect URL: ${redirectUri}`);

    if (skipSSO && !idpFromUrl) {
      // kc_idp_hint with empty value, skip checkSSO
      redirectUri += `&kc_idp_hint=`;
      Promise.all([
        this.keycloak.init({ checkLoginIframe: false }),
        this.keycloak.login({ idpHint: ' ', redirectUri }),
      ]);
    } else {
      /**
       * Paul Li - Tried to use keycloak.init().then(()=>{keycloak.login}). But, it does not work.
       */

      if (idpFromUrl) {
        idp = idpFromUrl;
        redirectUri += `&kc_idp_hint=${idp}`;
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

export function createKeycloakInstance(config: KeycloakConfig) {
  keycloak = new (Keycloak as any)(config);
}
