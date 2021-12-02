import { ConfigState, CONFIG_INIT } from './models';
import { ActionTypes } from './actions';

export default function (state: ConfigState = CONFIG_INIT, action: ActionTypes): ConfigState {
  switch (action.type) {
    case 'config/fetch-config-success':
      return {
        ...state,
        ...action.payload,
        keycloakApi: {
          realm: 'core',
          url: 'https://access-dev.os99.gov.ab.ca/auth',
          clientId: 'urn:ads:platform:tenant-admin-app',
          checkLoginIframe: false,
        },
        tenantApi: {
          host: 'https://tenant-management-api-core-services-dev.os99.gov.ab.ca',
          endpoints: {
            spaceAdmin: '/api/file/v1/space',
            createTenant: '/api/tenant/v1',
            tenantNameByRealm: '/api/tenant/v1/realm',
            tenantByName: '/api/tenant/v1/name',
            tenantByEmail: '/api/tenant/v1/email',
            tenantConfig: '/api/configuration/v1/tenantConfig',
          },
        },
      };

    case 'config/update-config-realm':
      return {
        ...state,
        keycloakApi: {
          ...state.keycloakApi,
          realm: action.payload,
        },
      };

    case 'config/logout':
      return {
        ...state,
        keycloakApi: {
          ...state.keycloakApi,
          realm: 'core',
        },
      };

    default:
      return state;
  }
}
