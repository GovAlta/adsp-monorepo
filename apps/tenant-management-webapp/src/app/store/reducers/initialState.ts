/**
 * isActive - whether the file service is ready
 * isDiable - whether the server is enabled by user or admin
 */

const FILE_INIT = {
  status: {
    isActive: true,
    isDisable: true,
  },
  requirements: {
    setup: false,
  },
  states: {
    activeTab: 'overall-view',
  },
  spaces: [],
};

// TODO: [Feb-5-2021] Paul: need to fetch using configuration service and environment varaibles
const KEYCLOAK_CONFIG = {
  realm: 'core',
  url: 'https://access-dev.os99.gov.ab.ca/auth/',
  clientId: 'tenant-admin-frontend-qa',
  checkLoginIframe: false,
};

const FILE_SERVICE_CONFIG = {
  host: 'https://tenant-management-api-core-services-dev.os99.gov.ab.ca',
  endpoints: {
    spaceAdmin: '/api/file/v1/space',
  },
};

// TODO: Use strong stype when the schema is stable
const USER = {
  jwt: {
    exp: 0,
    token: null,
  },
  authenticated: false,
  roles: [],
  username: 'Guest',
  keycloak: null,
};

// TODO: need to move then to Configuration Service later
const INIT_STATE = {
  tenant: {
    file: FILE_INIT,
  },
  user: USER,
  config: {
    keycloak: KEYCLOAK_CONFIG,
    fileService: FILE_SERVICE_CONFIG,
  },
};

export default INIT_STATE;
