module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Event Service',
    version: '0.0.0',
    description: 'The event service provides the capability to send domain events.',
  },
  tags: [
    {
      name: 'Event',
      description: 'API to send events.',
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
