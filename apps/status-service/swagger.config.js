module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Status service',
    version: '0.0.0',
    description: 'The status service provides the capability to publish service status information. ',
  },
  tags: [
    {
      name: 'Status',
      description: 'API to access and updated service status.',
    },
    {
      name: 'Public status',
      description: 'API to access published application statuses.',
    },
    {
      name: 'Notice',
      description: 'API to access and updated service notices.',
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
