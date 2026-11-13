import type { AgentExecutionOptions } from '@mastra/core/agent';
import type { User } from '@abgov/adsp-service-sdk';
import type { Logger } from 'winston';
import { environment } from '../../../environments/environment';
import { ACCESS_SERVICE_AGENT_MAX_STEPS } from '../../model/executionLimits';
import {
  AccessAgentContext,
  buildAccessInstructions,
  calledOnlyDisplayTools,
  getAccessActiveTools,
  getLatestUserText,
  getRecentToolNames,
  selectAccessToolGroups,
} from './routing';

interface StepRequestContext {
  get(key: string): unknown;
}

export interface AccessStepArgs {
  messages?: readonly unknown[];
  requestContext?: StepRequestContext;
}

/**
 * Sends a model call only the tools, and instruction sections, that the question needs. Stateless, because these
 * options are shared by every request; the selection depends only on the step's messages and request context.
 */
export function prepareAccessStep({ messages = [], requestContext }: AccessStepArgs) {
  const groups = selectAccessToolGroups({
    text: getLatestUserText(messages),
    agentContext: requestContext?.get('agentContext') as AccessAgentContext | undefined,
    recentToolNames: getRecentToolNames(messages),
  });
  const user = requestContext?.get('user') as User | undefined;

  return {
    groups,
    activeTools: getAccessActiveTools(groups),
    systemMessages: [
      {
        role: 'system' as const,
        content: buildAccessInstructions(groups, {
          date: new Date().toISOString().split('T')[0],
          userName: user?.name,
        }),
      },
    ],
  };
}

export function createAccessServiceSupervisorOptions(
  logger: Logger,
  tenantId?: string,
): AgentExecutionOptions<undefined> {
  return {
    maxSteps: ACCESS_SERVICE_AGENT_MAX_STEPS,
    // With an OpenAI-compatible endpoint the reply limit is a provider option (see getAgentProviderOptions).
    ...(environment.MODEL_URL
      ? {}
      : { modelSettings: { maxOutputTokens: environment.AGENT_ACCESS_MAX_OUTPUT_TOKENS } }),
    stopWhen: calledOnlyDisplayTools,
    prepareStep: (args: unknown) => {
      const { groups, activeTools, systemMessages } = prepareAccessStep(args as AccessStepArgs);
      logger.debug(`Access Service agent step uses tool groups: ${groups.join(', ') || 'guide only'}.`, {
        context: 'AccessServiceSupervisor',
        tenant: tenantId,
      });
      return { activeTools, systemMessages };
    },
  } as AgentExecutionOptions<undefined>;
}
