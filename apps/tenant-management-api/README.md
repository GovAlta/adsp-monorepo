# Tenant Management API

The tenant management api is an api for managing tenant information. It will serve as a wrapper for encapuslating keycloak credentials so they don't have to be exposed to the public

### Running the service
Start the service using:
```
nx run tenant-management-api:serve
```
Health endpoint at /health

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

### Swagger
Swagger yml file with suffix **.swagger.yml** will be compiled into a swagger.json.
Swagger doc path: /swagger/docs/
Swagger json path: /swagger/json/v1
Please check the swagger.config.js and main.ts files for details.


There are various pre-defined authentication flows. The pre-defined parameters used for the authentication flows are listed here:
#### platformAdmin
Username: dio-qa-dev@gov.ab.ca
UserSecret: [UserSecret](https://console.os99.gov.ab.ca:8443/console/project/core-services-dev/browse/secrets/tenant-web-app-qa-user)
ClientId: tenant-api
ClientSecret: [ClientSecret](https://access-dev.os99.gov.ab.ca/auth/admin/master/console/#/realms/core/clients/ef519581-51cb-4d3b-baba-d42bb41ec90c/credentials)

#### tenantInit
ClientId: tenant-platform-webapp
ClientSecret: blank

#### tenant
ClientId: tenant-platform-webapp
ClientSecret: blank
To login to a specific tenant, please update SWAGGER_TEST_TENANT in the .env:
```
# in .env file
SWAGGER_TEST_TENANT=<tenant_name>
```