import { TenantConfig } from './models';

export const FETCH_TENANT_CONFIG = 'FETCH_TENANT_CONFIG';
export const FETCH_TENANT_CONFIG_SUCCESS = 'FETCH_TENANT_CONFIG_SUCCESS';
export const FETCH_TENANT_CONFIG_FAILED = 'FETCH_TENANT_CONFIG_FAILED';

export const CREATE_TENANT_CONFIG = 'CREATE_TENANT_CONFIG';
export const CREATE_TENANT_CONFIG_SUCCESS = 'CREATE_TENANT_CONFIG_SUCCESS';
export const CREATE_TENANT_CONFIG_FAILED = 'CREATE_TENANT_CONFIG_FAILED';

export const UPDATE_TENANT_CONFIG = 'UPDATE_TENANT_CONFIG';
export const UPDATE_TENANT_CONFIG_SUCCESS = 'UPDATE_TENANT_CONFIG_SUCCESS';
export const UPDATE_TENANT_CONFIG_FAILED = 'UPDATE_TENANT_CONFIG_FAILED';

export type ActionTypes =
  | FetchTenantConfigAction
  | FetchTenantConfigSuccessAction
  | FetchTenantConfigFailedAction
  | CreateTenantConfigAction
  | CreateTenantConfigSuccessAction
  | CreateTenantConfigFailedAction
  | UpdateTenantConfigAction
  | UpdateTenantConfigSuccessAction
  | UpdateTenantConfigFailedAction;

interface FetchTenantConfigAction {
  type: typeof FETCH_TENANT_CONFIG;
}

interface FetchTenantConfigSuccessAction {
  type: typeof FETCH_TENANT_CONFIG_SUCCESS;
  payload: { tenantConfig: { data: string } };
}

interface FetchTenantConfigFailedAction {
  type: typeof FETCH_TENANT_CONFIG_FAILED;
  payload: { data: string };
}

interface CreateTenantConfigAction {
  type: typeof CREATE_TENANT_CONFIG;
}

interface CreateTenantConfigSuccessAction {
  type: typeof CREATE_TENANT_CONFIG_SUCCESS;
  payload: { tenantConfig: { data: string } };
}

interface CreateTenantConfigFailedAction {
  type: typeof CREATE_TENANT_CONFIG_FAILED;
  payload: { data: string };
}

export interface UpdateTenantConfigAction {
  type: typeof UPDATE_TENANT_CONFIG;
  payload: { data: TenantConfig };
}

interface UpdateTenantConfigSuccessAction {
  type: typeof UPDATE_TENANT_CONFIG_SUCCESS;
  payload: { tenantConfig: { data: string } };
}

interface UpdateTenantConfigFailedAction {
  type: typeof UPDATE_TENANT_CONFIG_FAILED;
  payload: { data: string };
}

export const FetchTenantConfigService = (): FetchTenantConfigAction => ({
  type: FETCH_TENANT_CONFIG,
});

export const FetchTenantConfigSuccessService = (tenantConfig: { data: string }): FetchTenantConfigSuccessAction => ({
  type: FETCH_TENANT_CONFIG_SUCCESS,
  payload: {
    tenantConfig,
  },
});

export const CreateTenantConfigService = (): CreateTenantConfigAction => ({
  type: CREATE_TENANT_CONFIG,
});

export const CreateTenantConfigSuccessService = (tenantConfig: { data: string }): CreateTenantConfigSuccessAction => ({
  type: CREATE_TENANT_CONFIG_SUCCESS,
  payload: {
    tenantConfig,
  },
});

export const UpdateTenantConfigService = (data: TenantConfig): UpdateTenantConfigAction => ({
  type: UPDATE_TENANT_CONFIG,
  payload: {
    data,
  },
});

export const UpdateTenantConfigSuccessService = (tenantConfig: { data: string }): UpdateTenantConfigSuccessAction => ({
  type: UPDATE_TENANT_CONFIG_SUCCESS,
  payload: {
    tenantConfig,
  },
});
