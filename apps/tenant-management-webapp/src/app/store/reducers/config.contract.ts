export interface TenantAPI {
  host: string;
  endpoints: {
    spaceAdmin: string;
    realmByTenantId: string;
  };
}

export interface Keycloak {
  realm: string;
  url: string;
  clientId: string;
  checkLoginIframe?: boolean;
  flow?: string;
}

export interface Config {
  keycloak: Keycloak;
  tenantAPI: TenantAPI;
}

// TODO: [Feb-5-2021] Paul: need to fetch using configuration service and environment varaibles
const KEYCLOAK_INIT: Keycloak = {
  realm: 'core',
  url: 'https://access-dev.os99.gov.ab.ca/auth',
  clientId: 'tenant-admin-frontend-qa',
  checkLoginIframe: false,
};

const TENANT_API_INIT: TenantAPI = {
  host: 'https://tenant-management-api-core-services-dev.os99.gov.ab.ca',
  endpoints: {
    spaceAdmin: '/api/file/v1/space',
    realmByTenantId: '/api/realm/v1',
  },
};

export const CONFIG_INIT: Config = {
  keycloak: KEYCLOAK_INIT,
  tenantAPI: TENANT_API_INIT,
};
