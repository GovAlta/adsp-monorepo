const envPath = __dirname + '/.env';
const ENVS = require('dotenv').config({ path: envPath });

const tenant = 'autotest';
let keycloakRoot = 'https://access-dev.os99.gov.ab.ca';

if (ENVS && ENVS.parsed && ENVS.parsed.KEYCLOAK_ROOT_URL) {
  keycloakRoot = ENVS.parsed.KEYCLOAK_ROOT_URL;
}

module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Tenant Management API',
    version: '0.0.0',
    description: 'The tenant management api is an api for managing tenant information.',
  },
  components: {
    securitySchemes: {
      platformAdmin: {
        type: 'oauth2',
        description: 'Authentication flow for platform admin',
        flows: {
          password: {
            tokenUrl: `${keycloakRoot}/auth/realms/core/protocol/openid-connect/token`,
            clientId: 'tenant-api',
            scopes: {
              email: '',
            },
          },
        },
      },
      tenantInit: {
        type: 'oauth2',
        description: 'Authentication flow for tenant login through GoA SSO in core realm.',
        flows: {
          authorizationCode: {
            authorizationUrl: `${keycloakRoot}/auth/realms/core/protocol/openid-connect/auth`,
            tokenUrl: `${keycloakRoot}/auth/realms/core/protocol/openid-connect/token`,
            scopes: {
              email: '',
            },
          },
        },
      },

      tenant: {
        type: 'oauth2',
        description: 'Authentication flow for tenant login through GoA SSO in tenant realm.',
        flows: {
          authorizationCode: {
            authorizationUrl: `${keycloakRoot}/auth/realms/${tenant}/protocol/openid-connect/auth`,
            tokenUrl: `${keycloakRoot}/auth/realms/${tenant}/protocol/openid-connect/token`,
            scopes: {
              email: '',
            },
          },
        },
      },
    },
  },
  security: [
    {
      platformAdmin: ['email'],
      tenantInit: ['email'],
      tenant: ['email'],
    },
  ],
};
