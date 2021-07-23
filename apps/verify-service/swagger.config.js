module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Verify Service',
    version: '0.0.0',
    description:
      'The Verify Service generates random codes that expire in 10 mins and provides verification of such codes. ' +
      'Codes can be used to verify that a user has access to a particular email address or SMS number.',
  },
  tags: [
    {
      name: 'Verify',
      description: 'API to generate and verify time limited codes.',
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
