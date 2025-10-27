import { isAllowedUser, UnauthorizedUserError, type AdspId, type User } from '@abgov/adsp-service-sdk';
import type { Metric } from '@mastra/core';
import type { Agent, ToolsInput } from '@mastra/core/agent';
import type { MessageListInput } from '@mastra/core/dist/agent/message-list';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { Logger } from 'winston';
import { AgentConfiguration } from '../configuration';

export class AgentBroker<
  TAgentId extends string = string,
  TTools extends ToolsInput = ToolsInput,
  TMetrics extends Record<string, Metric> = Record<string, Metric>
> {
  private userRoles: string[];
  public get Agent() {
    return this.agent;
  }

  constructor(
    private logger: Logger,
    private tenantId: AdspId,
    private agent: Agent<TAgentId, TTools, TMetrics>,
    { userRoles }: Partial<AgentConfiguration>
  ) {
    this.userRoles = userRoles || [];
  }

  public stream(user: User, threadId: string, input: MessageListInput, context: Record<string, unknown> = {}) {
    if (this.userRoles.length > 0 && !isAllowedUser(user, this.tenantId, this.userRoles)) {
      throw new UnauthorizedUserError('use agent', user);
    }

    const runtimeContext = new RuntimeContext<Record<string, unknown>>();
    runtimeContext.set('tenantId', this.tenantId);

    for (const [key, value] of Object.entries(context || {})) {
      runtimeContext.set(key, value);
    }

    return this.agent.stream(input, {
      format: 'mastra',
      runtimeContext: runtimeContext as RuntimeContext<unknown>,
      memory: { thread: threadId, resource: user.id },
      onStepFinish: ({ finishReason, usage }) => {
        this.logger.debug(
          `Agent ${this.agent.name} finished step for reason '${finishReason}' and used ${usage.totalTokens} tokens.`,
          { context: 'AgentBroker', tenant: this.tenantId?.toString() }
        );
      },
    });
  }
}
