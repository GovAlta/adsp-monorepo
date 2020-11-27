module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Event Service',
    version: '0.0.0',
    description: 'The event service provides the capability to send events. ' +
      'Consumers are registered with their own namespace (tenant) containing event definitions that include ' +
      'role based access policy and event payload schema.' 
  },
  tags: [
    { 
      name: 'Event Namespace', 
      description: 'API to manage spaces (tenants) in the event service.' 
    },
    { 
      name: 'Event Administration', 
      description: 'API to administer a particular namespace including management of event definitions.' 
    },
    { 
      name: 'Event', 
      description: 'API to send events.' 
    }
  ],
  components: {
    securitySchemes: {
      accessToken: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [
    { accessToken: [] }
  ]
}