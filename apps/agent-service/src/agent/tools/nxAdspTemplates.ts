import { createTool } from '@mastra/core/tools';
import z from 'zod';

// Templates are versioned alongside the nx-adsp plugin they were designed for.
// Update this constant and the template content when the plugin's SDK patterns change.
const COMPATIBLE_PLUGIN_VERSION = '>=12.3.0';

interface NxAdspTemplate {
  id: string;
  description: string;
  compatibleWith: string;
  newFiles?: Record<string, string>;
  integrationChanges: Record<string, { description: string; pattern: string }>;
  usageExample?: string;
}

const templates: Record<string, NxAdspTemplate> = {
  'express-service-roles': {
    id: 'express-service-roles',
    compatibleWith: COMPATIBLE_PLUGIN_VERSION,
    description: 'Add service role definitions to SDK initialization for role-based access control.',
    newFiles: {
      'src/roles.ts': `// Service role definitions.
// Role strings follow the pattern: '{service-name}:{role-name}'.
// inTenantAdmin: true makes the role visible and assignable in the tenant admin UI.
export enum ServiceRoles {
  Admin = '{projectName}-admin',
  User = '{projectName}-user',
}
`,
    },
    integrationChanges: {
      'src/main.ts': {
        description:
          'Import ServiceRoles and add a roles array to the initializeService config object. ' +
          'Each role needs: role (ServiceRoles enum value), description, and optionally inTenantAdmin.',
        pattern: `// Add import at top of file:
import { ServiceRoles } from './roles';

// Add inside the initializeService({}) config object:
roles: [
  {
    role: ServiceRoles.Admin,
    description: 'Administrator role with full access to {projectName}.',
    inTenantAdmin: true,
  },
  {
    role: ServiceRoles.User,
    description: 'Standard user role for {projectName}.',
  },
],`,
      },
    },
    usageExample: `// Check roles in a route handler via req.user:
app.get('/{projectName}/v1/admin-resource', (req, res) => {
  const user = req.user as { roles?: string[] } | undefined;
  if (!user?.roles?.includes(ServiceRoles.Admin)) {
    return res.sendStatus(403);
  }
  res.json({ message: 'Admin resource' });
});`,
  },

  'express-service-events': {
    id: 'express-service-events',
    compatibleWith: COMPATIBLE_PLUGIN_VERSION,
    description:
      'Add domain event definitions and event service integration for publishing domain events to the ADSP event service.',
    newFiles: {
      'src/events.ts': `import { DomainEventDefinition } from '@abgov/adsp-service-sdk';

// Domain event definitions for {projectName}.
// Event names use kebab-case. The namespace is set by the SDK from the serviceId.
// payloadSchema describes the event payload using JSON Schema.

export const {entityName}CreatedDefinition: DomainEventDefinition = {
  name: '{entity-name}-created',
  description: 'Signalled when a {entityName} is created.',
  payloadSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'ID of the created {entityName}.' },
    },
    required: ['id'],
  },
};
`,
    },
    integrationChanges: {
      'src/main.ts': {
        description:
          'Import event definitions from ./events, add them to the events array in initializeService, ' +
          'and destructure eventService from capabilities. ' +
          'The SDK automatically sets the namespace from serviceId.',
        pattern: `// Add import at top:
import { {entityName}CreatedDefinition } from './events';

// Add inside the initializeService({}) config object:
events: [
  {entityName}CreatedDefinition,
],

// Update capabilities destructuring to include eventService:
const { logger, tenantStrategy, traceHandler, configurationHandler, healthCheck, eventService } = capabilities;`,
      },
    },
    usageExample: `// Publish a domain event in a route handler:
app.post('/{projectName}/v1/{entities}', async (req, res) => {
  // ... create entity ...
  await eventService.send({
    namespace: '{projectName}',
    name: '{entity-name}-created',
    // tenantId is omitted — the SDK derives it from the service configuration
    payload: { id: entity.id },
  });
  res.status(201).json(entity);
});`,
  },

  'express-service-configuration': {
    id: 'express-service-configuration',
    compatibleWith: COMPATIBLE_PLUGIN_VERSION,
    description:
      'Add a service configuration schema to initializeService. Tenants configure the service ' +
      'via the ADSP tenant admin app; the configuration is accessible in route handlers via req.getConfiguration().',
    newFiles: {
      'src/configuration.ts': `// Service configuration schema and types.
// Tenants configure this service via the ADSP tenant admin app.
// The schema is validated against what tenants can store.

export interface {ServiceName}Configuration {
  // Add your configuration properties here.
  setting: string;
}

export const configurationSchema = {
  type: 'object',
  properties: {
    setting: {
      type: 'string',
      description: 'Example configuration setting.',
    },
  },
  additionalProperties: false,
};
`,
    },
    integrationChanges: {
      'src/main.ts': {
        description:
          'Import the schema and type, add a configuration block to initializeService, ' +
          'and enable configuration invalidation so the service reloads config when tenants update it.',
        pattern: `// Add import at top:
import { {ServiceName}Configuration, configurationSchema } from './configuration';

// Add inside the initializeService({}) config object:
configuration: {
  description: 'Configuration for {projectName}.',
  schema: configurationSchema,
},
enableConfigurationInvalidation: true,`,
      },
    },
    usageExample: `// Access configuration in a route handler:
app.get('/{projectName}/v1/config', async (req, res) => {
  const [configuration] = await req.getConfiguration<{ServiceName}Configuration>();
  res.json(configuration || {});
});`,
  },

  'express-service-file-types': {
    id: 'express-service-file-types',
    compatibleWith: COMPATIBLE_PLUGIN_VERSION,
    description:
      'Add file type definitions to initializeService. File types control who can upload and ' +
      'download files in the ADSP file service for this service.',
    newFiles: {
      'src/fileTypes.ts': `import { FileType } from '@abgov/adsp-service-sdk';

// File type definitions for {projectName}.
// readRoles and updateRoles use the role strings defined in roles.ts.
// Remove the SecurityClassification import/field if not needed.

export const {EntityName}FileType: FileType = {
  id: '{entity-name}-file',
  name: '{EntityName} file',
  anonymousRead: false,
  readRoles: ['{projectName}-user'],
  updateRoles: ['{projectName}-admin'],
};
`,
    },
    integrationChanges: {
      'src/main.ts': {
        description:
          'Import file type definitions and add them to the fileTypes array in initializeService. ' +
          'Also destructure tokenProvider from capabilities to call the file service.',
        pattern: `// Add import at top:
import { {EntityName}FileType } from './fileTypes';

// Add inside the initializeService({}) config object:
fileTypes: [{EntityName}FileType],

// Update capabilities destructuring to include tokenProvider:
const { logger, tenantStrategy, traceHandler, configurationHandler, healthCheck, tokenProvider } = capabilities;`,
      },
    },
    usageExample: `// Use the file service via the directory to get the upload URL:
const fileServiceUrl = await directory.getServiceUrl(AdspId.parse('urn:ads:platform:file-service'));

// Upload a file (multipart/form-data) using tokenProvider for auth:
const token = await tokenProvider.getAccessToken();
// POST to \`\${fileServiceUrl}/file/v1/files\` with Authorization: Bearer \${token}`,
  },
};

