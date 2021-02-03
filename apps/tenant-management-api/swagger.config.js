module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Tenant Management API',
    version: '0.0.0',
    description: 'The tenant management api is an api for managing tenant information. It will serve as a wrapper for encapuslating keycloak credentials so they do nott have to be exposed to the public'
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
}