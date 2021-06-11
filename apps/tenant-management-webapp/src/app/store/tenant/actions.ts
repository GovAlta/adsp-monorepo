import { Tenant } from './models';

export const FETCH_TENANT = 'FETCH_TENANT';
const SELECT_TENANT = 'SELECT_TENANT';
const FETCH_TENANT_SUCCESS = 'FETCH_TENANT_SUCCESS';
const UPDATE_TENANT_ADMIN_INFO = 'UPDATE_TENANT_ADMIN_INFO';
export const CREATE_TENANT = 'CREATE_TENANT';
const CREATE_TENANT_SUCCESS = 'CREATE_TENANT_SUCCESS';
export const CHECK_IS_TENANT_ADMIN = 'CHECK_IS_ADMIN';
export const TENANT_ADMIN_LOGIN = 'TENANT_ADMIN_LOGIN';
export const TENANT_CREATION_LOGIN_INIT = 'TENANT_CREATION_LOGIN_INIT';
export const TENANT_LOGIN = 'TENANT_LOGIN';
export const KEYCLOAK_CHECK_SSO = 'KEYCLOAK_CHECK_SSO';
export const KEYCLOAK_CHECK_SSO_WITH_LOGOUT = 'KEYCLOAK_CHECK_SSO_WITH_LOGOUT';
export const KEYCLOAK_REFRESH_TOKEN = 'KEYCLOAK_REFRESH_TOKEN';
export const TENANT_LOGOUT = 'TENANT_LOGOUT';
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

interface UpdateTenantAdminInfoAction {
  type: typeof UPDATE_TENANT_ADMIN_INFO;
  payload: {
    isTenantAdmin: boolean;
    name: string;
    realm: string;
  };
}

interface CreateTenantSuccessAction {
  type: typeof CREATE_TENANT_SUCCESS;
  payload: string;
}
interface TenantLogin {
  type: typeof CREATE_TENANT_SUCCESS;
  payload: string;
}
export interface TenantAdminLoginAction {
  type: typeof TENANT_ADMIN_LOGIN;
}

export interface TenantCreationLoginInitAction {
  type: typeof TENANT_CREATION_LOGIN_INIT;
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

interface KeycloakRefreshTokenAction {
  type: typeof KEYCLOAK_REFRESH_TOKEN;
}

interface TenantLogoutAction {
  type: typeof TENANT_LOGOUT;
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
  | KeycloakRefreshTokenAction
  | TenantLogoutAction
  | KeycloakCheckSSOAction;

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

export const IsTenantAdmin = (email: string): CheckIsTenantAdminAction => ({
  type: 'CHECK_IS_ADMIN',
  payload: email,
});

export const TenantAdminLogin = (): TenantAdminLoginAction => ({
  type: 'TENANT_ADMIN_LOGIN',
});

export const TenantCreationLoginInit = (): TenantCreationLoginInitAction => ({
  type: 'TENANT_CREATION_LOGIN_INIT',
});

export const TenantLogin = (realm: string): TenantLoginAction => ({
  type: 'TENANT_LOGIN',
  payload: realm,
});

export const KeycloakCheckSSO = (realm: string): KeycloakCheckSSOAction => ({
  type: 'KEYCLOAK_CHECK_SSO',
  payload: realm,
});

export const KeycloakCheckSSOWithLogout = (realm: string): KeycloakCheckSSOWithLogOutAction => ({
  type: 'KEYCLOAK_CHECK_SSO_WITH_LOGOUT',
  payload: realm,
});

export const KeycloakRefreshToken = (): KeycloakRefreshTokenAction => ({
  type: 'KEYCLOAK_REFRESH_TOKEN',
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
