# Tenant Management API

The tenant management api is an api for managing tenant information. It will serve as a wrapper for encapuslating keycloak credentials so they don't have to be exposed to the public

### Running the service
Start the service using:
```
nx run tenant-management-api:server
```
Health endpoint at /health

API doc endpoint at /swagger/docs/v1