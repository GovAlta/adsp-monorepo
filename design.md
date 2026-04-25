# Secret Management Service — Design

## Overview

A new ADSP platform service that allows tenant administrators to store, retrieve, and rotate secrets (API keys, credentials, tokens) backed by Azure Key Vault. Backend services (e.g., form-service) consume these secrets at runtime via a service-to-service API.

---

## Architecture Decisions

### AD-1: Azure Key Vault as the storage backend

Secrets are stored in Azure Key Vault. The secret management service acts as a proxy — it never persists secret values in its own database. Only metadata (name, description, tenant, created/updated timestamps, version) is stored in MongoDB, mirroring the pattern used by other ADSP services.

**Rationale:** Azure Key Vault provides audit logging, versioning, rotation, and access policies that are already required by enterprise compliance. Building a custom store would duplicate this infrastructure.

### AD-2: Single Key Vault with path-like secret naming per tenant

All tenants share a single Key Vault. Secret names follow a path-like convention using `--` as the segment separator (Azure Key Vault permits only alphanumeric characters and hyphens — `/` is not valid):

```
{tenantId}--{secretName}
```

For secrets that have a logical category or sub-grouping, an optional middle segment is supported:

```
{tenantId}--{serviceName}--{secretName}
```

Examples:
- `tenant-abc123--stripe-api-key`
- `tenant-abc123--form-service--stripe-api-key`

The service enforces that callers can only read/write paths prefixed with their own `tenantId`, providing tenant isolation without per-tenant vault provisioning. The path prefix is resolved server-side from the JWT tenant claim — callers never supply the tenant prefix directly.

**Rationale:** Scoping secrets by service name makes ownership explicit and allows fine-grained access policies per service in future, while keeping infrastructure simple — one managed identity, one vault, one access policy to maintain.

### AD-3: Roles managed in Keycloak, following existing ADSP patterns

Three roles are defined in the service's Keycloak client:

| Role | Description |
|---|---|
| `secret-admin` | Create, update, delete, and list secrets for their tenant |
| `secret-reader` | Read secret values (intended for backend services) |
| `secret-auditor` | View metadata and audit log only — no access to values |

Roles are checked via `isAllowedUser()` following the same pattern as configuration-service and task-service.

### AD-4: Configuration stored in configuration-service

Configuration is stored under namespace `secret-service` and retrieved via the standard `getConfiguration()` pattern. Two levels apply: **core** (platform-wide defaults) and **tenant** (per-tenant overrides).

**Configuration schema:**

```typescript
interface SecretServiceConfiguration {
  // Azure Key Vault
  keyVaultUri: string;                  // e.g. "https://adsp-secrets.vault.azure.net"

  // Value caching
  cacheTtlSeconds: number;              // How long secret values are cached by consumers (default: 300)

  // Rotation
  rotation: {
    enabled: boolean;                   // Whether automatic rotation is active for this tenant
    notifyBeforeDays: number;           // Days before expiry to emit a rotation-due event (default: 14)
    defaultExpiryDays: number;          // Expiry applied to new secrets if none specified (default: 90)
    notificationTargetId?: string;      // ADSP notification-service subscriber ID to alert on rotation-due
  };

  // Access
  allowedServiceIds: string[];          // ADSP service IDs permitted to use secret-reader role
}
```

**Rotation behaviour:**

- A background job runs daily and checks each secret's expiry date via Key Vault metadata.
- If `daysUntilExpiry <= rotation.notifyBeforeDays`, a `secret-service:secret-rotation-due` event is emitted with the secret name, tenant, and expiry date (no value).
- If `rotation.notificationTargetId` is set, the event-service triggers a notification to that subscriber.
- Actual rotation (writing a new value) is always manual in v1 — the service emits the warning but does not auto-rotate values.

**Rationale for manual rotation in v1:** Auto-rotation requires service-specific logic (each API has a different key generation flow). Notification-driven manual rotation covers the compliance requirement without service-specific integrations.

### AD-5: Secret values are never logged or emitted in events

Event payloads (emitted to event-service) include only metadata: secret name, tenant, actor, and timestamp. Secret values are never included. This is enforced at the router layer before event construction.

### AD-6: Versioning delegates to Azure Key Vault

Key Vault natively versions secrets on every update. The service exposes version identifiers from Key Vault but does not maintain its own version history.

---

## API Specification

Base path: `/secret/v1`

Authentication: Bearer JWT via `passport.authenticate(['core', 'tenant'], { session: false })`, same middleware stack as other ADSP services.

All responses follow the existing ADSP envelope: `{ results, page }` for lists; direct object for single resources. Errors follow `{ errorCode, errorMessage }`.

