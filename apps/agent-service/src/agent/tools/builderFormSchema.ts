import { createTool, type ToolExecutionContext } from '@mastra/core/tools';
import z from 'zod';
import { FORM_GENERATION_AGENT_ID } from '../model/executionLimits';
import type { AdspRequestContext } from '../types';
import { validateFormSchemas } from '../agents/forms/schema';
import { loadFormExamples } from '../agents/utils/loadFormExamples';

const formExampleGroups = [
  'controls',
  'layouts',
  'commonFields',
  'content',
  'repeating',
  'rules',
  'validation',
  'dataRegisters',
  'computed',
  'complex',
] as const;

/**
 * Tools that help the builder agent author ADSP JSON form schemas inside a workspace file, where there is no
 * form definition in the configuration service for the form configuration tools to read or write.
 */
export function createBuilderFormSchemaTools() {
  const builderFormSchemaValidate = createTool({
    id: 'validate-workspace-form-schema',
    description: `Validate a form dataSchema and uiSchema that you have written into the workspace (for example the
mock definition in src/lib/adspFormApi.ts). Pass both schemas as JSON objects. Checks that the data schema is valid
JSON Schema, that every Control and rule scope resolves to a data schema property, and that SHOW/HIDE fields are not
top-level required without a matching if/then. Does not read or write anything. Call it after writing or editing a
form definition and fix every reported error before telling the user the form is done.`,
    inputSchema: z.object({
      dataSchema: z.object({}).passthrough().describe('The JSON Schema (data schema) object of the form definition.'),
      uiSchema: z.object({}).passthrough().describe('The JSON Forms UI schema object of the form definition.'),
    }),
    outputSchema: z.object({
      ok: z.boolean(),
      errors: z.array(z.object({ path: z.string(), message: z.string() })),
      counts: z.object({
        propertyCount: z.number(),
        categoryCount: z.number(),
        controlCount: z.number(),
      }),
    }),
    execute: async ({ dataSchema, uiSchema }) => validateFormSchemas(dataSchema, uiSchema),
  });

  const formExamplesTool = createTool({
    id: 'get-form-examples',
    description: `Get worked examples of ADSP JSON form schemas (dataSchema and uiSchema pairs), plus best practices
and anti-patterns. Request only the groups you need — each group is large. Groups: controls (inputs, dates, radios,
text areas, file upload), layouts (vertical, horizontal, categorization, task list), commonFields (reusable name,
address, email and phone definitions), content (help text), repeating (lists of items), rules (show/hide/enable),
validation (required, patterns, custom messages), dataRegisters, computed, complex (full-form scenarios).`,
    inputSchema: z.object({
      groups: z
        .array(z.enum(formExampleGroups))
        .min(1)
        .max(3)
        .describe('Example groups to load. At most three at a time.'),
    }),
    outputSchema: z.object({ examples: z.string() }),
    // The form generation agent's own instructions carry a checklist of the anti-patterns, so it gets the examples
    // alone, as single-line JSON: about half the tokens of a group with the best practices and anti-patterns.
    execute: async ({ groups }, context?: ToolExecutionContext) => {
      const requestContext = context?.requestContext as AdspRequestContext<{ agentId: string }> | undefined;
      const formGeneration = requestContext?.get('agentId') === FORM_GENERATION_AGENT_ID;
      return {
        examples: loadFormExamples(groups, formGeneration ? { guidance: false, compactJson: true } : undefined),
      };
    },
  });

  return { builderFormSchemaValidate, formExamplesTool };
}
