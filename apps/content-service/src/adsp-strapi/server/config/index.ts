export default {
  default: ({ env }) => ({
    clientId: env('CLIENT_ID'),
    clientSecret: env('CLIENT_SECRET'),
    directoryUrl: env('DIRECTORY_URL'),
    accessServiceUrl: env('KEYCLOAK_ROOT_URL'),
    displayName: 'Service display name',
    description: 'Service description',
  }),
  validator() {},
};
