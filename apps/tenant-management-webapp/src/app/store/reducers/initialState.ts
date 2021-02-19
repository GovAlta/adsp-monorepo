/**
 * isActive - whether the file service is ready
 * isDisabled - whether the server is enabled by user or admin
 */

import { Keycloak } from "../actions/config";

export interface AppState {
  tenant: { file: FileServiceState };
  user: UserState;
  config: ConfigState;
}

interface FileServiceState {
  status: {
    isActive: boolean;
    isDisabled: boolean;
  };
  requirements: {
    setup: boolean;
  };
  states: {
    activeTab: string;
  };
  spaces: string[];
}

interface FileServiceConfigState {
  host: string;
  endpoints: {
    spaceAdmin: string;
  };
}

interface UserState {
  jwt: {
    exp: number;
    token: string;
  };
  authenticated: boolean;
  roles: string[];
  username: string;
  keycloak: string;
}

interface ConfigState {
  keycloak: Keycloak;
  fileService: FileServiceConfigState;
}

const FILE_INIT: FileServiceState = {
  status: {
    isActive: true,
    isDisabled: true,
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

const USER: UserState = {
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
const INIT_STATE: AppState = {
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
