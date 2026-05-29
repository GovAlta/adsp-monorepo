# Secret Service

Stub microservice for secure secret storage capabilities in the ADSP platform.

## Overview

This service provides endpoints for managing secrets. Currently implemented as stubs returning 200 OK responses.

**Note:** This is an alpha service available in Dev and UAT only. Not deployed to PROD.

## Endpoints

### POST /secret/v1/secrets/

Creates or stores a secret.

**Response:** `200 OK`

### GET /secret/v1/secrets/:id

Retrieves a secret by ID.

**Parameters:**

- `id` (path): The identifier for the secret

**Response:** `200 OK`

## Development

### Build

```bash
npx nx build secret-service
```

### Serve

```bash
npx nx serve secret-service
```

The service will start on `http://localhost:3351` (configurable via `PORT` environment variable).

### Lint

```bash
npx nx lint secret-service
```

### Test

```bash
npx nx test secret-service
```

## Environment Variables

- `PORT` - Server port (default: 3351)
- `CLIENT_ID` - Service identifier (default: urn:ads:platform:secret-service)
- `LOG_LEVEL` - Logging level (default: debug)
- `KEYCLOAK_ROOT_URL` - Keycloak server URL (default: https://access.adsp-dev.gov.ab.ca)

## Testing Endpoints

### Using PowerShell (Windows):

```powershell
# Health check
Invoke-WebRequest http://localhost:3351/health

# POST secret
Invoke-WebRequest -Method POST `
  -Uri "http://localhost:3351/secret/v1/secrets/" `
  -Body '{"key":"value"}' `
  -ContentType "application/json"

# GET secret by ID
Invoke-WebRequest -Method GET `
  -Uri "http://localhost:3351/secret/v1/secrets/my-secret-123"
```

### Using curl:

```bash
# Health check
curl http://localhost:3351/health

# POST secret
curl -X POST http://localhost:3351/secret/v1/secrets/ \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}'

# GET secret by ID
curl http://localhost:3351/secret/v1/secrets/my-secret-123
```

## Security Notes

Future implementations will include:

- Role-based access control (secret-read-access, secret-write-access)
- Encryption at rest
- Audit logging
- Secret versioning
- TTL/expiration
- Integration with vault solutions

## Next Steps

This is a stub implementation. Future enhancements will include:

- Authentication and authorization
- Secure secret storage backend
- Encryption/decryption
- Secret rotation
- Access audit trails
- Configuration management
