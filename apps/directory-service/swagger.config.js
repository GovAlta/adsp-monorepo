module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Directory service',
    version: '0.0.0',
    description: 'Service that provides a register of services and APIs for service discovery.',
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
