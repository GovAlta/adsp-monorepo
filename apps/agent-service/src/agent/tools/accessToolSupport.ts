import type { User } from '@abgov/adsp-service-sdk';
import type { ToolExecutionContext } from '@mastra/core/tools';
import type { Logger } from 'winston';
import z from 'zod';
import { ACCESS_DISCOVERY_REASONS } from '../agents/access/discovery';
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
