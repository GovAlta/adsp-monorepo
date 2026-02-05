import { AdspId, adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import axios from 'axios';
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
    description: 'Retrieve the JSON form configuration for a given form definition ID.',
    inputSchema: z.object({}),
    outputSchema: z.object({
      dataSchema: z.record(z.string(), z.unknown()),
      uiSchema: z.record(z.string(), z.unknown()),
      anonymousApply: z.boolean(),
      applicantRoles: z.array(z.string()),
      assessorRoles: z.array(z.string()),
    }),
    execute: async (_, { requestContext }: { requestContext: AdspRequestContext<{ formDefinitionId: string }> }) => {
      const tenantId = requestContext.get('tenantId') as AdspId;
      const formDefinitionId = requestContext.get('formDefinitionId') as string;

      const formDefinitionUrl = new URL(
        `v2/configuration/form-service/${formDefinitionId}/latest`,
        configurationServiceUrl
      );

      const { data } = await axios.get(formDefinitionUrl.href, {
        params: {
          tenantId: tenantId?.toString(),
        },
        headers: {
          Authorization: `Bearer ${await tokenProvider.getAccessToken()}`,
        },
      });
      logger.info(`Form configuration for definition with ID ${formDefinitionId} retrieved: ${JSON.stringify(Object.keys(data))}.`, {
        context: 'formConfigurationUpdateTool',
        tenant: tenantId?.toString(),
      });
      return data;
    },
  });

  const formConfigurationUpdateTool = createTool({
    id: 'update-form-configuration',
    description: 'Update the JSON form configuration for a given form definition ID.',
    inputSchema: z.object({
      formDefinitionName: z.string().describe('The name of the form definition.'),
      dataSchema: z.string().describe('The data schema for the form.'),
      uiSchema: z.string().describe('The UI schema for the form.'),
      anonymousApply: z.boolean().default(false),
      applicantRoles: z.array(z.string()).default([]),
      assessorRoles: z.array(z.string()).default([]),
    }),
    outputSchema: z.object({
      dataSchema: z.record(z.string(), z.unknown()),
      uiSchema: z.record(z.string(), z.unknown()),
    }),
    execute: async (inputData, { requestContext }: { requestContext: AdspRequestContext<{ formDefinitionId: string }> }) => {
      const { formDefinitionName, dataSchema, uiSchema, anonymousApply, applicantRoles, assessorRoles } = inputData;

      const tenantId = requestContext.get('tenantId') as AdspId;
      const formDefinitionId = requestContext.get('formDefinitionId') as string;
      const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);
      const formDefinitionUrl = new URL(`v2/configuration/form-service/${formDefinitionId}`, configurationServiceUrl);

      const { data, status } = await axios.patch(
        formDefinitionUrl.href,
        {
          operation: 'UPDATE',
          update: {
            id: formDefinitionId,
            name: formDefinitionName,
            dataSchema: JSON.parse(dataSchema),
            uiSchema: JSON.parse(uiSchema),
            anonymousApply,
            applicantRoles,
            assessorRoles,
          },
        },
        {
          params: {
            tenantId: tenantId?.toString(),
          },
          headers: {
            Authorization: `Bearer ${await tokenProvider.getAccessToken()}`,
          },
        }
      );
      logger.info(`Form configuration update status: ${status}`, {
        context: 'formConfigurationUpdateTool',
        tenant: tenantId?.toString(),
      });
      return data?.latest?.configuration;
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
