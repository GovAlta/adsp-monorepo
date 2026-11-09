module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Dashboard metrics',
    version: '0.0.0',
    description: 'Internal service that collects daily platform usage metrics for the ADSP dashboard.',
  },
  tags: [{ name: 'Metrics', description: 'API to read collected platform usage metrics.' }],
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
