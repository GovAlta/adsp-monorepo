import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import type { ToolExecutionContext } from '@mastra/core/tools';
import axios, { isAxiosError } from 'axios';
import { applyPatch, validate, type Operation } from 'fast-json-patch';
import type { Logger } from 'winston';
import z from 'zod';
import { AdspRequestContext } from '../types';

interface SchemaPatchToolsProps {
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  logger: Logger;
}

const jsonPatchOpSchema = z.object({
  op: z.enum(['add', 'remove', 'replace', 'move', 'copy', 'test']),
  path: z.string(),
  value: z.unknown().optional(),
  from: z.string().optional(),
});

/** Validates ops then returns a new patched document. Throws on the first validation error. */
function validateAndApplyOps(
  doc: Record<string, unknown>,
  ops: Operation[],
  schemaName: string,
): Record<string, unknown> {
  const error = validate(ops, doc);
  if (error) {
    throw new Error(`Invalid ${schemaName} patch operation: ${error.message}`);
  }
  return applyPatch(doc, ops, undefined, false).newDocument as Record<string, unknown>;
}

/**
 * Sorts remove operations in descending index order within each array path so
 * that removing element [2] does not shift [3] before it is also removed.
 */
function sortRemoveOps(ops: z.infer<typeof jsonPatchOpSchema>[]): z.infer<typeof jsonPatchOpSchema>[] {
  return [...ops].sort((a, b) => {
    if (a.op !== 'remove' || b.op !== 'remove') return 0;

    const aParent = a.path.substring(0, a.path.lastIndexOf('/'));
    const bParent = b.path.substring(0, b.path.lastIndexOf('/'));
    if (aParent !== bParent) return 0;

    const aIndex = parseInt(a.path.split('/').pop() ?? '', 10);
    const bIndex = parseInt(b.path.split('/').pop() ?? '', 10);
    if (isNaN(aIndex) || isNaN(bIndex)) return 0;

    return bIndex - aIndex; // descending — remove highest index first
  });
}

export async function createSchemaPatchTools({ directory, tokenProvider, logger }: SchemaPatchToolsProps) {
  const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);

  const formSchemaPatch = createTool({
    id: 'patch-form-schema',
    description: `Apply targeted RFC 6902 JSON Patch operations to the form dataSchema and/or uiSchema.

USE THIS instead of formConfigurationUpdateTool when making targeted changes to existing fields:
- Making a field required or optional
- Adding, removing, or changing a validation rule
- Updating a SHOW/HIDE rule
- Adding a control to an existing category
- Removing a field from both schemas

DO NOT use this tool for:
- Adding a brand new Category to the form
- Restructuring the top-level layout
- Moving a field from one category to another
- Any change where you need to see the full schema context first
Use formConfigurationRetrievalTool + formConfigurationUpdateTool for those cases.`,
    inputSchema: z.object({
      dataSchemaOps: z
        .array(jsonPatchOpSchema)
        .optional()
        .describe('RFC 6902 patch operations to apply to the dataSchema. Omit if no data schema changes needed.'),
      uiSchemaOps: z
        .array(jsonPatchOpSchema)
        .optional()
        .describe('RFC 6902 patch operations to apply to the uiSchema. Omit if no UI schema changes needed.'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      opsApplied: z.number(),
      formDefinitionId: z.string(),
    }),
    execute: async (inputData, context: ToolExecutionContext) => {
      const requestContext = context.requestContext as AdspRequestContext<{ formDefinitionId: string }>;
      const tenantId = requestContext.get('tenantId');
      const formDefinitionId = requestContext.get('formDefinitionId');

      const token = await tokenProvider.getAccessToken();

      // Fetch current schemas
      const latestUrl = new URL(
        `v2/configuration/form-service/${formDefinitionId}/latest`,
        configurationServiceUrl,
      );

      const { data: current } = await axios.get(latestUrl.href, {
        params: { tenantId: tenantId?.toString() },
        headers: { Authorization: `Bearer ${token}` },
      });

      let dataSchema = current.dataSchema ?? {};
      let uiSchema = current.uiSchema ?? {};

      if (inputData.dataSchemaOps?.length) {
        dataSchema = validateAndApplyOps(dataSchema, inputData.dataSchemaOps as Operation[], 'dataSchema');
        logger.debug(`Applied ${inputData.dataSchemaOps.length} dataSchema patch op(s).`, {
          context: 'formSchemaPatchTool',
          tenant: tenantId?.toString(),
          formDefinitionId,
        });
      }

      // Sort uiSchema removes descending to avoid pointer shifts before applying
      if (inputData.uiSchemaOps?.length) {
        const sortedOps = sortRemoveOps(inputData.uiSchemaOps);
        uiSchema = validateAndApplyOps(uiSchema, sortedOps as Operation[], 'uiSchema');
        logger.debug(`Applied ${inputData.uiSchemaOps.length} uiSchema patch op(s).`, {
          context: 'formSchemaPatchTool',
          tenant: tenantId?.toString(),
          formDefinitionId,
        });
      }

      // Write patched schemas back via Configuration Service
      try {
        const updateUrl = new URL(
          `v2/configuration/form-service/${formDefinitionId}`,
          configurationServiceUrl,
        );

        const { data } = await axios.patch(
          updateUrl.href,
          {
            operation: 'UPDATE',
            update: { id: formDefinitionId, dataSchema, uiSchema },
          },
          {
            params: { tenantId: tenantId?.toString() },
            headers: { Authorization: `Bearer ${await tokenProvider.getAccessToken()}` },
          },
        );

        logger.info(`Form schema patched successfully for definition ${formDefinitionId}.`, {
          context: 'formSchemaPatchTool',
          tenant: tenantId?.toString(),
          formDefinitionId,
          dataOps: inputData.dataSchemaOps?.length ?? 0,
          uiOps: inputData.uiSchemaOps?.length ?? 0,
        });

        return {
          success: true,
          opsApplied: (inputData.dataSchemaOps?.length ?? 0) + (inputData.uiSchemaOps?.length ?? 0),
          formDefinitionId,
        };
      } catch (err) {
        if (isAxiosError(err)) {
          const status = err.response?.status;
          const errorData = err.response?.data;

          if (status === 400) {
            throw new Error(
              `Schema validation failed after patch: ${errorData?.message ?? 'unknown error'}. Check that UI schema scopes match dataSchema properties.`,
            );
          } else if (status === 403) {
            throw new Error('Permission denied. You need the configuration-admin role to update form configurations.');
          } else if (errorData?.message) {
            throw new Error(`Configuration service error: ${errorData.message}`);
          }
        }
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to patch form schema: ${msg}`);
      }
    },
  });

  return { formSchemaPatch };
}

export type FormSchemaPatch = Awaited<ReturnType<typeof createSchemaPatchTools>>['formSchemaPatch'];
