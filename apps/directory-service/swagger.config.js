module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Directory service',
    version: '0.0.0',
    description: 'Service that provides a register of services and APIs for service discovery.',
  },
  tags: [
    {
      name: 'Directory',
      description: 'Register of service and API entries in tenant namespaces, for service discovery.',
    },
    {
      name: 'Resource',
      description: 'Tags and tagged resources under APIs registered in the directory.',
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
