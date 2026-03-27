# SharePoint Service

Stub microservice for SharePoint integration capabilities in the ADSP platform.

## Overview

This service provides endpoints for managing SharePoint destinations and file operations. Currently implemented as stubs returning 200 OK responses.

## Endpoints

### POST /sharepoint/v1/sharepoint/destinations/{destination-id}/data

Posts data to a SharePoint destination.

**Parameters:**

- `destination-id` (path): The identifier for the SharePoint destination

**Response:** `200 OK`

### GET /sharepoint/v1/sharepoint/destinations/{destination-id}/data

Retrieves data from a SharePoint destination.

**Parameters:**

- `destination-id` (path): The identifier for the SharePoint destination

**Response:** `200 OK`

### POST /sharepoint/v1/sharepoint/destinations/{destination-id}/file/{file-url}

Posts a file to a SharePoint destination.

**Parameters:**

- `destination-id` (path): The identifier for the SharePoint destination
- `file-url` (path): The file URL or identifier
- `delete` (query): Boolean flag (`true` or `false`) to indicate whether to delete the file

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
- `CLIENT_ID` - Service identifier (default: urn:ads:platform:sharepoint-service)
- `LOG_LEVEL` - Logging level (default: debug)
- `KEYCLOAK_ROOT_URL` - Keycloak server URL (default: https://access.adsp-dev.gov.ab.ca)

## Testing Endpoints

```bash
# Health check
curl http://localhost:3350/health

# POST data
curl -X POST http://localhost:3350/sharepoint/v1/sharepoint/destinations/test-dest/data \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'

# GET data
curl http://localhost:3350/sharepoint/v1/sharepoint/destinations/test-dest/data

# POST file with delete flag
curl -X POST "http://localhost:3350/sharepoint/v1/sharepoint/destinations/test-dest/file/myfile.docx?delete=true"
```

## Next Steps

This is a stub implementation. Future enhancements will include:

- Authentication and authorization
- SharePoint API integration
- Configuration management
- Event signaling
- Data persistence
- Error handling and validation
