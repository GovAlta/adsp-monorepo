import type { ServiceDirectory } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import type { ToolExecutionContext } from '@mastra/core/tools';
import type { Logger } from 'winston';
import z from 'zod';
import {
  accessClientDetailsSchema,
  accessClientSummarySchema,
  toClientDetails,
  toClientSummary,
  toProblemFields,
} from '../agents/access/discovery';
import { clientIdSchema, MAX_CLIENT_ID_LENGTH, toClientFailureFields } from './accessClientLookup';
import { describeClientDetails, describeClientLookup, describeClientSummary } from './accessClientModelOutput';
import { createModelOutput, describeItems, MAX_MODEL_LIST_ITEMS, ModelLine } from './accessModelOutput';
import { AccessReaders, createAccessReaders } from './accessReaders';
import {
  accessEnvironmentSchema,
  accessRealmSchema,
  accessResultFields,
  createAccessToolRunner,
  createInspectionTargetResolver,
  describeRealm,
  InspectionTarget,
  toTargetProblemFields,
} from './accessToolSupport';

const MAX_LISTED_CLIENTS = 100;

const listClientsInputSchema = z.object({
  search: z
    .string()
    .trim()
    .max(MAX_CLIENT_ID_LENGTH)
    .optional()
    .describe('Text in the client ID, name or description to filter by, such as part of an app name.'),
});

const getClientInputSchema = z.object({ clientId: clientIdSchema });

const clientsOutputSchema = z.object({
  ...accessResultFields,
  environment: accessEnvironmentSchema.optional(),
  realm: accessRealmSchema.optional(),
  search: z.string().optional(),
  clients: z.array(accessClientSummarySchema),
  truncated: z.boolean().optional(),
});

const clientOutputSchema = z.object({
  ...accessResultFields,
  environment: accessEnvironmentSchema.optional(),
  realm: accessRealmSchema.optional(),
  clientId: z.string(),
  suggestions: z.array(z.string()).optional(),
  client: accessClientDetailsSchema.optional(),
});

type ClientsOutput = z.infer<typeof clientsOutputSchema>;
type ClientOutput = z.infer<typeof clientOutputSchema>;

/**
 * Counts every listed client by origin when the model sees only the first ones, so it can still answer questions
 * such as "which of my clients are not platform clients?" for the whole list.
 */
function describeOriginCounts(clients: ClientsOutput['clients']): string | undefined {
  if (clients.length <= MAX_MODEL_LIST_ITEMS) {
    return undefined;
  }
  const counts = new Map<string, number>();
  for (const { origin } of clients) {
    counts.set(origin, (counts.get(origin) ?? 0) + 1);
  }
  return `origins of all ${clients.length}: ${[...counts].map(([origin, count]) => `${count} ${origin}`).join(', ')}`;
}

/**
 * The clients, with the message only when it says why the list is empty or cut short.
 */
function describeClientsOutput({ status, message, search, clients, truncated }: ClientsOutput): ModelLine[] {
  return [
    search && `search: "${search}"`,
    ...describeItems('clients', clients.map(describeClientSummary)),
    describeOriginCounts(clients),
    status === 'available' && (clients.length === 0 || truncated) && message,
  ];
}

function describeClientOutput(output: ClientOutput): ModelLine[] {
  return output.client ? describeClientDetails(output.client) : describeClientLookup(output);
}

function describeClientList(target: InspectionTarget, count: number, search?: string, truncated?: boolean): string {
  const matching = search ? ` matching "${search}"` : '';
  if (truncated) {
    return (
      `Showing the first ${count} clients${matching} in ${describeRealm(target)} (read-only). ` +
      'More clients exist; search by name or client ID to narrow the list.'
    );
  }
  if (count > 0) {
    return `Found ${count} client${count === 1 ? '' : 's'}${matching} in ${describeRealm(target)} (read-only).`;
  }
  return search
    ? `No clients${matching} were found in ${describeRealm(target)}.`
    : `No clients were returned for ${describeRealm(target)}. If you expected clients, you may not have permission to view them.`;
}

interface AccessClientToolsProps {
  logger: Logger;
  directory: ServiceDirectory;
  accessServiceUrl: URL;
  readers?: AccessReaders;
}

export function createAccessClientTools({ logger, directory, accessServiceUrl, readers }: AccessClientToolsProps) {
  const resolveInspectionTarget = createInspectionTargetResolver({ directory, accessServiceUrl });
  const { clientReader, clientLookup } = readers ?? createAccessReaders({ directory });
  const run = createAccessToolRunner({ logger, logContext: 'AccessClientTools', toolKind: 'Access client tool' });

  const listAccessClients = createTool({
    id: 'listAccessClients',
    description:
      'List the Keycloak clients (apps and services) in the realm with type, origin and whether each is enabled. ' +
      "Search by part of an app's name to find someone's app.",
    inputSchema: listClientsInputSchema,
    outputSchema: clientsOutputSchema,
    toModelOutput: createModelOutput<ClientsOutput>(describeClientsOutput),
    execute: async ({ search }, context: ToolExecutionContext) =>
      run('listAccessClients', context, async (user): Promise<ClientsOutput> => {
        const searchText = search || undefined;
        const target = await resolveInspectionTarget(user);
        if (target.ok === false) {
          return { ...toTargetProblemFields(target), clients: [] };
        }

        const { environment, realm, reader } = target.value;
        const listed = await clientReader.listClients(reader, { search: searchText, max: MAX_LISTED_CLIENTS + 1 });
        if (listed.ok === false) {
          return { ...toProblemFields(listed.problem), environment, realm, clients: [] };
        }

        const truncated = listed.value.length > MAX_LISTED_CLIENTS;
        const clients = listed.value
          .slice(0, MAX_LISTED_CLIENTS)
          .map(toClientSummary)
          .filter((client) => !!client);

        return {
          status: 'available',
          message: describeClientList(target.value, clients.length, searchText, truncated),
          environment,
          realm,
          ...(searchText ? { search: searchText } : {}),
          clients,
          ...(truncated ? { truncated } : {}),
        };
      }),
  });

  const getAccessClient = createTool({
    id: 'getAccessClient',
    description:
      "Get one client's configuration by client ID: authentication, flows, redirect URIs, web origins, roles, " +
      'scopes, protocol mappers, and token and logout settings.',
    inputSchema: getClientInputSchema,
    outputSchema: clientOutputSchema,
    toModelOutput: createModelOutput<ClientOutput>(describeClientOutput),
    execute: async ({ clientId }, context: ToolExecutionContext) =>
      run('getAccessClient', context, async (user): Promise<ClientOutput> => {
        const target = await resolveInspectionTarget(user);
        if (target.ok === false) {
          return { ...toTargetProblemFields(target), clientId };
        }

        const { environment, realm } = target.value;
        const found = await clientLookup.lookupClient(target.value, clientId);
        if (found.ok === false) {
          return toClientFailureFields(target.value, clientId, found.failure);
        }

        const client = toClientDetails(found.value.configuration);
        return {
          status: 'available',
          message: `Client ${client.clientId} in ${describeRealm(target.value)} (read-only). Secrets and credentials are not included.`,
          environment,
          realm,
          clientId,
          client,
        };
      }),
  });

  return { listAccessClients, getAccessClient };
}
