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

Pass \`roles\`, \`events\`, \`configuration\`, \`eventStreams\`, \`fileTypes\`, \`notifications\`, and/or \`values\` on the options
object (see the \`ServiceRegistration\` SDK reference entry) and the SDK registers them with the relevant platform
services (configuration-service, event-service, tenant-service, push-service, file-service, notification-service,
value-service) automatically on startup.

## 4. Next steps

- Use \`search_adsp_docs\` for platform concepts (multi-tenancy, service discovery, configuration, domain events) and
  service-specific docs.
- Use \`search_sdk_reference\` for details on any specific SDK symbol (e.g. \`EventService\`, \`ConfigurationService\`,
  \`authorize\`).
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
