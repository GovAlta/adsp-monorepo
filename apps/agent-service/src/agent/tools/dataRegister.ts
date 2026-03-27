import { adspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import axios, { isAxiosError } from 'axios';
import type { Logger } from 'winston';
import z from 'zod';
import { AdspRequestContext } from '../types';

const DATA_REGISTER_NAMESPACE = 'data-register';

function buildRegisterSchema(data: Array<string | Record<string, unknown>>): Record<string, unknown> {
  const hasObjects = data.some((item) => typeof item === 'object' && item !== null);
  return {
    type: 'array',
    items: { type: hasObjects ? 'object' : 'string' },
  };
}

interface DataRegisterToolsProps {
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  logger: Logger;
}

export async function createDataRegisterTools({ directory, tokenProvider, logger }: DataRegisterToolsProps) {
  const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);

  const dataRegisterListTool = createTool({
    id: 'list-data-registers',
    description:
      'List existing data registers for the tenant. Returns names, descriptions, and URNs of all available registers.',
    inputSchema: z.object({}),
    outputSchema: z.object({
      registers: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          urn: z.string(),
        }),
      ),
    }),
    execute: async (_, { requestContext }: { requestContext: AdspRequestContext }) => {
      const tenantId = requestContext.get('tenantId');

      try {
        const configUrl = new URL('v2/configuration/platform/configuration-service/latest', configurationServiceUrl);

        const { data } = await axios.get(configUrl.href, {
          params: {
            tenantId: tenantId?.toString(),
          },
          headers: {
            Authorization: `Bearer ${await tokenProvider.getAccessToken()}`,
          },
        });

        const registers: Array<{ name: string; description: string; urn: string }> = [];
        const configuration = data?.configuration || data;

        for (const [key, value] of Object.entries(configuration)) {
          if (key.startsWith(`${DATA_REGISTER_NAMESPACE}:`)) {
            const def = value as Record<string, unknown>;
            const schema = def.configurationSchema as Record<string, unknown>;
            if (schema?.type === 'array') {
              const registerName = key.replace(`${DATA_REGISTER_NAMESPACE}:`, '');
              registers.push({
                name: registerName,
                description: (def.description as string) || '',
                urn: `urn:ads:platform:configuration:v2:/configuration/${DATA_REGISTER_NAMESPACE}/${registerName}`,
              });
            }
          }
        }

        logger.info(`Listed ${registers.length} data registers.`, {
          context: 'dataRegisterListTool',
          tenant: tenantId?.toString(),
        });

        return { registers };
      } catch (err) {
        logger.error('Failed to list data registers.', {
          context: 'dataRegisterListTool',
          tenant: tenantId?.toString(),
          error: isAxiosError(err)
            ? {
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data,
              }
            : String(err),
        });

        throw new Error(`Failed to list data registers: ${err.message}`);
      }
    },
  });

  const dataRegisterCreateTool = createTool({
    id: 'create-data-register',
    description:
      'Create a new data register with initial values. Data registers are reusable lists stored in the Configuration Service that can populate dropdowns across multiple forms.',
    inputSchema: z.object({
      name: z.string().describe('The name of the register (kebab-case, e.g. "weekdays", "goa-ministries").'),
      description: z.string().optional().describe('A description of what the register contains.'),
      data: z
        .array(z.union([z.string(), z.record(z.unknown())]))
        .describe(
          'The register values. Either an array of strings (e.g. ["Monday","Tuesday"]) or an array of objects (e.g. [{"label":"Alberta","value":"AB"}]).',
        ),
    }),
    outputSchema: z.object({
      name: z.string(),
      description: z.string(),
      urn: z.string(),
      data: z.array(z.union([z.string(), z.record(z.unknown())])),
    }),
    execute: async (inputData, { requestContext }: { requestContext: AdspRequestContext }) => {
      const { name, description, data: registerData } = inputData;
      const tenantId = requestContext.get('tenantId');

      try {
        // Step 1: Create the configuration definition
        const definitionUrl = new URL('v2/configuration/platform/configuration-service', configurationServiceUrl);

        await axios.patch(
          definitionUrl.href,
          {
            operation: 'UPDATE',
            update: {
              [`${DATA_REGISTER_NAMESPACE}:${name}`]: {
                configurationSchema: buildRegisterSchema(registerData),
                description: description || '',
              },
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

        // Step 2: Set the initial data
        const dataUrl = new URL(`v2/configuration/${DATA_REGISTER_NAMESPACE}/${name}`, configurationServiceUrl);

        await axios.patch(
          dataUrl.href,
          {
            operation: 'REPLACE',
            configuration: registerData,
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

        const urn = `urn:ads:platform:configuration:v2:/configuration/${DATA_REGISTER_NAMESPACE}/${name}`;

        logger.info(`Data register '${name}' created successfully.`, {
          context: 'dataRegisterCreateTool',
          tenant: tenantId?.toString(),
          registerName: name,
        });

        return {
          name,
          description: description || '',
          urn,
          data: registerData,
        };
      } catch (err) {
        logger.error(`Failed to create data register '${name}'.`, {
          context: 'dataRegisterCreateTool',
          tenant: tenantId?.toString(),
          registerName: name,
          error: isAxiosError(err)
            ? {
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data,
              }
            : String(err),
        });

        throw new Error(`Failed to create data register: ${err.message}`);
      }
    },
  });

  const dataRegisterUpdateTool = createTool({
    id: 'update-data-register',
    description: 'Update the values of an existing data register. Replaces all current values with the new data.',
    inputSchema: z.object({
      name: z.string().describe('The name of the existing register to update.'),
      data: z
        .array(z.union([z.string(), z.record(z.unknown())]))
        .describe('The new register values. Either an array of strings or an array of objects.'),
    }),
    outputSchema: z.object({
      name: z.string(),
      data: z.array(z.union([z.string(), z.record(z.unknown())])),
    }),
    execute: async (inputData, { requestContext }: { requestContext: AdspRequestContext }) => {
      const { name, data: registerData } = inputData;
      const tenantId = requestContext.get('tenantId');

      try {
        const dataUrl = new URL(`v2/configuration/${DATA_REGISTER_NAMESPACE}/${name}`, configurationServiceUrl);

        await axios.patch(
          dataUrl.href,
          {
            operation: 'REPLACE',
            configuration: registerData,
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

        logger.info(`Data register '${name}' updated successfully.`, {
          context: 'dataRegisterUpdateTool',
          tenant: tenantId?.toString(),
          registerName: name,
        });

        return {
          name,
          data: registerData,
        };
      } catch (err) {
        logger.error(`Failed to update data register '${name}'.`, {
          context: 'dataRegisterUpdateTool',
          tenant: tenantId?.toString(),
          registerName: name,
          error: isAxiosError(err)
            ? {
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data,
              }
            : String(err),
        });

        throw new Error(`Failed to update data register: ${err.message}`);
      }
    },
  });

  return { dataRegisterListTool, dataRegisterCreateTool, dataRegisterUpdateTool };
}
