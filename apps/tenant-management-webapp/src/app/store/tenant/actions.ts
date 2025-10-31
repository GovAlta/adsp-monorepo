import { Dispatch } from '@reduxjs/toolkit';
import { Tenant, Role } from './models';
import { RootState } from '../index';
import { Credentials, Session } from '@store/session/models';
import { getOrCreateKeycloakAuth, KeycloakAuth } from '@lib/keycloak';
import { CredentialRefresh, SetSessionExpired } from '@store/session/actions';

export const FETCH_TENANT = 'FETCH_TENANT';
export const SELECT_TENANT = 'SELECT_TENANT';
export const FETCH_TENANT_SUCCESS = 'FETCH_TENANT_SUCCESS';
export const UPDATE_TENANT_ADMIN_INFO = 'UPDATE_TENANT_ADMIN_INFO';
export const CREATE_TENANT = 'CREATE_TENANT';
export const CREATE_TENANT_SUCCESS = 'CREATE_TENANT_SUCCESS';
export const CHECK_IS_TENANT_ADMIN = 'CHECK_IS_ADMIN';
export const TENANT_ADMIN_LOGIN = 'TENANT_ADMIN_LOGIN';
export const TENANT_CREATION_LOGIN_INIT = 'TENANT_CREATION_LOGIN_INIT';
export const TENANT_LOGIN = 'TENANT_LOGIN';
export const KEYCLOAK_CHECK_SSO = 'KEYCLOAK_CHECK_SSO';
export const KEYCLOAK_CHECK_SSO_WITH_LOGOUT = 'KEYCLOAK_CHECK_SSO_WITH_LOGOUT';
export const TENANT_LOGOUT = 'TENANT_LOGOUT';
export const UPDATE_TENANT_CREATED = 'UPDATE_TENANT_CREATED';
export const FETCH_REALM_ROLES = 'FETCH_REALM_ROLES';
export const FETCH_REALM_ROLES_SUCCESS = 'FETCH_REALM_ROLES_SUCCESS';
export const UPDATE_ACCESS_TOKEN = 'UPDATE_ACCESS_TOKEN';
export const DELETE_USER_IDP = 'DELETE_USER_IDP';
export const FETCH_USER_IDP_INFO = 'FETCH_USER_IDP_INFO';
export const FETCH_USER_ID_BY_EMAIL = 'FETCH_USER_INFO_BY_EMAIL';

/*
 * The tenant object has a boolean field to indicate whether or not a
 * user's login attempt was successful.  With an unsuccessful login
 * the user is redirected to the application's landing page.
 */
export const UPDATE_LOGIN_SUCCESS = 'UPDATE_LOGIN_SUCCESS';

interface SelectTenantAction {
  type: typeof SELECT_TENANT;
  payload: string;
}

export interface FetchTenantAction {
  type: typeof FETCH_TENANT;
  payload: string;
}

interface FetchTenantSuccessAction {
  type: typeof FETCH_TENANT_SUCCESS;
  payload: Tenant;
}

export interface CreateTenantAction {
  type: typeof CREATE_TENANT;
  payload: string;
}

export interface CheckIsTenantAdminAction {
  type: typeof CHECK_IS_TENANT_ADMIN;
  payload: string;
}

export interface UpdateTenantCreatedAction {
  type: typeof UPDATE_TENANT_CREATED;
}

export interface UpdateAccessTokenAction {
  type: typeof UPDATE_ACCESS_TOKEN;
}

interface UpdateTenantAdminInfoAction {
  type: typeof UPDATE_TENANT_ADMIN_INFO;
  payload: {
    isTenantAdmin: boolean;
    name: string;
    realm: string;
  };
}

export interface DeleteUserIdpAction {
  type: typeof DELETE_USER_IDP;
  userId: string;
  realm: string;
}

interface CreateTenantSuccessAction {
  type: typeof CREATE_TENANT_SUCCESS;
  payload: string;
}
export interface TenantAdminLoginAction {
  type: typeof TENANT_ADMIN_LOGIN;
  payload: string;
}

export interface UpdateLoginSuccessAction {
  type: typeof UPDATE_LOGIN_SUCCESS;
  payload?: boolean;
}

export interface TenantCreationLoginInitAction {
  type: typeof TENANT_CREATION_LOGIN_INIT;
  payload: string;
}

export interface KeycloakCheckSSOAction {
  type: typeof KEYCLOAK_CHECK_SSO;
  payload: string;
}

export interface KeycloakCheckSSOWithLogOutAction {
  type: typeof KEYCLOAK_CHECK_SSO_WITH_LOGOUT;
  payload: string;
}

export interface TenantLoginAction {
  type: typeof TENANT_LOGIN;
  payload: string;
}

interface TenantLogoutAction {
  type: typeof TENANT_LOGOUT;
}

interface FetchRealmRolesAction {
  type: typeof FETCH_REALM_ROLES;
}

interface FetchRealmRolesSuccessAction {
  type: typeof FETCH_REALM_ROLES_SUCCESS;
  payload: Role[];
}

export interface FetchUserIdpInfoAction {
  type: typeof FETCH_USER_IDP_INFO;
  email: string;
  realm: string;
}

export interface FetchUserIdByEmailAction {
  type: typeof FETCH_USER_ID_BY_EMAIL;
  email: string;
}

