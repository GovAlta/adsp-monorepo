module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Task Service',
    version: '0.0.0',
    description: 'The Task Service provides a model for tasks, queues, and work assignment.',
  },
  tags: [],
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
