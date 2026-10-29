import { adspId, AdspId, ServiceDirectory, User } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import type { ToolExecutionContext } from '@mastra/core/tools';
import axios, { isAxiosError } from 'axios';
import * as HttpStatusCodes from 'http-status-codes';
import type { Logger } from 'winston';
import z from 'zod';
import { AdspRequestContext } from '../types';

const DATA_REGISTER_NAMESPACE = 'data-register';

// Same rule form-service applies to register names (apps/form-service/src/form/router/register.ts): 1 to 50 letters,
// digits, hyphens, underscores and spaces, not starting or ending with a space. Checked here so an invalid name is
// rejected before any call to form-service.
const REGISTER_NAME_PATTERN =/^[a-zA-Z0-9-_](?:[a-zA-Z0-9-_ ]{0,48}[a-zA-Z0-9-_])?$/;

export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Reconnect and try again.';

type DataRegisterEntry = string | Record<string, unknown>;

interface DataRegisterResponse {
  namespace: string;
  name: string;
  description: string;
  entries: DataRegisterEntry[];
}

interface RegisterErrorMessages {
  notFound?: string;
  conflict?: string;
}

const createRegisterEntriesSchema = () => z.array(z.union([z.string(), z.record(z.unknown())]));

const registerNameDescription =
  '1 to 50 letters, numbers, spaces, hyphens or underscores, not starting or ending with a space.';

// The URN is left unencoded, the same as TMW: jsonforms resolves registers by exact URN match and saved forms embed it.
const toUrn = (name: string): string =>
  `urn:ads:platform:configuration:v2:/configuration/${DATA_REGISTER_NAMESPACE}/${name}`;

const getNotFoundMessage = (name: string): string => `Data register '${name}' does not exist.`;

function assertValidName(name: string): void {
  if (!REGISTER_NAME_PATTERN.test(name)) {
    throw new Error(
      `Invalid register name '${name}'. Use 1–50 letters, numbers, spaces, hyphens or underscores, with no space at the start or end.`,
    );
  }
}

// The agent router waits for a streaming response to finish before disconnecting an expired session, so a tool can
// run after the user's token has expired.
function assertSessionActive(user: User | undefined): asserts user is User {
  const exp = user?.token?.exp;
  if (!user?.token?.bearer || (typeof exp === 'number' && exp * 1000 <= Date.now())) {
    throw new Error(SESSION_EXPIRED_MESSAGE);
  }
}

function toToolError(action: string, err: unknown, messages: RegisterErrorMessages = {}): Error {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    if (status === HttpStatusCodes.UNAUTHORIZED) {
      return new Error(SESSION_EXPIRED_MESSAGE);
    }
    if (status === HttpStatusCodes.NOT_FOUND && messages.notFound) {
      return new Error(messages.notFound);
    }
    if (status === HttpStatusCodes.CONFLICT && messages.conflict) {
      return new Error(messages.conflict);
    }

    const errorMessage = (err.response?.data as { errorMessage?: string })?.errorMessage;
    return new Error(`Failed to ${action}: ${errorMessage || err.message}`);
  }

  return new Error(`Failed to ${action}: ${err instanceof Error ? err.message : String(err)}`);
}

function getErrorDetails(err: unknown) {
  return isAxiosError(err)
    ? {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
      }
    : String(err);
}

interface DataRegisterToolsProps {
  directory: ServiceDirectory;
  logger: Logger;
}

/**
 * Data register tools call the form-service register API as the signed-in user, so form-service applies the same
 * register rules as TMW and its audit log shows the user as the actor.
 */
