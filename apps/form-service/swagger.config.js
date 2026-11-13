module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Form service',
    version: '1.0.0',
    description: '',
  },
  tags: [
    {
      name: 'Form',
      description: 'API to managed forms.',
    },
    {
      name: 'Form Submission',
      description: 'API to review and disposition form submissions.',
    },
    {
      name: 'Form schedules',
      description: 'API to manage the scheduled intake periods of form definitions.',
    },
    {
      name: 'Form registration',
      description: 'API to request access to restricted forms and to approve or deny those requests.',
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
