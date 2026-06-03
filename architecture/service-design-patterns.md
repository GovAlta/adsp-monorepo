# Feature Implementation Pattern: Services vs. Gateway vs. UI

## Overview

ADSP uses a two-tier backend architecture for feature delivery: dedicated services (Tier 1) or gateway orchestration (Tier 2). This document provides clear guidance on which tier to choose based on ownership, complexity, and scope.

---

## The Two-Tier Backend Architecture

Where should new features live? Choose between **Tier 1** (dedicated service) or **Tier 2** (gateway orchestration):

```
┌─────────────────────────────────────────────────────────┐
│              Tenant Management Webapp (UI)              │
│         Makes REST calls to Tier 1 or Tier 2            │
└─────────────────────────────────────────────────────────┘
                    ↓                      ↓
        ┌───────────────────┐    ┌──────────────────┐
        │  TIER 1: Services │    │  TIER 2: Gateway │
        ├───────────────────┤    ├──────────────────┤
        │ Dedicated CRUD    │    │ Multi-service    │
        │ endpoints         │    │ orchestration    │
        │                   │    │                  │
        │ • form-service    │    │ • tenant-mgmt-   │
        │ • task-service    │    │   gateway        │
        │ • calendar-service│    │ (aggregation,    │
        │ • file-service    │    │  plumbing)       │
        │ • status-service  │    │                  │
        │ • etc.            │    │                  │
        └───────────────────┘    └──────────────────┘
            ↓                          ↓
      Feature Databases    Configuration-Service
      (runtime data)       (central config store)
```

---

## Decision Framework: Where to Build?

### Decision Tree

```
START: New feature endpoint needed
  │
  ├─ What ADSP service resources does this endpoint affect?
  │
  ├─ Resources belonging to a SINGLE ADSP service
  │  (e.g., form definitions, calendar events, tasks, files, scripts)
  │  │
  │  └─ Does the endpoint belong in an existing ADSP service?
  │      │
  │      ├─ YES → Build in that SERVICE as /v1/[resource] endpoint
  │      │         Full CRUD over the service's own resources
  │      │
  │      └─ NO → This endpoint belongs in a new ADSP service
  │               (introducing a new service is a significant platform
  │               decision and requires broader architectural review)
  │
  │
  └─ Resources spanning MULTIPLE ADSP services
     (operation requires orchestrating calls across several services)
     │
     └─ Build in GATEWAY (Pattern 2)
         Reduces N+1 calls from UI
         Returns aggregated response
```

---

## Implementation Patterns

### Pattern 1: Single ADSP Service Resource Endpoint

**When to use:** The endpoint's resources belong entirely to one ADSP service.

**Examples:**
- Form definitions and data registers (form-service)
- Calendar events (calendar-service)
- Tasks in queue (task-service)
- Files uploaded (file-service)
- Script definitions (script-service)
- Notification types (notification-service)

**Endpoint placement:** `/[service]/v1/[resource]`

**Implementation:**
```typescript
// Service CRUD over resources that delegate to configuration-service
POST /form/v1/data-registers
  → Calls configuration-service PATCH to store definition
  → Returns created register

// Service CRUD over resources in the service's own database
GET /task/v1/queues/:queueId/tasks
  → Query task-service database
  → Return task list with tenant filtering

POST /task/v1/queues/:queueId/tasks
  → Validate input
  → Create task in database
  → Signal domain event (taskCreated)
  → Return created task
```

**Code location:**
- `apps/[service]/src/[domain]/router.ts` — Handlers with business logic
- `apps/[service]/src/[domain]/model/` — Domain models
- `apps/[service]/src/[db]/[resource].repository.ts` — Database access (if applicable)

**Key pattern:** Each ADSP service is the authority over its own resources. Whether it delegates storage to configuration-service or owns a dedicated database is an implementation detail.

---

### Pattern 2: Gateway Multi-Service Orchestration

**When to use:** Operation requires combining calls to multiple services AND no single service owns the operation.

**Examples:**
- Form editor (form-service + script-service + file-service + configuration-service)
- Export jobs (export-service + push-service + file-service)
- Status webhooks (status-service + push-service + configuration-service configs)
- Configuration bootstrap (configuration-service + N service URL resolution)

**Endpoint placement:** `/api/tenant/v1/[operation]`

**Implementation:**
```typescript
// Endpoint orchestrates multiple service calls
POST /api/tenant/v1/export-jobs
  → 1. Validate export request
  → 2. Call export-service to queue job
  → 3. Set up WebSocket listener on push-service
  → 4. Poll export-service for completion
  → 5. Call file-service to get download URL
  → 6. Return final result to client
```

**Code location:**
- `apps/tenant-management-gateway/src/[domain]/router.ts` — Orchestration handlers
- `apps/tenant-management-gateway/src/[domain]/types.ts` — Request/response interfaces

**Key pattern:** Gateway is a **BFF (Backend-for-Frontend)** that reduces UI complexity.

---

## Detailed Examples

### Example 1: Form Data Registers

