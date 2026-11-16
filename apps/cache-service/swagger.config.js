module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Cache service',
    version: '0.0.0',
    description: 'Cache service provides a read through http request cache.',
  },
  tags: [
    {
      name: 'Cache',
      description: 'Read through cache for upstream services and APIs.',
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
