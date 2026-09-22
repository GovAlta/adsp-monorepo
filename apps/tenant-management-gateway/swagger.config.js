module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Tenant management gateway',
    version: '0.0.0',
    description:
      'BFF for tenant-facing APIs including service usage reports. TMW calls one URL shape per service and section; the gateway aggregates value-service data and returns a uniform envelope.',
  },
  tags: [
    {
      name: 'Reports',
      description: 'Tenant service usage reports. PDF summary is implemented; other sections return 404 until later tickets.',
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
