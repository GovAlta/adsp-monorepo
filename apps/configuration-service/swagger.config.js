module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Configuration Service',
    version: '2.0.0',
    description: 'The Configuration Service provides persistence for configuration with write schema validation.',
  },
  tags: [
    {
      name: 'Configuration',
      description: 'API to store and read configuration.',
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
