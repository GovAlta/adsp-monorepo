module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Feedback service',
    version: '0.0.0',
    description: 'Feedback service allows users to submit feedback regarding a service interaction.',
  },
  tags: [
    {
      name: 'Feedback',
      description: 'API to send feedback.',
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
