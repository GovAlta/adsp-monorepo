module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Form service',
    version: '1.0.0',
    description: '',
  },
  tags: [
    {
      name: 'Form',
      description: 'API to managed forms.',
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
