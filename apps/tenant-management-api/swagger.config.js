module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Tenant management service',
    version: '0.0.0',
    description:
      'The tenant management service includes APIs for common platform capabilities like retrieving tenant information.',
  },
  tags: [
    {
      name: 'Tenant service',
      description: 'Tenant API to store and read tenant information.',
    },
    {
      name: 'Realm',
      description: 'Client secret rotation mode and schedule of a realm.',
    },
    {
      name: 'Client',
      description: 'Clients of a realm and their secret rotation status and actions.',
    },
  ],
  components: {
    securitySchemes: {
      accessToken: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ accessToken: [] }],
};
