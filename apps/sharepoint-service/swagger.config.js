module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'SharePoint service',
    version: '0.0.0',
    description:
      'The SharePoint service pushes data, such as form submissions, and files to SharePoint lists and libraries owned by tenant teams. It never reads list data back.',
  },
  tags: [
    {
      name: 'Connection',
      description: 'API to manage the client secret of a SharePoint connection.',
    },
    {
      name: 'Destination',
      description: 'API to push data and files to a SharePoint destination, and to test, verify and set it up.',
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
