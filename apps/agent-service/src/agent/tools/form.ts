import { adspId, ServiceDirectory } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import axios, { isAxiosError } from 'axios';
import { Logger } from 'winston';
import z from 'zod';
import { AdspRequestContext } from '../types';

interface FormToolsProps {
  logger: Logger;
  directory: ServiceDirectory;
}

export async function createFormTools({ directory, logger }: FormToolsProps) {
  const formServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:form-service:v1`);

  const formDataUpdateTool = createTool({
    id: 'set-form-data',
    description: 'Sets the field data for a form. The Form ID comes from request context (no input required).',
    inputSchema: z.object({
      data: z.object({}).passthrough().describe('Object representing the form data. Must be valid based on the form definition data schema.'),
    }),
    outputSchema: z.object({
      id: z.string(),
      data: z.object({}).passthrough(),
      files: z.record(z.string(), z.string())
    }),
    execute: async (inputData, { requestContext }: { requestContext: AdspRequestContext<{ formId: string }> }) => {
      const tenantId = requestContext.get('tenantId');
      const user = requestContext.get('user');
      const formId = requestContext.get('formId');

      const { data } = inputData;

      try {
        const formDataUrl = new URL(`v1/forms/${formId}/data`, formServiceUrl);

        const { data: result } = await axios.put(formDataUrl.href, { data }, {
          params: {
            tenantId: tenantId?.toString(),
          },
          headers: {
            Authorization: `Bearer ${user.token.bearer}`,
          },
        });

        logger.info(`Form updated successfully for form ${formId}.`, {
          context: 'formDataUpdateTool',
          tenant: tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
        });

        return result;
      } catch (err) {
        logger.error(`Form update failed for form ${formId}.`, {
          context: 'formDataUpdateTool',
          tenant: tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
          error: isAxiosError(err)
            ? {
              status: err.response?.status,
              statusText: err.response?.statusText,
              data: err.response?.data,
            }
            : String(err),
        });

        throw new Error(`Failed to update form: ${err.message}`);
      }
    },
  });
  
  const formDataRetrievalTool = createTool({
    id: 'read-form-data',
    description: 'Reads the field data for a form. The Form ID comes from request context (no input required).',
    inputSchema: z.object({}),
    outputSchema: z.object({
      id: z.string(),
      data: z.object({}).passthrough(),
      files: z.record(z.string(), z.string())
    }),
    execute: async (_, { requestContext }: { requestContext: AdspRequestContext<{ formId: string }> }) => {
      const tenantId = requestContext.get('tenantId');
      const user = requestContext.get('user');
      const formId = requestContext.get('formId');

      try {
        const formDataUrl = new URL(`v1/forms/${formId}/data`, formServiceUrl);

        const { data: result } = await axios.get(formDataUrl.href, {
          params: {
            tenantId: tenantId?.toString(),
          },
          headers: {
            Authorization: `Bearer ${user.token.bearer}`,
          },
        });

        logger.info(`Form read successfully for form ${formId}.`, {
          context: 'formDataRetrievalTool',
          tenant: tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
        });

        return result;
      } catch (err) {
        logger.error(`Form read failed for form ${formId}.`, {
          context: 'formDataRetrievalTool',
          tenant: tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
          error: isAxiosError(err)
            ? {
              status: err.response?.status,
              statusText: err.response?.statusText,
              data: err.response?.data,
            }
            : String(err),
        });

        throw new Error(`Failed to read form: ${err.message}`);
      }
    },
  });
  return {
    formDataRetrievalTool,
    formDataUpdateTool,
  }
}

export type formDataRetrievalTool = Awaited<ReturnType<typeof createFormTools>>['formDataRetrievalTool'];
export type formDataUpdateTool = Awaited<ReturnType<typeof createFormTools>>['formDataUpdateTool'];
