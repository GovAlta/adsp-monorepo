import type { ServiceDirectory, User } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import type { ToolExecutionContext } from '@mastra/core/tools';
import type { Logger } from 'winston';
import z from 'zod';
import {
  accessClientDetailsSchema,
  accessClientSummarySchema,
  AccessDiscoveryProblem,
  AccessEnvironmentSummary,
  AccessRealmRecord,
  ClientReaderTarget,
  createClientReader,
  createProblem,
  createRealmClient,
  resolveAccessScope,
  resolveRealmRecord,
  toClientDetails,
  toClientSummary,
  toProblemFields,
} from '../agents/access/discovery';
import {
  accessEnvironmentSchema,
  accessRealmSchema,
  accessResultFields,
  createAccessToolRunner,
} from './accessToolSupport';

const MAX_LISTED_CLIENTS = 100;
const MAX_CLIENT_SUGGESTIONS = 5;
const MAX_CLIENT_ID_LENGTH = 255;

const listClientsInputSchema = z.object({
  search: z
    .string()
    .trim()
    .max(MAX_CLIENT_ID_LENGTH)
    .optional()
    .describe('Optional text to filter by. Only clients whose client ID contains it (ignoring case) are listed.'),
});

const getClientInputSchema = z.object({
  clientId: z
    .string()
    .trim()
    .min(1)
    .max(MAX_CLIENT_ID_LENGTH)
    .describe('The exact client ID of the client, for example urn:ads:platform:tenant-admin-app.'),
});

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

const INSPECTION_RULES =
  'Read-only. The environment and realm always come from the signed-in user and cannot be chosen. ' +
  'Secrets and credentials are never returned. The user sees the result as a card, so do not repeat it in your ' +
  'reply. If status is not "available", do not guess.';

interface InspectionTarget {
  environment: AccessEnvironmentSummary;
  realm: AccessRealmRecord;
  reader: ClientReaderTarget;
}

type InspectionTargetResult =
  | { ok: true; value: InspectionTarget }
  | { ok: false; problem: AccessDiscoveryProblem; environment?: AccessEnvironmentSummary };

function toTargetProblemFields({
  problem,
  environment,
}: {
  problem: AccessDiscoveryProblem;
  environment?: AccessEnvironmentSummary;
}) {
  return { ...toProblemFields(problem), ...(environment ? { environment } : {}) };
}

function describeRealm({ environment, realm }: InspectionTarget): string {
  return `realm ${realm.name} (${realm.realm}) in ${environment.label}`;
}

function describeClientList(target: InspectionTarget, count: number, search?: string, truncated?: boolean): string {
  const matching = search ? ` with a client ID containing "${search}"` : '';
  if (truncated) {
    return (
      `Showing the first ${count} clients${matching} in ${describeRealm(target)} (read-only). ` +
      'More clients exist; search by client ID to narrow the list.'
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
}

export function createAccessClientTools({ logger, directory, accessServiceUrl }: AccessClientToolsProps) {
  const realmClient = createRealmClient({ directory });
  const clientReader = createClientReader();
  const run = createAccessToolRunner({ logger, logContext: 'AccessClientTools', toolKind: 'Access client tool' });

  /**
   * Resolves where clients may be read from using only the verified user token, never model input.
   */
  async function resolveInspectionTarget(user: User | undefined): Promise<InspectionTargetResult> {
    const scope = resolveAccessScope(user, accessServiceUrl);
    if (scope.status !== 'available') {
      return { ok: false, problem: scope, environment: scope.environment };
    }

    const realmRecord = await resolveRealmRecord(realmClient, user, scope);
    if (realmRecord.ok === false) {
      return { ok: false, problem: realmRecord.problem, environment: scope.environment };
    }

    return {
      ok: true,
      value: {
        environment: scope.environment,
        realm: realmRecord.value,
        reader: { host: scope.environment.host, realm: realmRecord.value.realm, user },
      },
    };
  }

  async function reportClientNotFound(target: InspectionTarget, clientId: string): Promise<ClientOutput> {
    const { environment, realm, reader } = target;
    const similar = await clientReader.listClients(reader, { search: clientId, max: MAX_CLIENT_SUGGESTIONS });
    if (similar.ok === false) {
      return { ...toProblemFields(similar.problem), environment, realm, clientId };
    }

    const suggestions = similar.value
      .map((client) => toClientSummary(client)?.clientId)
      .filter((suggestion) => !!suggestion && suggestion !== clientId);

    return {
      ...toProblemFields(createProblem('not-found', 'CLIENT_NOT_FOUND')),
      environment,
      realm,
      clientId,
      ...(suggestions.length > 0 ? { suggestions } : {}),
    };
  }

  const listAccessClients = createTool({
    id: 'listAccessClients',
    description:
      "List the Keycloak clients in the signed-in user's realm with each client's ID, name, type (public, " +
      'confidential or bearer-only), protocol, whether it is enabled, and whether it is a Keycloak built-in client. ' +
      `Use getAccessClient for one client's configuration. ${INSPECTION_RULES}`,
    inputSchema: listClientsInputSchema,
    outputSchema: clientsOutputSchema,
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
      "Get the configuration of one Keycloak client in the signed-in user's realm by its exact client ID: type and " +
      'authentication, flows, redirect URIs, web origins, post-logout redirect URIs, client roles, client scopes, ' +
      'role scope mappings, protocol mappers, and token and logout settings. Protocol mappers are only those defined ' +
      'on the client itself; mappers from its assigned client scopes are not included. If no client has that ID, ' +
      `returns status "not-found" with any client IDs containing the text as suggestions. ${INSPECTION_RULES}`,
    inputSchema: getClientInputSchema,
    outputSchema: clientOutputSchema,
    execute: async ({ clientId }, context: ToolExecutionContext) =>
      run('getAccessClient', context, async (user): Promise<ClientOutput> => {
        const target = await resolveInspectionTarget(user);
        if (target.ok === false) {
          return { ...toTargetProblemFields(target), clientId };
        }

        const { environment, realm, reader } = target.value;
        const internalId = await clientReader.findClientInternalId(reader, clientId);
        if (internalId.ok === false) {
          return { ...toProblemFields(internalId.problem), environment, realm, clientId };
        }
        if (!internalId.value) {
          return reportClientNotFound(target.value, clientId);
        }

        const configuration = await clientReader.getClientConfiguration(reader, internalId.value);
        if (configuration.ok === false) {
          return { ...toProblemFields(configuration.problem), environment, realm, clientId };
        }

        const client = toClientDetails(configuration.value);
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