const templateSummarySchema = z.object({
  id: z.string(),
  description: z.string(),
  compatibleWith: z.string(),
});

const templateSchema = z.object({
  id: z.string(),
  description: z.string(),
  compatibleWith: z.string(),
  newFiles: z.record(z.string()).optional(),
  integrationChanges: z.record(
    z.object({
      description: z.string(),
      pattern: z.string(),
    })
  ),
  usageExample: z.string().optional(),
});

export function createListNxAdspTemplatesTool() {
  return createTool({
    id: 'list-nx-adsp-templates',
    description:
      'List available nx-adsp code templates for ADSP service capabilities. ' +
      'Call this before get-nx-adsp-template to discover which templates are available.',
    inputSchema: z.object({}),
    outputSchema: z.object({
      templates: z.array(templateSummarySchema),
    }),
    execute: async () => ({
      templates: Object.values(templates).map(({ id, description, compatibleWith }) => ({
        id,
        description,
        compatibleWith,
      })),
    }),
  });
}

export function createGetNxAdspTemplateTool() {
  return createTool({
    id: 'get-nx-adsp-template',
    description:
      'Get a code template for an nx-adsp ADSP service capability. ' +
      'Templates include new files to create and changes to make to existing integration files (main.ts, etc.). ' +
      'Adapt the patterns to the specific project — replace placeholder names like {projectName} and {entityName} ' +
      'with the actual names from the conversation.',
    inputSchema: z.object({
      templateId: z.string().describe('Template ID from list-nx-adsp-templates.'),
    }),
    outputSchema: z.object({
      template: templateSchema.nullable(),
    }),
    execute: async ({ templateId }) => ({
      template: templates[templateId] ?? null,
    }),
  });
}

export function createNxAdspTemplateTools() {
  return {
    listNxAdspTemplatesTool: createListNxAdspTemplatesTool(),
    getNxAdspTemplateTool: createGetNxAdspTemplateTool(),
  };
}

export type ListNxAdspTemplatesTool = ReturnType<typeof createListNxAdspTemplatesTool>;
export type GetNxAdspTemplateTool = ReturnType<typeof createGetNxAdspTemplateTool>;
