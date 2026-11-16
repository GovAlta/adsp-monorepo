import type { ServiceDirectory, User } from '@abgov/adsp-service-sdk';
import type { ToolExecutionContext } from '@mastra/core/tools';
import type { Logger } from 'winston';
import z from 'zod';
import {
  ACCESS_DISCOVERY_REASONS,
  AccessDiscoveryProblem,
  AccessDiscoveryReason,
  AccessEnvironmentSummary,
  AccessRealmRecord,
  AdminReadTarget,
  createProblem,
  createRealmClient,
  resolveAccessScope,
  resolveRealmRecord,
  toProblemFields,
} from '../agents/access/discovery';
import { AdspRequestContext } from '../types';

/**
 * Schemas and execution support shared by the Access Service tools. Output schemas double as an allowlist:
 * fields not listed in them are stripped before reaching the model or UI.
 */

export const accessEnvironmentSchema = z.object({
  id: z.string(),
  label: z.string(),
  host: z.string(),
  readOnly: z.boolean(),
});

export const accessRealmSchema = z.object({
  realm: z.string(),
  name: z.string(),
  kind: z.enum(['tenant', 'core']),
  status: z.string().optional(),
});

export const accessResultFields = {
  status: z.enum(['available', 'unavailable', 'not-found', 'unreachable']),
  reason: z.enum(ACCESS_DISCOVERY_REASONS).optional(),
  missingRoles: z.array(z.string()).optional(),
  message: z.string(),
};

export interface AccessToolRequest {
  user?: User;
  tenantId?: string;
}

export function getAccessToolRequest(context: ToolExecutionContext): AccessToolRequest {
  const requestContext = context?.requestContext as AdspRequestContext | undefined;
  return {
    user: requestContext?.get('user'),
    tenantId: requestContext?.get('tenantId')?.toString(),
  };
}

interface LoggableResult {
  status?: string;
  reason?: string;
  environment?: { id?: string };
}

interface AccessToolRunnerProps {
  logger: Logger;
  logContext: string;
  toolKind: string;
}

/**
 * Creates a runner that executes an Access Service tool for the requesting user and logs the outcome.
 * Only IDs, status and reason are logged; tokens and personal details never are.
 */
export function createAccessToolRunner({ logger, logContext, toolKind }: AccessToolRunnerProps) {
  return async function run<T extends LoggableResult>(
    toolId: string,
    context: ToolExecutionContext,
    execute: (user: User | undefined) => Promise<T>,
  ): Promise<T> {
    const { user, tenantId } = getAccessToolRequest(context);
    try {
      const result = await execute(user);
      logger.info(`${toolKind} '${toolId}' completed with status '${result.status}'.`, {
        context: logContext,
        tenant: tenantId,
        user: user?.id,
        environment: result.environment?.id,
        reason: result.reason,
      });
      return result;
    } catch (err) {
      logger.warn(`${toolKind} '${toolId}' failed: ${err instanceof Error ? err.message : String(err)}`, {
        context: logContext,
        tenant: tenantId,
        user: user?.id,
      });
      throw err;
    }
  };
}

export interface InspectionTarget {
  environment: AccessEnvironmentSummary;
  realm: AccessRealmRecord;
  reader: AdminReadTarget;
}

export type InspectionTargetResult =
  | { ok: true; value: InspectionTarget }
  | { ok: false; problem: AccessDiscoveryProblem; environment?: AccessEnvironmentSummary };

interface EnvironmentRule {
  isAllowed: (environment: AccessEnvironmentSummary) => boolean;
  reason: AccessDiscoveryReason;
}

interface InspectionTargetResolverProps {
  directory: ServiceDirectory;
  accessServiceUrl: URL;
  environmentRule?: EnvironmentRule;
}

/**
 * Creates a resolver for where Keycloak may be read from, using only the verified user token, never model input.
 * An environment rule refuses an environment before anything is read from it.
 */
export function createInspectionTargetResolver({
  directory,
  accessServiceUrl,
  environmentRule,
}: InspectionTargetResolverProps) {
  const realmClient = createRealmClient({ directory });

  return async function resolveInspectionTarget(user: User | undefined): Promise<InspectionTargetResult> {
    const scope = resolveAccessScope(user, accessServiceUrl);
    if (scope.status !== 'available') {
      return { ok: false, problem: scope, environment: scope.environment };
    }
    if (environmentRule && !environmentRule.isAllowed(scope.environment)) {
      return {
        ok: false,
        problem: createProblem('unavailable', environmentRule.reason),
        environment: scope.environment,
      };
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
  };
}

/**
 * Returns the problem fields of a failed target resolution, with the environment when it is known.
 */
export function toTargetProblemFields({
  problem,
  environment,
}: {
  problem: AccessDiscoveryProblem;
  environment?: AccessEnvironmentSummary;
}) {
  return { ...toProblemFields(problem), ...(environment ? { environment } : {}) };
}

export function describeRealm({ environment, realm }: InspectionTarget): string {
  return `realm ${realm.name} (${realm.realm}) in ${environment.label}`;
}
