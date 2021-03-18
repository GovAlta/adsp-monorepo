import { Tenant } from './models';

export const FETCH_TENANT = 'FETCH_TENANT';
const FETCH_TENANT_SUCCESS = 'FETCH_TENANT_SUCCESS';
const UPDATE_TENANT_ADMIN_INFO = 'UPDATE_TENANT_ADMIN_INFO';
export const CREATE_TENANT = 'FETCH_TENANT';
const CREATE_TENANT_SUCCESS = 'CREATE_TENANT_SUCCESS';
export const CHECK_IS_TENANT_ADMIN = 'CHECK_IS_ADMIN';

interface FetchTenantAction {
  type: typeof FETCH_TENANT;
  payload: string;
}

interface FetchTenantSuccessAction {
  type: typeof FETCH_TENANT_SUCCESS;
  payload: Tenant;
}

interface CreateTenantAction {
  type: typeof CREATE_TENANT;
  payload: string;
}

interface CheckIsTenanAdminAction {
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
  | CheckIsTenanAdminAction
  | CreateTenantSuccessAction
  | UpdateTenantAdminInfoAction;

export const FetchTenant = (realm: string): FetchTenantAction => {
  return {
    type: FETCH_TENANT,
    payload: realm,
  };
};

export const FetchTenantSuccess = (tenant: Tenant): FetchTenantSuccessAction => ({
  type: FETCH_TENANT_SUCCESS,
  payload: tenant,
});

export const CreateTenant = (tenantName: string): CreateTenantAction => ({
  type: CREATE_TENANT,
  payload: tenantName,
});

export const IsTenantAdmin = (email: string): CheckIsTenanAdminAction => ({
  type: CHECK_IS_TENANT_ADMIN,
  payload: email,
});

export const UpdateTenantAdminInfo = (isAdmin: boolean): UpdateTenantAdminInfoAction => ({
  type: UPDATE_TENANT_ADMIN_INFO,
  payload: isAdmin,
});

export const CreateTenantSuccess = (isCreated: boolean): CreateTenantSuccessAction => ({
  type: CREATE_TENANT_SUCCESS,
  payload: isCreated,
});
