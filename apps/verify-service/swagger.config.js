module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Verify Service',
    version: '0.0.0',
    description:
      'The Verify Service generates random codes that expire in 10 mins and provides verification of such codes. ' +
      'These codes can be used to verify channels (email, SMS) for reach with users',
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
