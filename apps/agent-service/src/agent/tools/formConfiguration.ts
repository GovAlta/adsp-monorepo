import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import axios, { isAxiosError } from 'axios';
import type { Logger } from 'winston';
import z from 'zod';
import { AdspRequestContext } from '../types';

interface FormConfigurationToolsProps {
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  logger: Logger;
}

export async function createFormConfigurationTools({ directory, tokenProvider, logger }: FormConfigurationToolsProps) {
  const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);

  const formConfigurationRetrievalTool = createTool({
    id: 'get-form-configuration',
    description:
      'Retrieve the JSON form configuration. The form definition ID comes from request context (no input required).',
    inputSchema: z.object({}),
    outputSchema: z.object({
      name: z.string(),
      description: z.string(),
      dataSchema: z.object({}).passthrough(),
      uiSchema: z.object({}).passthrough(),
      anonymousApply: z.boolean(),
      applicantRoles: z.array(z.string()),
      assessorRoles: z.array(z.string()),
    }),
    execute: async (_, { requestContext }: { requestContext: AdspRequestContext<{ formDefinitionId: string }> }) => {
      const tenantId = requestContext.get('tenantId');
      const formDefinitionId = requestContext.get('formDefinitionId');

      try {
        const formDefinitionUrl = new URL(
          `v2/configuration/form-service/${formDefinitionId}/latest`,
          configurationServiceUrl,
        );

        const { data } = await axios.get(formDefinitionUrl.href, {
          params: {
            tenantId: tenantId?.toString(),
          },
          headers: {
            Authorization: `Bearer ${await tokenProvider.getAccessToken()}`,
          },
        });

        logger.info(`Form configuration retrieved successfully for definition ${formDefinitionId}.`, {
          context: 'formConfigurationRetrievalTool',
          tenant: tenantId?.toString(),
          formDefinitionId,
        });

        return data;
      } catch (err) {
        logger.error(`Form configuration retrieval failed for definition ${formDefinitionId}.`, {
          context: 'formConfigurationRetrievalTool',
          tenant: tenantId?.toString(),
          formDefinitionId,
          error: isAxiosError(err)
            ? {
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data,
              }
            : String(err),
        });

        if (isAxiosError(err)) {
          const status = err.response?.status;
          const errorData = err.response?.data;

          if (status === 404) {
            throw new Error(
              `Form configuration not found. The form definition '${formDefinitionId}' may not exist or you may not have access to it.`,
            );
          } else if (status === 403) {
            throw new Error('Permission denied. You need the configuration-admin role to access form configurations.');
          } else if (status === 401) {
            throw new Error('Authentication failed. Your session may have expired.');
          } else if (status === 400 && errorData?.message) {
            throw new Error(`Invalid request: ${errorData.message}`);
          } else if (errorData?.message) {
            throw new Error(`Configuration service error: ${errorData.message}`);
          }
        }

        throw new Error(`Failed to retrieve form configuration: ${err.message}`);
      }
    },
  });

  const formConfigurationUpdateTool = createTool({
    id: 'update-form-configuration',
    description:
      'Update the JSON form configuration. The form definition ID comes from request context. Typically update both dataSchema and uiSchema together in a single call.',
    inputSchema: z.object({
      name: z.string().optional().describe('The name of the form.'),
      description: z.string().optional().describe('The description of the form.'),
      dataSchema: z.object({}).passthrough().optional().describe('The data schema for the JSON form.'),
      uiSchema: z.object({}).passthrough().optional().describe('The UI schema for the JSON form.'),
      anonymousApply: z
        .boolean()
        .optional()
        .describe('Flag indicating if form can be submit by unauthenticated users.'),
    }),
    outputSchema: z.object({
      name: z.string().describe('The name of the form.'),
      description: z.string().describe('The description of the form.'),
      dataSchema: z.object({}).passthrough().describe('The data schema for the JSON form.'),
      uiSchema: z.object({}).passthrough().describe('The UI schema for the JSON form.'),
      anonymousApply: z.boolean().describe('Flag indicating if form can be submit by unauthenticated users.'),
      applicantRoles: z.array(z.string()).describe('Collection of roles permitted to submit a form.'),
      assessorRoles: z.array(z.string()).describe('Collection of roles permitted to review submitted forms.'),
    }),
    execute: async (
      inputData,
      { requestContext }: { requestContext: AdspRequestContext<{ formDefinitionId: string }> },
    ) => {
      const { name, dataSchema, uiSchema, anonymousApply } = inputData;

      const tenantId = requestContext.get('tenantId');
      const formDefinitionId = requestContext.get('formDefinitionId');

      try {
        const configurationServiceUrl = await directory.getServiceUrl(
          adspId`urn:ads:platform:configuration-service:v2`,
        );
        const formDefinitionUrl = new URL(`v2/configuration/form-service/${formDefinitionId}`, configurationServiceUrl);

        const { data, status } = await axios.patch(
          formDefinitionUrl.href,
          {
            operation: 'UPDATE',
            update: {
              id: formDefinitionId,
              name,
              dataSchema,
              uiSchema,
              anonymousApply,
            },
          },
          {
            params: {
              tenantId: tenantId?.toString(),
            },
            headers: {
              Authorization: `Bearer ${await tokenProvider.getAccessToken()}`,
            },
          },
        );

        logger.info(`Form configuration updated successfully (status: ${status}).`, {
          context: 'formConfigurationUpdateTool',
          tenant: tenantId?.toString(),
          formDefinitionId,
          updatedFields: Object.keys(inputData).filter((key) => inputData[key] !== undefined),
        });

        return data.latest.configuration;
      } catch (err) {
        logger.error(`Form configuration update failed for definition ${formDefinitionId}.`, {
          context: 'formConfigurationUpdateTool',
          tenant: tenantId?.toString(),
          formDefinitionId,
          updatedFields: Object.keys(inputData).filter((key) => inputData[key] !== undefined),
          error: isAxiosError(err)
            ? {
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data,
              }
            : String(err),
        });

        if (isAxiosError(err)) {
          const status = err.response?.status;
          const errorData = err.response?.data;

          if (status === 404) {
            throw new Error(
              `Form configuration not found. The form definition '${formDefinitionId}' may not exist or you may not have access to it.`,
            );
          } else if (status === 403) {
            throw new Error('Permission denied. You need the configuration-admin role to update form configurations.');
          } else if (status === 401) {
            throw new Error('Authentication failed. Your session may have expired.');
          } else if (status === 400) {
            // Validation errors are common with schema mismatches
            const message = errorData?.message || 'Invalid form configuration';
            throw new Error(
              `Validation failed: ${message}. Check that UI schema scopes reference properties in the data schema, and that all required fields are properly defined.`,
            );
          } else if (errorData?.message) {
            throw new Error(`Configuration service error: ${errorData.message}`);
          }
        }

        throw new Error(`Failed to update form configuration: ${err.message}`);
      }
    },
  });

  return { formConfigurationRetrievalTool, formConfigurationUpdateTool };
}

export type FormConfigurationRetrievalTool = Awaited<
  ReturnType<typeof createFormConfigurationTools>
>['formConfigurationRetrievalTool'];
export type formConfigurationUpdateTool = Awaited<
  ReturnType<typeof createFormConfigurationTools>
>['formConfigurationUpdateTool'];
