import { ToolDefinition } from './types';

const QUICKSTART = `# Getting started with @abgov/adsp-service-sdk (Node)

The SDK has two entry points for two different kinds of service. Most product teams building on ADSP want
**\`initializeService\`** — use that unless you are specifically building a new cross-tenant platform capability
(the kind that lives in the ADSP core-services monorepo itself, e.g. directory-service, configuration-service).

## 1. Initialize the SDK (tenant service)

Call \`initializeService\` once at startup, with your tenant's realm:

\`\`\`typescript
import { AdspId, initializeService } from '@abgov/adsp-service-sdk';

const serviceId = AdspId.parse(environment.CLIENT_ID);
const {
  coreStrategy,
  tenantStrategy,
  ...sdkCapabilities
} = await initializeService(
  {
    displayName: 'My tenant service',
    description: 'Example of a service built on top of ADSP.',
    serviceId,
    realm: environment.TENANT_REALM,
    accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),
    clientSecret: environment.CLIENT_SECRET,
    directoryUrl: new URL(environment.DIRECTORY_URL),
    configurationSchema,
    events: [],
    roles: [],
    notifications: [],
  },
  { logger }
);
\`\`\`

\`realm\` is your tenant's Keycloak realm — visible in Tenant Admin, or the realm you created your service client
under. (If you're instead building a cross-tenant platform service, use \`initializePlatform\` — same options minus
\`realm\`, which is fixed to \`"core"\`; it additionally returns \`tenantService\`/\`tenantHandler\` since it serves many
tenants.)

## 2. What you get back

Both entry points return capabilities you wire into your Express app:

| Capability | Purpose |
|---|---|
| \`directory\` | Look up other service/API URLs by ADSP URN |
| \`configurationService\` | Retrieve tenant/core configuration |
| \`eventService\` | Send domain events |
| \`tokenProvider\` | Get this service's own access token |
| \`coreStrategy\` / \`tenantStrategy\` | Passport strategies to validate incoming tokens |
| \`configurationHandler\` | Express middleware setting \`req.getConfiguration()\` |
| \`healthCheck\` | Function to check platform dependency health |
| \`metricsHandler\` / \`traceHandler\` | Request instrumentation middleware |

(\`initializePlatform\` additionally returns \`tenantService\` and \`tenantHandler\`, since a platform service serves
many tenants and needs to resolve which one a request belongs to.)

## 3. Registering what your service needs

The \`ServiceRegistration\` fields in the options object tell the SDK what to declare at startup.

**Registration is how platform services learn about your service's resources.** Most ADSP services store
their resource definitions (file types, event types, form definitions, task queues, etc.) as configuration in
configuration-service. Registering them at startup is what creates those resources — without registration
they do not exist, and API calls to those services will fail regardless of whether Keycloak roles are
correctly assigned. Always register the definitions for every ADSP service your code depends on.

| Service you call | Registration field | What the SDK registers |
|---|---|---|
| configuration-service | \`configuration\` (configurationSchema) | Your config schema; enables \`req.getConfiguration()\` |
| event-service | \`events\` | Event definitions; events appear in the event log and can be subscribed to |
| file-service | \`fileTypes\` | File type definitions controlling storage, access, and scan rules |
| notification-service | \`notifications\` | Notification type definitions triggered by events |
| push-service | \`eventStreams\` | Event stream definitions for WebSocket delivery to clients |
| value-service | \`values\` | Value definitions for time-series data |
| tenant-service | \`roles\` | RBAC roles users can be assigned; roles appear in \`req.user.roles\` |
| any other service | \`serviceConfigurations\` | Generic: posts a configuration object to that service's namespace |

All fields are optional — only include the ones your service actually uses. Every named field above is a
convenience wrapper around the same underlying mechanism: the SDK PATCHes configuration-service under the
target service's namespace. \`serviceConfigurations\` exposes that mechanism directly for any service not
covered by a named field:

\`\`\`typescript
serviceConfigurations: [
  {
    serviceId: AdspId.parse('urn:ads:platform:<target-service>'),
    // Plain object when the service uses a single configuration document:
    configuration: { /* shape matching the target service's configuration schema */ },
    // — OR — NamedConfiguration[] when the service uses namespace mode
    // (one named document per resource definition, e.g. one entry per form):
    // configuration: [{ name: '<resource-id>', configuration: { /* schema shape */ } }],
  },
]
\`\`\`

To find the correct \`configuration\` shape for a service: call \`get_service_configuration_schema\` with
the service's URN (e.g. \`urn:ads:platform:form-service\`) — it returns the live JSON Schema registered by
that service, which is exactly the shape required here. Use \`search_sdk_reference\` for the full
\`ServiceRegistration\` type and the \`NamedConfiguration\` variant.

## 4. Keycloak setup for service-to-service calls

When your service makes HTTP requests to another ADSP service (e.g. uploads files via file-service, sends
notifications via notification-service), **two Keycloak changes are required on your service's client** — one
is NOT enough:

### Step 1 — Add an audience mapper

Every ADSP service validates that its own URN appears in the \`aud\` (audience) claim of the incoming token.
Your service's token will not carry that URN by default, so every call will be rejected with 401 unless you
add an audience mapper.

In Keycloak admin console: **Clients → {your-client-id} → Client Scopes → {your-client-id}-dedicated →
Add mapper → By configuration → Audience** → set "Included Client Audience" to the target service's URN
(e.g. \`urn:ads:platform:file-service\`). Repeat for each service you call.

### Step 2 — Assign the service account role

Your service's token must also carry the role the target service requires for the operation. Use
\`list_service_roles\` to find the least-privileged role, then assign it.

In Keycloak admin console: **Clients → {your-client-id} → Service Account Roles → Client Roles** → select
the target service's URN from the dropdown → assign the role (e.g. \`file-service-user\`). Repeat for each
service you call.

Both steps are always required. The audience mapper makes your token acceptable to the target service; the
role controls what that service will permit your service account to do.

## 5. Next steps

- Use \`search_adsp_docs\` for platform concepts (multi-tenancy, service discovery, configuration, domain events) and
  service-specific docs.
- Use \`search_sdk_reference\` for details on any specific SDK symbol (e.g. \`EventService\`, \`ConfigurationService\`,
  \`authorize\`).
- Use \`list_service_roles\` to find the exact role name to assign in Step 2 above.
- Read the full getting-started guide with \`read_adsp_doc\` on path \`getting-started.md\`, the Node SDK page at
  \`platform/platform-node-sdk.md\`, and the architecture overview at \`architecture.md\`.
`;

export function createQuickstartTool(): ToolDefinition[] {
  return [
    {
      name: 'get_platform_quickstart',
      description:
        'Returns the canonical initializeService usage pattern for a new Node service built on top of ADSP (the ' +
        'common case for product teams), notes the initializePlatform variant for cross-tenant platform services, ' +
        'and summarizes the capabilities returned. Use this first for the most common question: how to start using ' +
        'ADSP from a Node service.',
      inputSchema: { type: 'object', properties: {} },
      handler: () => ({ content: [{ type: 'text', text: QUICKSTART }] }),
    },
  ];
}
