---
layout: page
title: Audit service
parent: Services
---

# Audit service action catalogs

The action catalog registers the classification of audit actions. Registering an action does not
generate audit records. Event ingestion, metadata validation of individual events, history storage,
SIEM forwarding, and retention execution are separate capabilities, not implemented by this catalog.

## Configuration contract

Audit Service registers a namespace-level schema at startup through `initializePlatform` with
`configuration.useNamespace: true`. The definition is the `audit-service` entry in Core
`platform:configuration-service`. It appears under **Configuration service > Definitions > Core definitions**.
Registration follows the SDK's asynchronous startup behavior: inspect registration logs and the stored
definition before onboarding applications; a listening HTTP server alone does not prove registration succeeded.

Each application stores a complete catalog in `audit-service:actions-<application>`, in its tenant
or in Core for shared actions:

```json
{
  "kind": "actionCatalog",
  "application": "case-service",
  "actions": {
    "case.update": {
      "version": 1,
      "category": "administrative",
      "severity": "info",
      "retentionClass": "compliance",
      "resourceType": "case",
      "captureChangeSet": true,
      "forwardToSiem": false,
      "metadataSchema": {
        "type": "object",
        "properties": { "reason": { "type": "string" } }
      }
    }
  }
}
```

`application` is a lowercase kebab-case identifier, at most 40 characters. The API's `namespace`
is this same identifier, **not** the Configuration Service namespace `audit-service`. For an SDK
client it should equal `serviceId.service`. Applications are trusted to register only their own
catalog; Configuration Service roles do not provide application-level write isolation.

Actions require a positive integer `version`, `category` (`administrative`, `runtime`, `security`,
`data-access`), `severity` (`info`, `warning`, `critical`), and a kebab-case `retentionClass`.
Optional fields are `description`, `resourceType`, `captureChangeSet`, `forwardToSiem`, and
`metadataSchema`. The two flags resolve to `false` when omitted. An omitted metadata schema imposes
no action-specific metadata constraint. The listing returns any supplied schema intact.
Unknown document and definition fields are rejected. Action keys omit the event outcome suffix.

The namespace schema also preserves `retentionSettings` and `applicationRetentionSettings` document
shapes, with positive integer `classes.<class>.days`. No default periods are created here.
Resolving or validating cross-document retention class references belongs to the retention work.

### Registering through the SDK

`auditDefinitions()` turns application constants into a map keyed by action name and rejects
duplicate names at startup:

```typescript
import { adspId, AuditAction, auditDefinitions } from '@abgov/adsp-service-sdk';

const serviceId = adspId`urn:ads:case-team:case-service`;
const ACTIONS = {
  UPDATE_CASE: {
    name: 'case.update',
    version: 1,
    category: 'administrative',
    severity: 'info',
    retentionClass: 'compliance',
  },
} satisfies Record<string, AuditAction>;

// Include this entry in initializeService's serviceConfigurations.
const serviceConfigurations = [
  {
    serviceId: adspId`urn:ads:platform:audit-service`,
    configuration: [
      {
        name: `actions-${serviceId.service}`,
        operation: 'REPLACE' as const,
        configuration: {
          kind: 'actionCatalog',
          application: serviceId.service,
          actions: auditDefinitions(ACTIONS),
        },
      },
    ],
  },
];
```

Use `initializePlatform` for a Core platform service. The same registration entry then creates a
shared Core catalog. Existing SDK registrations continue to use `UPDATE` unless a named document
explicitly selects `REPLACE`. For direct Configuration Service calls, PATCH the named catalog with
`{ "operation": "REPLACE", "configuration": <complete catalog> }`.

Replacing one application's document cannot delete another application's catalog, including during
concurrent registration. Replacing its action map removes obsolete definitions, unlike a shallow
`UPDATE` merge. Concurrent writers to the _same_ application remain last-writer-wins; coordinate
those deployments. Only trusted administrators/deployment accounts should have write access.

If an active revision is set, changing latest alone may not publish the change. Create and activate
revisions through the normal Configuration Service workflow, with a configuration-admin account.

## Loading and cache behavior

The service reads active revisions with fallback to latest, through the existing SDK configuration
service. It merges tenant and Core maps **by action name**, with the entire Core definition winning
on conflicts. Tenant-only actions remain. An empty tenant catalog does not hide shared Core actions.
The stored `application` must match the requested configuration name.

The SDK caches converted documents by tenant, configuration namespace, and document name. Core
documents are shared deliberately. The combine function uses the SDK's existing memoization.
Tenant `configuration-updated` and `active-revision-set` notifications invalidate the affected
entry; the next request reloads it. Core changes also have the TTL backstop; do not assume a Core
write emits a tenant notification.

`useLongConfigurationCacheTTL` is **false**, retaining the SDK's 900-second (15-minute) TTL.
With Configuration Service available, a missed notification is picked up on the first request
after expiry, plus fetch latency. An update notice normally refreshes on the next request; there is
no measured end-to-end notification latency guarantee yet. Register actions before deploying code
that emits them.

Audit Service uses the SDK's existing error handling. Configuration HTTP or converter failures are
logged and returned as `null`, so the catalog API cannot reliably distinguish those failures from
missing configuration. If neither scope supplies a catalog, it returns 404; if one scope succeeds,
it can return a partial catalog without the failed scope. A registered empty catalog retains its
`actions: {}`. Errors that still propagate, such as token acquisition failures, and application-name
consistency failures are returned as 503.

**Deferred by the MVP scope decision:** stale-on-error after invalidation/expiry, explicit cache
capacity limits, and stronger invalidation/in-flight refresh guarantees. Existing unexpired
configuration cache entries avoid configuration HTTP reads, but token retrieval remains an SDK
dependency. Once an entry expires or is invalidated, a configuration HTTP failure resolves to null;
the SDK does not retain the old value for fallback. Reliable failure-versus-absence distinction is
also deferred. These OSP-730 acceptance criteria are not claimed complete.

## Listing definitions

```http
GET /audit/v1/case-service/actions
Authorization: Bearer <token with audit-reader>
```

Returns a JSON array, with each action's `name` plus its definition fields. Optional absent
`resourceType`, `description`, and `metadataSchema` remain omitted.

| Status | Meaning                                                                           |
| ------ | --------------------------------------------------------------------------------- |
| 200    | Resolved definitions; `[]` means registered but empty.                            |
| 400    | Invalid application/namespace or tenant ID format.                                |
| 401    | Not authenticated.                                                                |
| 403    | No `audit-reader`, or a tenant caller attempted to select a different tenant.     |
| 404    | Neither scope supplied a catalog; this can also result from SDK-handled failures. |
| 503    | A propagated SDK error or application-name consistency failure; retry.            |

`audit-reader` is tenant-wide: callers can read any namespace in their tenant, not only their own.
A Core caller with the role can select a tenant via
`?tenantId=urn:ads:platform:tenant-service:v2:/tenants/<id>`. A Core request without tenant context
reads Core catalogs only. The service registers this role for tenant provisioning; existing tenants
still need their normal role provisioning/assignment process.

The catalog governs future write classification, not history access. Removing a definition performs
no audit-record deletion. History readability after deregistration must also be verified when the
history endpoint/storage work is integrated; this scaffold has no history API.
