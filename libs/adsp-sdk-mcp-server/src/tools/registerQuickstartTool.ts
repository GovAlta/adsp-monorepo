import { ToolDefinition } from './types';

const QUICKSTART = `# Getting started with @abgov/adsp-service-sdk (Node)

## 1. Initialize the SDK

For a multi-tenant platform service, call \`initializePlatform\` once at startup:

\`\`\`typescript
import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';

const serviceId = AdspId.parse(environment.CLIENT_ID);
const {
  coreStrategy,
  tenantStrategy,
  ...sdkCapabilities
} = await initializePlatform(
  {
    displayName: 'My platform service',
    description: 'Example of a platform service.',
    serviceId,
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

For a single-tenant service, use \`initializeService\` instead (same options, minus \`ignoreServiceAud\`; it resolves the
service's own tenant automatically and omits \`tenantService\`/\`tenantHandler\` from what it returns).

## 2. What you get back

\`initializePlatform\` returns capabilities you wire into your Express app:

| Capability | Purpose |
|---|---|
| \`directory\` | Look up other service/API URLs by ADSP URN |
| \`tenantService\` | Look up tenant records |
| \`configurationService\` | Retrieve tenant/core configuration |
| \`eventService\` | Send domain events |
| \`tokenProvider\` | Get this service's own access token |
| \`coreStrategy\` / \`tenantStrategy\` | Passport strategies to validate incoming tokens |
| \`tenantHandler\` / \`configurationHandler\` | Express middleware setting \`req.tenant\` / \`req.getConfiguration()\` |
| \`healthCheck\` | Function to check platform dependency health |
| \`metricsHandler\` / \`traceHandler\` | Request instrumentation middleware |

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
        'Returns the canonical initializePlatform usage pattern for a new Node ADSP service, a summary of the ' +
        'capabilities it returns, and pointers to further docs. Use this first for the most common question: how to ' +
        'start using ADSP from a Node service.',
      inputSchema: { type: 'object', properties: {} },
      handler: () => ({ content: [{ type: 'text', text: QUICKSTART }] }),
    },
  ];
}
