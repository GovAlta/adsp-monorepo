const env = process.env;

export const environment = {
  MONGO_URI: 'mongodb://localhost:27017',
  MONGO_DB: 'tenantDb',
  MONGO_USER: null,
  MONGO_PASSWORD: null,
  KEYCLOAK_ROOT_URL: 'https://access-dev.os99.gov.ab.ca',
  KEYCLOAK_REALM: 'core',
  KEYCLOAK_CLIENT_ID: 'admin-cli',
  REALM_ADMIN_USERNAME: 'admin_dev',
  REALM_ADMIN_PASSWORD: 'llZgcQyN+rrEjCEe8lfbTA==',
  ...env,
  production: env.NODE_ENV === 'production',
  LOG_LEVEL: 'debug',

  CONFIG_SRV_PORT: 3340,
};
