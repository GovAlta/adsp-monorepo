module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'PDF Service',
    version: '0.0.0',
    description: '',
  },
  tags: [
    {
      name: 'PDF',
      description: 'Utility API for PDF operations.',
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
