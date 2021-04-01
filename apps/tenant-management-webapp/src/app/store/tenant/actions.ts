import { Tenant } from './models';

export const FETCH_TENANT = 'FETCH_TENANT';
const SELECT_TENANT = 'SELECT_TENANT';
const FETCH_TENANT_SUCCESS = 'FETCH_TENANT_SUCCESS';
const UPDATE_TENANT_ADMIN_INFO = 'UPDATE_TENANT_ADMIN_INFO';
export const CREATE_TENANT = 'FETCH_TENANT';
const CREATE_TENANT_SUCCESS = 'CREATE_TENANT_SUCCESS';
export const CHECK_IS_TENANT_ADMIN = 'CHECK_IS_ADMIN';
export const LOGOUT_TENANT = 'LOGOUT_TENANT';

interface SelectTenantAction {
  type: typeof SELECT_TENANT;
  payload: string;
}

interface LogoutTenantAction {
  type: typeof LOGOUT_TENANT;
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
  payload: boolean;
}

interface CreateTenantSuccessAction {
  type: typeof CREATE_TENANT_SUCCESS;
  payload: boolean;
}

export type ActionType =
  | FetchTenantAction
  | FetchTenantSuccessAction
  | CreateTenantAction
  | CheckIsTenantAdminAction
  | CreateTenantSuccessAction
  | SelectTenantAction
  | LogoutTenantAction
  | UpdateTenantAdminInfoAction;

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
  type: 'FETCH_TENANT',
  payload: tenantName,
});

export const IsTenantAdmin = (email: string): CheckIsTenantAdminAction => ({
  type: 'CHECK_IS_ADMIN',
  payload: email,
});

export const UpdateTenantAdminInfo = (isAdmin: boolean): UpdateTenantAdminInfoAction => ({
  type: 'UPDATE_TENANT_ADMIN_INFO',
  payload: isAdmin,
});

export const CreateTenantSuccess = (): CreateTenantSuccessAction => ({
  type: 'CREATE_TENANT_SUCCESS',
  payload: true,
});

export const TenantLogout = (): LogoutTenantAction => ({
  type: 'LOGOUT_TENANT',
});
