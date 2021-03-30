# Tenant Management API

The tenant management api is an api for managing tenant information. It will serve as a wrapper for encapuslating keycloak credentials so they don't have to be exposed to the public

### Running the service
Start the service using:
```
nx run tenant-management-api:serve
```
Health endpoint at /health

API doc endpoint at /swagger/docs/v1

### Environment Variables
[Dotenv](https://www.npmjs.com/package/dotenv) is used to manage the envrionment variables. The .env.sample file provides the schema of the environment variables used for local developloment.
```
mv .env.sample .env
```

Secrets of dev keycloak which might be used during development are listed as follows:
| Variable Name                             | Secret URI                                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| KEYCLOAK_TENANT_API_CLIENT_SECRET         | [Click](https://console.os99.gov.ab.ca:8443/console/project/core-services-dev/browse/secrets/tenant-management-api) |
| KEYCLOAK_TENANT_REALM_ADMIN_CLIENT_SECRET | [click](https://console.os99.gov.ab.ca:8443/console/project/core-services-dev/browse/secrets/tenant-management-api) |

Please do not commit .env to the repository.