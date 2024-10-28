module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Export service',
    version: '0.0.0',
    description: 'Export service provides exports of resources to files using jobs.',
  },
  tags: [
    {
      name: 'Export',
      description: 'APIs for managing export jobs.',
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
