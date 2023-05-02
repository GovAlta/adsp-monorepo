module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Status service',
    version: '0.0.0',
    description: `The status service provides the capability to monitor the health of applications and services, and to
publish _status_ information about them. Along with the Tenant Admin Webapp, it allows you to
* manage which applications and services will be monitored,
* control application monitoring,
* access an application's published status,
* manage public notices regarding the application's status.

Please use the [Tenant Admin Webapp](https://adsp.alberta.ca) to manage the applications and services
that you wish to be monitored.  For more information on how the _Status Service_ works, please see the
[Status Service tutorial](https://govalta.github.io/adsp-monorepo/tutorials/status-service/Introduction.html).
`,
  },
  tags: [
    {
      name: 'Application Monitoring',
      description:
        'To control application _monitoring_. Note: You can manage which applications are monitored through the [Tenant Admin Webapp](https://adsp.alberta.ca).',
    },
    {
      name: 'Application Status',
      description: "To manage an application's published _status_",
    },
    {
      name: 'Notices',
      description:
        'To access and manage application _notices_. Note: You can also manage notices through the [Tenant Admin Webapp](https://adsp.alberta.ca).',
    },
    // {
    //   name: 'Managing Applications',
    //   description: 'To manage which applications and services will be monitored.',
    // },
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