export async function createDataRegisterTools({ directory, logger }: DataRegisterToolsProps) {
  const formServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:form-service:v1`);

  const getRegistersUrl = (name?: string): string =>
    new URL(name === undefined ? 'v1/registers' : `v1/registers/${encodeURIComponent(name)}`, formServiceUrl).href;

  const getRequestConfig = (user: User, tenantId: AdspId | undefined) => ({
    params: {
      tenantId: tenantId?.toString(),
    },
    headers: {
      Authorization: `Bearer ${user.token.bearer}`,
    },
  });

  const getRequestContext = (context: ToolExecutionContext) => {
    const requestContext = context.requestContext as AdspRequestContext;
    return { tenantId: requestContext.get('tenantId'), user: requestContext.get('user') };
  };

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
    execute: async (_, context: ToolExecutionContext) => {
      const { tenantId, user } = getRequestContext(context);
      assertSessionActive(user);

      try {
        const { data } = await axios.get<DataRegisterResponse[]>(getRegistersUrl(), getRequestConfig(user, tenantId));

        const registers = data.map((register) => ({
          name: register.name,
          description: register.description || '',
          urn: toUrn(register.name),
        }));

        logger.info(`Listed ${registers.length} data registers.`, {
          context: 'dataRegisterListTool',
          tenant: tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
        });

        return { registers };
      } catch (err) {
        logger.error('Failed to list data registers.', {
          context: 'dataRegisterListTool',
          tenant: tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
          error: getErrorDetails(err),
        });

        throw toToolError('list data registers', err);
      }
    },
  });

  const dataRegisterCreateTool = createTool({
    id: 'create-data-register',
    description:
      'Create a new data register with initial values. Data registers are reusable lists that can populate dropdowns across multiple forms. ' +
      'If a register with the same name already exists, nothing is changed and an error is returned.',
    inputSchema: z.object({
      name: z
        .string()
        .describe(
          `The name of the register: ${registerNameDescription} Kebab-case is preferred (e.g. "weekdays", "goa-ministries").`,
        ),
      description: z.string().optional().describe('A description of what the register contains.'),
      data: createRegisterEntriesSchema().describe(
        'The register values. Either an array of strings (e.g. ["Monday","Tuesday"]) or an array of objects (e.g. [{"label":"Alberta","value":"AB"}]).',
      ),
    }),
    outputSchema: z.object({
      name: z.string(),
      description: z.string(),
      urn: z.string(),
      data: createRegisterEntriesSchema(),
    }),
    execute: async (inputData, context: ToolExecutionContext) => {
      const { name, description, data: entries } = inputData;
      const { tenantId, user } = getRequestContext(context);
      assertValidName(name);
      assertSessionActive(user);

      try {
        const { data: register } = await axios.post<DataRegisterResponse>(
          getRegistersUrl(),
          { name, description, entries },
          getRequestConfig(user, tenantId),
        );

        logger.info(`Data register '${name}' created successfully.`, {
          context: 'dataRegisterCreateTool',
          tenant: tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
          registerName: name,
        });

        return {
          name: register.name,
          description: register.description || '',
          urn: toUrn(register.name),
          data: register.entries,
        };
      } catch (err) {
        logger.error(`Failed to create data register '${name}'.`, {
          context: 'dataRegisterCreateTool',
          tenant: tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
          registerName: name,
          error: getErrorDetails(err),
        });

        throw toToolError('create data register', err, {
          conflict: `Data register '${name}' already exists. Nothing was changed. Use the update flow (get → confirm → update) or choose another name.`,
        });
      }
    },
  });

  const dataRegisterGetTool = createTool({
    id: 'get-data-register',
    description:
      'Retrieve the current values of a specific data register by name. Use this to inspect register contents before making changes.',
    inputSchema: z.object({
      name: z.string().describe('The name of the register to retrieve (e.g. "weekdays", "event-types").'),
    }),
    outputSchema: z.object({
      name: z.string(),
      data: createRegisterEntriesSchema(),
    }),
    execute: async (inputData, context: ToolExecutionContext) => {
      const { name } = inputData;
      const { tenantId, user } = getRequestContext(context);
      assertValidName(name);
      assertSessionActive(user);

      try {
        const { data: register } = await axios.get<DataRegisterResponse>(
          getRegistersUrl(name),
          getRequestConfig(user, tenantId),
        );

        logger.info(`Retrieved data register '${name}'.`, {
          context: 'dataRegisterGetTool',
          tenant: tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
          registerName: name,
        });

        return {
          name: register.name,
          data: register.entries,
        };
      } catch (err) {
        logger.error(`Failed to retrieve data register '${name}'.`, {
          context: 'dataRegisterGetTool',
          tenant: tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
          registerName: name,
          error: getErrorDetails(err),
        });

        throw toToolError('retrieve data register', err, { notFound: getNotFoundMessage(name) });
      }
    },
  });

  const dataRegisterUpdateTool = createTool({
    id: 'update-data-register',
    description:
      'Update the values of an existing data register. Replaces all current values with the new data; the description is not changed. ' +
      'Returns an error if the register does not exist.',
    inputSchema: z.object({
      name: z.string().describe('The name of the existing register to update.'),
      data: createRegisterEntriesSchema().describe(
        'The new register values. Either an array of strings or an array of objects.',
      ),
    }),
    outputSchema: z.object({
      name: z.string(),
      data: createRegisterEntriesSchema(),
    }),
    execute: async (inputData, context: ToolExecutionContext) => {
      const { name, data: entries } = inputData;
      const { tenantId, user } = getRequestContext(context);
      assertValidName(name);
      assertSessionActive(user);

      try {
        const { data: register } = await axios.patch<DataRegisterResponse>(
          getRegistersUrl(name),
          { entries },
          getRequestConfig(user, tenantId),
        );

        logger.info(`Data register '${name}' updated successfully.`, {
          context: 'dataRegisterUpdateTool',
          tenant: tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
          registerName: name,
        });

        return {
          name: register.name,
          data: register.entries,
        };
      } catch (err) {
        logger.error(`Failed to update data register '${name}'.`, {
          context: 'dataRegisterUpdateTool',
          tenant: tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
          registerName: name,
          error: getErrorDetails(err),
        });

        throw toToolError('update data register', err, { notFound: getNotFoundMessage(name) });
      }
    },
  });

  return { dataRegisterListTool, dataRegisterCreateTool, dataRegisterGetTool, dataRegisterUpdateTool };
}
