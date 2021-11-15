module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Value service',
    version: '0.0.0',
    description: 'The Value service provides a time-series append only store for json documents.',
  },
  tags: [
    {
      name: 'Value',
      description: 'API to store and retrieve values.',
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