export type ActionType =
  | FetchTenantAction
  | FetchTenantSuccessAction
  | CreateTenantAction
  | CheckIsTenantAdminAction
  | CreateTenantSuccessAction
  | SelectTenantAction
  | UpdateTenantAdminInfoAction
  | TenantAdminLoginAction
  | TenantCreationLoginInitAction
  | TenantLoginAction
  | TenantLogoutAction
  | KeycloakCheckSSOAction
  | FetchRealmRolesAction
  | FetchRealmRolesSuccessAction
  | UpdateAccessTokenAction
  | UpdateTenantCreatedAction
  | DeleteUserIdpAction
  | FetchUserIdpInfoAction
  | FetchUserIdByEmailAction
  | UpdateLoginSuccessAction;

export const SelectTenant = (realm: string): SelectTenantAction => ({
  type: 'SELECT_TENANT',
  payload: realm,
});

export const FetchTenant = (realm: string): FetchTenantAction => ({
  type: 'FETCH_TENANT',
  payload: realm,
});

export const FetchTenantSuccess = (tenant: Tenant): FetchTenantSuccessAction => ({
  type: 'FETCH_TENANT_SUCCESS',
  payload: tenant,
});

export const CreateTenant = (tenantName: string): CreateTenantAction => ({
  type: 'CREATE_TENANT',
  payload: tenantName,
});

export const UpdateTenantCreated = (): UpdateTenantCreatedAction => ({
  type: 'UPDATE_TENANT_CREATED',
});

export const IsTenantAdmin = (email: string): CheckIsTenantAdminAction => ({
  type: 'CHECK_IS_ADMIN',
  payload: email,
});

export const TenantAdminLogin = (idpHint: string): TenantAdminLoginAction => ({
  type: 'TENANT_ADMIN_LOGIN',
  payload: idpHint,
});

export const TenantCreationLoginInit = (idpHint: string): TenantCreationLoginInitAction => ({
  type: 'TENANT_CREATION_LOGIN_INIT',
  payload: idpHint,
});

export const TenantLogin = (realm: string): TenantLoginAction => ({
  type: 'TENANT_LOGIN',
  payload: realm,
});

export const UpdateLoginSuccess = (value?: boolean): UpdateLoginSuccessAction => ({
  type: UPDATE_LOGIN_SUCCESS,
  payload: value,
});

export const KeycloakCheckSSO = (realm: string): KeycloakCheckSSOAction => ({
  type: 'KEYCLOAK_CHECK_SSO',
  payload: realm,
});

export const KeycloakCheckSSOWithLogout = (realm: string): KeycloakCheckSSOWithLogOutAction => ({
  type: 'KEYCLOAK_CHECK_SSO_WITH_LOGOUT',
  payload: realm,
});

export const UpdateTenantAdminInfo = (
  isAdmin: boolean,
  tenantName: string,
  tenantRealm: string
): UpdateTenantAdminInfoAction => ({
  type: 'UPDATE_TENANT_ADMIN_INFO',
  payload: {
    isTenantAdmin: isAdmin,
    name: tenantName,
    realm: tenantRealm,
  },
});

export const CreateTenantSuccess = (realm: string): CreateTenantSuccessAction => ({
  type: 'CREATE_TENANT_SUCCESS',
  payload: realm,
});

export const TenantLogout = (): TenantLogoutAction => ({
  type: 'TENANT_LOGOUT',
});

export const FetchRealmRoles = (): FetchRealmRolesAction => ({
  type: 'FETCH_REALM_ROLES',
});

export const FetchRealmRolesSuccess = (roles: Role[]): FetchRealmRolesSuccessAction => ({
  type: 'FETCH_REALM_ROLES_SUCCESS',
  payload: roles,
});

export const UpdateAccessToken = (): UpdateAccessTokenAction => ({
  type: 'UPDATE_ACCESS_TOKEN',
});

export const DeleteUserIdp = (userId: string, realm: string): DeleteUserIdpAction => ({
  type: 'DELETE_USER_IDP',
  userId,
  realm,
});

export const FetchUserIdPInfo = (email: string, realm: string): FetchUserIdpInfoAction => ({
  type: 'FETCH_USER_IDP_INFO',
  email,
  realm,
});

export const FetchUserIdByEmail = (email: string): FetchUserIdByEmailAction => ({
  type: 'FETCH_USER_INFO_BY_EMAIL',
  email,
});

export function getAccessToken(isForce = false) {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    const realmInSession = localStorage.getItem('realm');

    try {
      // Check if credentials still present or if logout has occurred.
      const state = getState();
      const credentials: Credentials = state.session.credentials;
      const isExpired = state.session.isExpired;

      // Check if token is within 1 min of expiry.
      if (credentials.tokenExp - Date.now() / 1000 < 60 || isForce) {
        const keycloakConfig = state.config.keycloakApi;
        const realm = state.tenant.realm;

        const keycloakAuth: KeycloakAuth = await getOrCreateKeycloakAuth(keycloakConfig, realm);
        const session: Session = await keycloakAuth.refreshToken();
        if (isExpired === true) {
          dispatch(SetSessionExpired(false));
        }
        if (session) {
          const { credentials } = session;
          dispatch(CredentialRefresh(credentials));

          return credentials.token;
        }
      } else {
        return credentials.token;
      }
    } catch (e) {
      // Failure to get the access token results in a logout.
      if (realmInSession) {
        dispatch(SetSessionExpired(true));
      } else {
        dispatch(TenantLogout());
      }
    }
  };
}
