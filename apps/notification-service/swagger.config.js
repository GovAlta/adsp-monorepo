module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Notification service',
    version: '0.0.0',
    description:
      'The notification service provides the capability to define notification types and manage subscriptions.',
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
