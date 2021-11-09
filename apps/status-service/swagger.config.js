module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Status service',
    version: '0.0.0',
    description: 'The status service provides the capability to publish service status information. ',
  },
  tags: [
    {
      name: 'Subscription',
      description: 'API to managed subscribers and subscriptions.',
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
