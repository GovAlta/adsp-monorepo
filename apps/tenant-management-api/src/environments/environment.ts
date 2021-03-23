const env = process.env;

export const environment = {
  MONGO_URI: 'mongodb://localhost:27017',
  MONGO_DB: 'tenantDb',
  MONGO_USER: null,
  MONGO_PASSWORD: null,
  KEYCLOAK_ROOT_URL: 'https://access-dev.os99.gov.ab.ca',
  KEYCLOAK_REALM: 'core',
  KEYCLOAK_ADMIN_CLIENT_ID: 'admin-cli',
  KEYCLOAK_CLIENT_ID: 'tenant-admin-backend-dev-qa',
  KEYCLOAK_CLIENT_SECRET: '767995af-158a-43b2-aa1f-dd7cd9ba4ffc',
  REALM_ADMIN_USERNAME: 'admin_dev',
  REALM_ADMIN_PASSWORD: 'llZgcQyN+rrEjCEe8lfbTA==',
  KEYCLOAK_CORE_TOKEN_URL: 'https://access-dev.os99.gov.ab.ca/auth/realms/core/protocol/openid-connect/token',
  KEYCLOAK_CORE_AUTH_URL: 'https://access-dev.os99.gov.ab.ca/auth/realms/core/protocol/openid-connect/auth',
  KEYCLOAK_CORE_CLIENT_SECRET: 'b8fafee1-455a-43a0-a141-3b93fc853cb0',
  KEYCLOAK_CORE_BROKER_CLIENT_ID: 'b85e98c4-2793-4509-9f80-57c4e5b4125e',
  ...env,
  production: env.NODE_ENV === 'production',
  LOG_LEVEL: 'debug',

  CONFIG_SRV_PORT: 3340,
};
