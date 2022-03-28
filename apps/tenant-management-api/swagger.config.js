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
      name: 'Directory service',
      description: 'Directory API to read and update the directory of services.',
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
