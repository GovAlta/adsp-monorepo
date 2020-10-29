module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Value Service',
    version: '0.0.0',
    description: '' 
  },
  tags: [
    { 
      name: 'Value Namespace', 
      description: 'API to manage namespaces (tenants) in the value service.' 
    },
    { 
      name: 'Value Administration', 
      description: 'API to administer a particular namespace including management of value types.' 
    },
    { 
      name: 'Value', 
      description: 'API to store and retrieve value.' 
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