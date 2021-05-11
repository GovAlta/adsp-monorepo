import { ActionTypes } from './actions';
import { TENANT_CONFIG_INIT, TenantConfig } from './models';

export default (state = TENANT_CONFIG_INIT, action: ActionTypes): TenantConfig => {
  switch (action.type) {
    case 'FETCH_TENANT_CONFIG_SUCCESS':
      return { ...state, ...action.payload.tenantConfig };

    case 'CREATE_TENANT_CONFIG_SUCCESS':
      return { ...state, ...action.payload.tenantConfig };

    case 'UPDATE_TENANT_CONFIG_SUCCESS':
      return { ...state, ...action.payload.tenantConfig };

    default:
      return state;
  }
};