---

### Secrets

#### `GET /secret/v1/secrets`

List secret metadata for the caller's tenant. Does not return values.

**Required role:** `secret-admin` or `secret-auditor`

**Query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `top` | integer | Page size (default 10, max 100) |
| `after` | string | Cursor for pagination |

**Response `200 OK`:**
```json
{
  "results": [
    {
      "id": "urn:ads:platform:secret-service:v1:/secrets/stripe-api-key",
      "name": "stripe-api-key",
      "description": "Stripe production API key for payment processing",
      "tenantId": "urn:ads:platform:tenant-service:v2:/tenants/abc123",
      "createdBy": { "id": "user-id", "name": "Alice" },
      "createdOn": "2026-01-15T10:00:00Z",
      "updatedOn": "2026-03-20T14:30:00Z",
      "versionCount": 3
    }
  ],
  "page": { "after": "cursor==", "size": 10 }
}
```

---

#### `POST /secret/v1/secrets`

Create a new secret.

**Required role:** `secret-admin`

**Request body:**
```json
{
  "name": "stripe-api-key",
  "description": "Stripe production API key for payment processing",
  "value": "sk_live_..."
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Alphanumeric and hyphens only; unique per tenant |
| `description` | string | no | Human-readable purpose |
| `value` | string | yes | The secret value; stored in Key Vault only |

**Response `201 Created`:** Secret metadata (no value).

**Errors:**
- `409 Conflict` — secret name already exists for this tenant
- `400 Bad Request` — invalid name format

---

#### `GET /secret/v1/secrets/:name`

Get metadata for a single secret.

**Required role:** `secret-admin` or `secret-auditor`

**Response `200 OK`:** Single secret metadata object (no value).

---

#### `GET /secret/v1/secrets/:name/value`

Retrieve the current secret value.

**Required role:** `secret-reader` or `secret-admin`

**Response `200 OK`:**
```json
{
  "name": "stripe-api-key",
  "value": "sk_live_...",
  "version": "a1b2c3d4e5f6"
}
```

**Rationale for separate endpoint:** Separating value retrieval from metadata allows fine-grained audit logging and makes it easy to grant read-only metadata access (`secret-auditor`) without exposing values.

---

#### `PUT /secret/v1/secrets/:name`

Update (rotate) a secret value.

**Required role:** `secret-admin`

**Request body:**
```json
{
  "value": "sk_live_newvalue...",
  "description": "Updated description (optional)"
}
```

**Response `200 OK`:** Updated metadata. A new version is created in Key Vault; the previous version is retained and accessible via `:name/versions`.

---

#### `DELETE /secret/v1/secrets/:name`

Soft-delete a secret (Key Vault soft-delete; recoverable within retention period).

**Required role:** `secret-admin`

**Response `204 No Content`**

---

#### `GET /secret/v1/secrets/:name/versions`

List all versions of a secret (metadata only, no values).

**Required role:** `secret-admin` or `secret-auditor`

**Response `200 OK`:**
```json
{
  "results": [
    { "version": "a1b2c3", "createdOn": "2026-03-20T14:30:00Z", "current": true },
    { "version": "f9e8d7", "createdOn": "2026-01-15T10:00:00Z", "current": false }
  ]
}
```

---

#### `GET /secret/v1/secrets/:name/versions/:version/value`

Retrieve the value of a specific historical version.

**Required role:** `secret-reader` or `secret-admin`

**Response `200 OK`:** `{ name, value, version }`

---

### Service-to-Service Usage (form-service example)

Backend services request secrets using their service account token (role: `secret-reader`). The recommended pattern:

```typescript
// Resolved via ADSP SDK — same pattern as getConfiguration()
const secretValue = await secretService.getSecret(serviceId, token, 'stripe-api-key');
```

The SDK method calls `GET /secret/v1/secrets/:name/value` with the service's JWT, caches the result with a short TTL (configurable, default 300s), and handles token refresh. Cache invalidation is triggered via an event emitted on secret rotation.

---

## Events

Emitted to the ADSP event-service. Values are never included in payloads.

| Event | Trigger |
|---|---|
| `secret-service:secret-created` | New secret created |
| `secret-service:secret-updated` | Secret value rotated |
| `secret-service:secret-deleted` | Secret soft-deleted |
| `secret-service:secret-accessed` | Secret value read (audit) |

---

## Open Questions

- Should `secret-reader` be assignable to specific secrets, or is it tenant-wide?
- What is the Key Vault soft-delete retention period (default 90 days)?
- Should the service support automatic rotation schedules, or manual-only for v1?
- Is a Terraform module needed to provision the Key Vault and managed identity?
