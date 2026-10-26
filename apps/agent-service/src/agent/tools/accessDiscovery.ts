import type { ServiceDirectory, User } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import type { ToolExecutionContext } from '@mastra/core/tools';
import type { Logger } from 'winston';
import z from 'zod';
import {
  ACCESS_DISCOVERY_REASONS,
  AccessDiscoveryProblem,
  AccessRealmRecord,
  AvailableAccessScope,
  createProblem,
  createRealmClient,
  findAccessEnvironmentByOrigin,
  getAccessEnvironments,
  RealmClient,
  RealmClientResult,
  resolveAccessScope,
  toEnvironmentSummary,
} from '../agents/access/discovery';
import { AdspRequestContext } from '../types';

const LOG_CONTEXT = 'AccessDiscoveryTools';

const environmentSchema = z.object({
  id: z.string(),
  label: z.string(),
  host: z.string(),
  readOnly: z.boolean(),
});

// Output schemas double as an allowlist: fields not listed here are stripped before reaching the model or UI.
const resultFields = {
  status: z.enum(['available', 'unavailable', 'not-found', 'unreachable']),
  reason: z.enum(ACCESS_DISCOVERY_REASONS).optional(),
  missingRoles: z.array(z.string()).optional(),
  message: z.string(),
};

const realmSchema = z.object({
  realm: z.string(),
  name: z.string(),
  kind: z.enum(['tenant', 'core']),
  status: z.string().optional(),
});

const environmentsOutputSchema = z.object({
  ...resultFields,
  environments: z.array(environmentSchema.extend({ current: z.boolean(), inspectable: z.boolean() })),
});

const realmsOutputSchema = z.object({
  ...resultFields,
  environment: environmentSchema.optional(),
  realms: z.array(realmSchema),
});

const realmInfoOutputSchema = z.object({
  ...resultFields,
  environment: environmentSchema.optional(),
  realm: realmSchema
    .extend({
      issuer: z.string(),
      endpoints: z.object({
        authorization: z.string().optional(),
        token: z.string().optional(),
        userInfo: z.string().optional(),
        endSession: z.string().optional(),
        jwks: z.string().optional(),
      }),
    })
    .optional(),
});

type EnvironmentsOutput = z.infer<typeof environmentsOutputSchema>;
type RealmsOutput = z.infer<typeof realmsOutputSchema>;
type RealmInfoOutput = z.infer<typeof realmInfoOutputSchema>;

const SCOPE_RULES =
  'Takes no input: the environment and realm always come from the signed-in user, and any input is ignored. ' +
  'Read-only. If status is not "available", tell the user the returned message instead of guessing.';

function getRequestUser(context: ToolExecutionContext): { user?: User; tenantId?: string } {
  const requestContext = context?.requestContext as AdspRequestContext | undefined;
  return {
    user: requestContext?.get('user'),
    tenantId: requestContext?.get('tenantId')?.toString(),
  };
}

function toProblemFields({ status, reason, message, missingRoles }: AccessDiscoveryProblem) {
  return { status, reason, message, ...(missingRoles ? { missingRoles } : {}) };
}

async function resolveRealmRecord(
  realmClient: RealmClient,
  user: User,
  scope: AvailableAccessScope,
): Promise<RealmClientResult<AccessRealmRecord>> {
  if (scope.realm.kind === 'core') {
    return { ok: true, value: { realm: scope.realm.id, name: 'Core', kind: 'core' } };
  }

  const tenantRealm = await realmClient.getTenantRealm(user);
  if (tenantRealm.ok === true && tenantRealm.value.realm !== scope.realm.id) {
    return { ok: false, problem: createProblem('unavailable', 'REALM_MISMATCH') };
  }

  return tenantRealm;
}

interface LoggableResult {
  status?: string;
  reason?: string;
  environment?: { id?: string };
}

interface AccessDiscoveryToolsProps {
  logger: Logger;
  directory: ServiceDirectory;
  accessServiceUrl: URL;
}

