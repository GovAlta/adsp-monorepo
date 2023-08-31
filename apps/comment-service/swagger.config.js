module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Comment service',
    version: '0.0.0',
    description: 'Service that allows users to comment on topics.',
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
