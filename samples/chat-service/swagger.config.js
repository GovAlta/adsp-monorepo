module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Chat service',
    version: '1.0.0',
    description: 'Chat service provides real-time chat.',
  },
  tags: [
    {
      name: 'Chat',
      description: 'API to access rooms, read and send messages.',
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