export function createAccessDiscoveryTools({ logger, directory, accessServiceUrl }: AccessDiscoveryToolsProps) {
  const realmClient = createRealmClient({ directory });

  function logResult(toolId: string, { user, tenantId }: { user?: User; tenantId?: string }, result: LoggableResult) {
    logger.info(`Access discovery tool '${toolId}' completed with status '${result.status}'.`, {
      context: LOG_CONTEXT,
      tenant: tenantId,
      user: user?.id,
      environment: result.environment?.id,
      reason: result.reason,
    });
  }

  async function run<T extends LoggableResult>(
    toolId: string,
    context: ToolExecutionContext,
    execute: (user: User | undefined) => Promise<T>,
  ): Promise<T> {
    const requestUser = getRequestUser(context);
    try {
      const result = await execute(requestUser.user);
      logResult(toolId, requestUser, result);
      return result;
    } catch (err) {
      logger.warn(`Access discovery tool '${toolId}' failed: ${err instanceof Error ? err.message : String(err)}`, {
        context: LOG_CONTEXT,
        tenant: requestUser.tenantId,
        user: requestUser.user?.id,
      });
      throw err;
    }
  }

  const listAccessEnvironments = createTool({
    id: 'listAccessEnvironments',
    description: `List the known Access Service environments with their Keycloak hosts, and show which one can be inspected from this session. ${SCOPE_RULES}`,
    inputSchema: z.object({}),
    outputSchema: environmentsOutputSchema,
    execute: async (_input, context: ToolExecutionContext) =>
      run('listAccessEnvironments', context, async (user): Promise<EnvironmentsOutput> => {
        const scope = resolveAccessScope(user, accessServiceUrl);
        const environments = getAccessEnvironments(accessServiceUrl);
        const current = findAccessEnvironmentByOrigin(environments, accessServiceUrl.origin);
        const inspectableId = scope.status === 'available' ? scope.environment.id : undefined;
        const others = environments.filter(({ id }) => id !== inspectableId).map(({ label }) => label);

        return {
          ...(scope.status === 'available'
            ? {
                status: 'available' as const,
                message:
                  `This session is signed in to ${scope.environment.label}, so ${scope.environment.label} can be inspected (read-only).` +
                  (others.length ? ` ${others.join(', ')} cannot be inspected from this session.` : ''),
              }
            : toProblemFields(scope)),
          environments: environments.map((environment) => ({
            ...toEnvironmentSummary(environment),
            current: environment.id === current?.id,
            inspectable: environment.id === inspectableId,
          })),
        };
      }),
  });

  const listAccessRealms = createTool({
    id: 'listAccessRealms',
    description: `List the realms the signed-in user can inspect in this environment: their own tenant realm, or the core realm for core users. ${SCOPE_RULES}`,
    inputSchema: z.object({}),
    outputSchema: realmsOutputSchema,
    execute: async (_input, context: ToolExecutionContext) =>
      run('listAccessRealms', context, async (user): Promise<RealmsOutput> => {
        const scope = resolveAccessScope(user, accessServiceUrl);
        if (scope.status !== 'available') {
          return { ...toProblemFields(scope), environment: scope.environment, realms: [] };
        }

        const realmRecord = await resolveRealmRecord(realmClient, user, scope);
        if (realmRecord.ok === false) {
          return { ...toProblemFields(realmRecord.problem), environment: scope.environment, realms: [] };
        }

        const { realm, name } = realmRecord.value;
        return {
          status: 'available',
          message: `You can inspect 1 realm in ${scope.environment.label} (read-only): ${name} (${realm}).`,
          environment: scope.environment,
          realms: [realmRecord.value],
        };
      }),
  });

  const getAccessRealmInfo = createTool({
    id: 'getAccessRealmInfo',
    description: `Get basic identifying information for the signed-in user's realm: realm ID, name, environment, issuer and public OpenID endpoints. ${SCOPE_RULES}`,
    inputSchema: z.object({}),
    outputSchema: realmInfoOutputSchema,
    execute: async (_input, context: ToolExecutionContext) =>
      run('getAccessRealmInfo', context, async (user): Promise<RealmInfoOutput> => {
        const scope = resolveAccessScope(user, accessServiceUrl);
        if (scope.status !== 'available') {
          return { ...toProblemFields(scope), environment: scope.environment };
        }

        const realmRecord = await resolveRealmRecord(realmClient, user, scope);
        if (realmRecord.ok === false) {
          return { ...toProblemFields(realmRecord.problem), environment: scope.environment };
        }

        const configuration = await realmClient.getRealmOpenIdConfiguration(
          scope.environment.host,
          realmRecord.value.realm,
        );
        if (configuration.ok === false) {
          return { ...toProblemFields(configuration.problem), environment: scope.environment };
        }

        const { realm, name } = realmRecord.value;
        return {
          status: 'available',
          message: `Realm ${name} (${realm}) in ${scope.environment.label} is reachable and can be inspected (read-only).`,
          environment: scope.environment,
          realm: { ...realmRecord.value, ...configuration.value },
        };
      }),
  });

  return { listAccessEnvironments, listAccessRealms, getAccessRealmInfo };
}
