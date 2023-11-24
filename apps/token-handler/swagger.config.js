module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Token handler',
    version: '0.0.0',
    description:
      'Token handler pattern as a service. ' +
      'This service provides authentication and a proxy to other services. ' +
      'Most endpoints are not RESTful, and OpenAPI docs are for reference only.',
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
