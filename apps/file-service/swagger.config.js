const tenant = 'autotest';

//<KEYCLOAK_ROOT> is the in-house defined tag, which will be updated in the main.ts
module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'File Service',
    version: '0.0.0',
    description:
      'The file service provides the capability to upload and download files. ' +
      'Consumers are registered with their own space (tenant) containing file types that include ' +
      'role based access policy, and can associate files to domain records.',
  },
  tags: [
    {
      name: 'File Space',
      description: 'API to manage spaces (tenants) in the file service.',
    },
    {
      name: 'File Administration',
      description: 'API to administer a particular space including management of file types.',
    },
    {
      name: 'File',
      description: 'API to upload and download files.',
    },
    {
      name: 'File Type',
      description: 'API to manage the file type.',
    },
  ],
  components: {
    securitySchemes: {
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
      platformFileServiceAdmin: {
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
    },
  },
  security: [
    {
      tenant: ['email'],
      platformFileServiceAdmin: ['email'],
    },
  ],
};
