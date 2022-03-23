module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Tenant Management API',
    version: '0.0.0',
    description: 'The tenant management api is an api for managing tenant information.',
  },
  tags: [
    {
      name: 'Tenant Service',
      description: 'API to store and read discovery and tenant information.',
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
