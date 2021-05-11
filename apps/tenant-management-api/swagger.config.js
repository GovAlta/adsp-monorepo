const tenant = 'autotest';

//<KEYCLOAK_ROOT> is the in-house defined tag, which will be updated in the main.ts
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
            tokenUrl: `<KEYCLOAK_ROOT>/auth/realms/core/protocol/openid-connect/token`,
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
            authorizationUrl: `<KEYCLOAK_ROOT>/auth/realms/core/protocol/openid-connect/auth`,
            tokenUrl: `<KEYCLOAK_ROOT>/auth/realms/core/protocol/openid-connect/token`,
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
            authorizationUrl: `<KEYCLOAK_ROOT>/auth/realms/${tenant}/protocol/openid-connect/auth`,
            tokenUrl: `<KEYCLOAK_ROOT>/auth/realms/${tenant}/protocol/openid-connect/token`,
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
