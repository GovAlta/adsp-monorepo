export interface TenantApi {
  host: string;
  endpoints: {
    spaceAdmin: string;
    createTenant: string;
    tenantNameByRealm: string;
    tenantByEmail: string;
  };
}

export interface KeycloakApi {
  realm: string;
  url: string;
  clientId: string;
  checkLoginIframe?: boolean;
  flow?: string;
}

export interface ServiceUrls {
  eventServiceUrl?: string;
  notificationServiceUrl?: string;
  keycloakUrl?: string;
  tenantManagementApi?: string;
  accessManagementApi?: string;
  uiComponentUrl?: string;
}

export interface ConfigState {
  keycloakApi: KeycloakApi;
  tenantApi: TenantApi;
  serviceUrls: ServiceUrls;
}

// TODO: [Feb-5-2021] Paul: need to fetch using configuration service and environment varaibles
const KEYCLOAK_INIT: KeycloakApi = {
  realm: 'core',
  url: 'https://access-dev.os99.gov.ab.ca/auth',
  clientId: 'tenant-platform-webapp',
  checkLoginIframe: false,
};

const TENANT_API_INIT: TenantApi = {
  host: 'https://tenant-management-api-core-services-dev.os99.gov.ab.ca',
  endpoints: {
    spaceAdmin: '/api/file/v1/space',
    createTenant: '/api/realm/v1',
    tenantNameByRealm: '/api/tenant/v1/realm',
    tenantByEmail: '/api/tenant/v1/email',
  },
};

export const CONFIG_INIT: ConfigState = {
  keycloakApi: KEYCLOAK_INIT,
  tenantApi: TENANT_API_INIT,
  serviceUrls: {},
};
