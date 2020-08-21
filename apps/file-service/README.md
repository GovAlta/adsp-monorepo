# File Service

The file service provides the capability to upload and download files. 
Consumers are registered with their own space (tenant) containing file types 
that include role based access policy, and can associate files to domain records.

## Getting Started

### Prerequisites
- Keycloak
- MongoDB
- RabbitMQ (Optional)

### Configuration
Configure connection settings for JWT, Database, and AMQP in 
src/environments/environment.ts

### Running the service
Start the service using:
```
nx serve file-service
```
Health endpoint at /health

API doc endpoint at /swagger/docs/v1

### Creating a space
```
curl -X PUT | 
-H "Content-Type: application/json" |
-H "Authorization: Bearer {access token}" |
-d '{ "name": "My Space", "spaceAdminRole": "my-space-admin" }' |
http://localhost:3337/space/v1/spaces/{spaceId}

```
The access token provided with the request must include a role of 'file-service-admin'.
