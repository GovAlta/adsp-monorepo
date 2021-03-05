import { Tenant } from "./models";

export const FETCH_TENANT= 'FETCH_TENANT';
const FETCH_TENANT_SUCCESS = 'FETCH_TENANT_SUCCESS';

interface FetchTenantAction {
  type: typeof FETCH_TENANT,
  payload: string,
}

interface FetchTenantSuccessAction {
  type: typeof FETCH_TENANT_SUCCESS,
  payload: Tenant
}

export type ActionType = FetchTenantAction | FetchTenantSuccessAction;

export const FetchTenant = (realm: string): FetchTenantAction => {
  return {
    type: FETCH_TENANT,
    payload: realm,
  };
};

export const FetchTenantSuccess = (tenant: Tenant): FetchTenantSuccessAction => ({
  type: FETCH_TENANT_SUCCESS,
  payload: tenant
})
