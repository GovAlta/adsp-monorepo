module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Push service',
    version: '0.0.0',
    description:
      'The push service is a gateway for push mode connections to projections of domain events. ' +
      'Server side events and WebSockets are supported.',
  },
  tags: [
    {
      name: 'Stream',
      description: 'API to connect to streams.',
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
