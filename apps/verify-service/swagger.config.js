module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Verify Service',
    version: '0.0.0',
    description: '',
  },
  tags: [
    {
      name: 'Verify',
      description: 'API to generate and time limited verify codes.',
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
