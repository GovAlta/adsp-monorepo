module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Client secret rotation service',
    version: '0.0.0',
    description:
      'Client secret rotation service lets tenant admins turn on automatic rotation of Keycloak client secrets for their realm, choose the schedule, opt in clients and rotate secrets on demand.',
  },
  tags: [
    {
      name: 'Realm',
      description: 'Rotation mode and schedule of a realm.',
    },
    {
      name: 'Client',
      description: 'Clients of a realm and their secret rotation status and actions.',
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
