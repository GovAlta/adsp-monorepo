module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Token handler',
    version: '0.0.0',
    description: 'Token handler pattern as a service.',
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
