import type { ServiceDirectory } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import type { ToolExecutionContext } from '@mastra/core/tools';
import type { Logger } from 'winston';
import z from 'zod';
import {
  createRealmClient,
  findAccessEnvironmentByOrigin,
  getAccessEnvironments,
  resolveAccessScope,
  resolveRealmRecord,
  toEnvironmentSummary,
  toProblemFields,
} from '../agents/access/discovery';
import {
  createModelOutput,
  describeFieldsLine,
  describeItems,
  describeList,
  describeRealmRecord,
  flag,
  joinParts,
} from './accessModelOutput';
import {
  accessEnvironmentSchema,
  accessRealmSchema,
  accessResultFields,
  createAccessToolRunner,
} from './accessToolSupport';

const environmentsOutputSchema = z.object({
  ...accessResultFields,
  environments: z.array(accessEnvironmentSchema.extend({ current: z.boolean(), inspectable: z.boolean() })),
});

const realmsOutputSchema = z.object({
  ...accessResultFields,
  environment: accessEnvironmentSchema.optional(),
  realms: z.array(accessRealmSchema),
});

const realmInfoOutputSchema = z.object({
  ...accessResultFields,
  environment: accessEnvironmentSchema.optional(),
  realm: accessRealmSchema
    .extend({
      issuer: z.string(),
      endpoints: z.object({
        openIdConfiguration: z.string().optional(),
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

function describeEnvironment({
  id,
  label,
  host,
  readOnly,
  current,
  inspectable,
}: EnvironmentsOutput['environments'][number]) {
  const facts = joinParts([readOnly && 'read-only', flag(current, 'current'), flag(inspectable, 'inspectable')]);
  return `${label} (${id}): ${host}, ${facts}`;
}

interface AccessDiscoveryToolsProps {
  logger: Logger;
  directory: ServiceDirectory;
  accessServiceUrl: URL;
}

export function createAccessDiscoveryTools({ logger, directory, accessServiceUrl }: AccessDiscoveryToolsProps) {
  const realmClient = createRealmClient({ directory });
  const run = createAccessToolRunner({
    logger,
    logContext: 'AccessDiscoveryTools',
    toolKind: 'Access discovery tool',
  });

  const listAccessEnvironments = createTool({
    id: 'listAccessEnvironments',
    description:
      'List the Access Service environments with their Keycloak hosts, and which one this session can inspect.',
    inputSchema: z.object({}),
    outputSchema: environmentsOutputSchema,
    toModelOutput: createModelOutput<EnvironmentsOutput>(({ environments }) =>
      describeItems('environments', environments.map(describeEnvironment)),
    ),
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
    description:
      'List the realms the signed-in user can inspect: their tenant realm, or the core realm for core users.',
    inputSchema: z.object({}),
    outputSchema: realmsOutputSchema,
    toModelOutput: createModelOutput<RealmsOutput>(({ realms }) => [
      describeList('realms', realms.map(describeRealmRecord)),
    ]),
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
    description: "Get the signed-in user's realm ID, name, environment, issuer and public OpenID endpoints.",
    inputSchema: z.object({}),
    outputSchema: realmInfoOutputSchema,
    toModelOutput: createModelOutput<RealmInfoOutput>(({ realm }) => [
      realm && `issuer: ${realm.issuer}`,
      realm && describeFieldsLine('endpoints', realm.endpoints),
    ]),
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
