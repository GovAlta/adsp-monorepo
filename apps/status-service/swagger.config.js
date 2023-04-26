module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Status service',
    version: '0.0.0',
    description: 'The status service provides the capability to publish service status information. ',
  },
  tags: [
    {
      name: 'Managing Applications',
      description: 'API to manage which applications and services are being monitored.',
    },
    {
      name: 'Monitoring Applications',
      description: 'API to manage application monitoring.',
    },
    {
      name: 'Application Status',
      description: 'API to access published application statuses.',
    },
    {
      name: 'Notices',
      description: 'API to access and update service notices.',
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
