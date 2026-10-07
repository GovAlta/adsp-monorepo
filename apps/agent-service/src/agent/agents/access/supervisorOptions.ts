import type { AgentExecutionOptions } from '@mastra/core/agent';
import type { Logger } from 'winston';
import { ACCESS_SERVICE_AGENT_MAX_STEPS } from '../../model/executionLimits';

export function createAccessServiceSupervisorOptions(
  logger: Logger,
  tenantId?: string,
): AgentExecutionOptions<undefined> {
  return {
    maxSteps: ACCESS_SERVICE_AGENT_MAX_STEPS,
    delegation: {
      hookErrorStrategy: 'warn',
      messageFilter: ({ messages }) => messages.slice(-10),
      onDelegationStart: ({ primitiveId }) => {
        logger.debug('Access Service supervisor delegated to a specialist.', {
          context: 'AccessServiceSupervisor',
          tenant: tenantId,
          specialist: primitiveId,
        });
      },
      onDelegationComplete: ({ primitiveId, success }) => {
        logger.debug('Access Service specialist delegation completed.', {
          context: 'AccessServiceSupervisor',
          tenant: tenantId,
          specialist: primitiveId,
          success,
        });

        if (!success) {
          return {
            resultText: `The ${primitiveId} specialist did not complete. Do not rely on its findings; use available verified information and explain the limitation.`,
          };
        }
      },
    },
  };
}
