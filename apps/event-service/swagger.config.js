module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Event Service',
    version: '1.0.0',
    description:
      'The Event Service allows consumers to send domain events. ' +
      'These events are used for a variety of side effects to support additional functionality aside from domain services. ' +
      'For example, events are recorded to an event log that provide traceability for domain record updates.',
  },
  tags: [
    {
      name: 'Event',
      description: 'API to send domain events.',
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
