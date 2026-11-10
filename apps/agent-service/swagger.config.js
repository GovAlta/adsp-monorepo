module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Agent service',
    version: '0.0.0',
    description:
      'The agent service provides AI agents that assist users with tasks such as building forms. Use the socket.io interface for streaming, multi-turn conversations.',
  },
  tags: [
    {
      name: 'Agent',
      description: 'API to list agents, message agents, and manage conversation threads.',
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
