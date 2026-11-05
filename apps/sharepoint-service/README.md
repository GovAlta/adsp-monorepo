# SharePoint Service

Stub microservice for SharePoint integration capabilities in the ADSP platform.

## Overview

This service pushes tenant data and files to configured SharePoint destinations. It is push-only: ADSP writes to SharePoint destinations and never reads SharePoint list data back into ADSP, so there is no `GET /data` endpoint.

Each consuming team brings its own Microsoft Entra app registration, granted `Sites.Selected` access to their own SharePoint site. Credentials are configured per connection (tenant ID, client ID, client secret) and stored in a dedicated encrypted credential store — never in Configuration Service or environment variables. A Microsoft Graph token is acquired per connection on first use (not at service startup) and cached by ADSP tenant ID + connection ID.

The service is integrated with the ADSP platform via `@abgov/adsp-service-sdk`'s `initializePlatform`: requests to the SharePoint API must carry a valid core/tenant access token, and pushing data/files requires the `sharepoint-writer` role. A `sharepoint-admin` role (tenant-admin scoped) is reserved for managing connections.

## Endpoints

### GET /health

Platform health check (directory/tenant/access dependency status via the ADSP SDK). Does not depend on any SharePoint/Graph credential.

**Response:** `200 OK`

### POST /sharepoint/v1/sharepoint/destinations/{destination-id}/data

Pushes data to a SharePoint destination. Requires the `sharepoint-writer` role.

**Parameters:**

- `destination-id` (path): The identifier for the SharePoint destination

**Response:** `200 OK`

### POST /sharepoint/v1/sharepoint/destinations/{destination-id}/file/{file-url}

Posts a file to a SharePoint destination.

**Parameters:**

- `destination-id` (path): The identifier for the SharePoint destination
- `file-url` (path): The file URL or identifier
- `delete` (query): Boolean flag (`true` or `false`) to indicate whether to delete the file

Requires the `sharepoint-writer` role.

**Response:** `200 OK`

## Development

### Build

```bash
npx nx build sharepoint-service
```

### Serve

```bash
npx nx serve sharepoint-service
```

The service will start on `http://localhost:3350` (configurable via `PORT` environment variable).

### Lint

```bash
npx nx lint sharepoint-service
```

### Test

```bash
npx nx test sharepoint-service
```

## Environment Variables

- `PORT` - Server port (default: 3350)
- `CLIENT_ID` - ADSP service identifier used by the SDK (default: urn:ads:platform:sharepoint-service)
- `CLIENT_SECRET` - ADSP service account client secret for this service's own Keycloak client (store via OpenShift Secret, never commit)
- `LOG_LEVEL` - Logging level (default: debug)
- `KEYCLOAK_ROOT_URL` - Keycloak server URL (default: https://access.adsp-dev.gov.ab.ca)
- `DIRECTORY_URL` - Directory service URL (default: http://localhost:3331)

## Testing Endpoints

```bash
# Health check
curl http://localhost:3350/health

# POST data (requires a bearer token with the sharepoint-writer role)
curl -X POST http://localhost:3350/sharepoint/v1/sharepoint/destinations/test-dest/data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"test":"data"}'

# POST file with delete flag
curl -X POST "http://localhost:3350/sharepoint/v1/sharepoint/destinations/test-dest/file/myfile.docx?delete=true" \
  -H "Authorization: Bearer <token>"
```

## Known Gaps

This service currently covers platform setup only (SDK init, tenant authentication, roles). Not yet implemented:

- The encrypted per-connection credential store (MongoDB-backed, plus an encryption key secret)
- Per-connection Microsoft Graph token acquisition/caching (keyed by ADSP tenant ID + connection ID)
- The actual single-list write path to SharePoint (deferred to a separate ticket)
- The "Test connection" feature for verifying a configured destination
- Tenant Management Web App UI for entering connection details (tenant ID, client ID, secret)
