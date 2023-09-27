module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Event service',
    version: '1.0.0',
    description: `There are two main uses for the Event Service by GOA applications;
1. For triggering notifications via the ADSP Notification Service.
See [the tutorials](https://govalta.github.io/adsp-monorepo/tutorials/notification-service/notification-service.html)
for a full description of how to use events with the Notification Service.
2. For recording occurrences of specific domain events in a log.  When an event is logged, the payload is also recorded as
a JSON object, giving the application full control over its content.

Domain events are defined by developers in the [Tenant Admin Webapp](https://adsp-uat.alberta.ca), and then triggered
by the API described below.
`,
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