**Question:** Where should form data register CRUD live?

**Analysis:**
- ✅ Data registers are form-specific resources (part of form domain)
- ✅ Form-service exists and owns form resources
- ✅ The endpoint affects only form-service resources
- ✅ Form-service should expose the management API for its own resources

**Decision:** Build in **form-service** at `/form/v1/data-registers`

**Why not gateway?**
- Data registers are not multi-service orchestration
- They're part of the form domain (should stay with form-service)
- External teams building forms need to manage registers
- Keeps feature cohesion

**Implementation:**
```typescript
// apps/form-service/src/form/data-register/router.ts
export function createDataRegisterRouter({
  configurationService,
  directory,
  ...
}): Router {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      // 1. Get all form-service config definitions
      const defs = await configurationService.getServiceConfiguration(...);

      // 2. Filter for data-register namespace
      const registers = defs.filter(d => d.name.startsWith('data-register:'));

      // 3. Get active data for each register
      const withData = await Promise.all(
        registers.map(async (r) => ({
          ...r,
          data: await configurationService.getConfiguration(r.id, token, tenantId)
        }))
      );

      res.json({ registers: withData });
    } catch (err) {
      next(err);
    }
  });

  // Similar for POST, PUT, DELETE
  return router;
}
```

---

### Example 2: Export Jobs

**Question:** Where should export job management live?

**Analysis:**
- ✅ Resources span multiple ADSP services (export-service, push-service, file-service)
- ✅ No single ADSP service owns "export jobs"
- ✅ Complex orchestration (poll for completion, stream updates)
- ❌ Not the responsibility of any single service endpoint

**Decision:** Build in **gateway** at `/api/tenant/v1/export-jobs`

**Why not a service?**
- Export is a cross-cutting concern, not owned by one service
- No dedicated database needed (export-service owns jobs)
- UI would need to orchestrate all 3 calls otherwise

**Implementation:**
```typescript
// apps/tenant-management-gateway/src/export/router.ts
export function createExportRouter({ directory, tokenProvider, ... }): Router {
  const router = Router();

  router.post('/jobs', async (req, res, next) => {
    try {
      const token = await tokenProvider.getAccessToken();
      const { resourceId, format, parameters } = req.body;

      // 1. Call export-service to create job
      const exportApiUrl = await directory.getServiceUrl(
        AdspId.parse('urn:ads:platform:export-service:v1')
      );
      const { data: job } = await axios.post(
        `${exportApiUrl}/export/v1/jobs`,
        { resourceId, format, parameters },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Set up push-service listener
      const pushUrl = await directory.getServiceUrl(...);
      // ... socket connection to `export-updates` stream

      // 3. Poll for completion, return result
      // ...

      res.json(job);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
```

---

### Example 3: Calendar Event CRUD

**Question:** Where should calendar event CRUD live?

**Analysis:**
- ✅ Calendar-service exists and owns calendar events
- ✅ Calendar events are resources of calendar-service
- ✅ The endpoint affects only calendar-service resources
- ❌ No multi-service orchestration needed

**Decision:** **Build in calendar-service**; UI makes direct calls

**Why not gateway?**
- Calendar events belong to a single service (calendar-service)
- No aggregation or cross-service orchestration required

**Implementation:** Already exists in calendar-service
```
GET    /calendar/v1/events
POST   /calendar/v1/events
PUT    /calendar/v1/events/:id
DELETE /calendar/v1/events/:id
```

UI saga calls these directly (no gateway).

---

### Example 4: Form Editor

**Question:** Where should the form editor API calls live?

**Analysis:**
- ✅ The form editor UI needs form definitions (form-service), scripts (script-service), files (file-service), and configuration (configuration-service)
- ✅ Resources span multiple ADSP services
- ✅ Without a gateway endpoint, the UI would make N separate calls to N different services
- ❌ No single ADSP service owns the "form editor" operation

**Decision:** Build in **gateway** at `/api/tenant/v1/forms/editor`

**Why not individual services?**
- The form editor is a UI concern that aggregates resources from multiple services
- Putting orchestration in the UI creates tight coupling and N+1 call patterns
- The gateway is the correct place for BFF aggregation

**Implementation:**
```typescript
// apps/tenant-management-gateway/src/form-editor/router.ts
router.get('/editor/:formId', async (req, res, next) => {
  try {
    const token = await tokenProvider.getAccessToken();

    // Fetch from multiple services in parallel
    const [formDef, scripts, fileRefs, config] = await Promise.all([
      axios.get(`${formServiceUrl}/form/v1/definitions/${formId}`, { headers }),
      axios.get(`${scriptServiceUrl}/script/v1/scripts`, { headers }),
      axios.get(`${fileServiceUrl}/file/v1/files`, { headers }),
      axios.get(`${configServiceUrl}/configuration/v2/...`, { headers }),
    ]);

    res.json({
      definition: formDef.data,
      scripts: scripts.data,
      files: fileRefs.data,
      config: config.data,
    });
  } catch (err) {
    next(err);
  }
});
```
