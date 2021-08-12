module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Configuration Service',
    version: '0.0.0',
    description:
      'The Configuration Service provides persistence for service configuration with write schema validation.',
  },
  tags: [
    {
      name: 'Configuration',
      description: 'API to store and read service configuration.',
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
