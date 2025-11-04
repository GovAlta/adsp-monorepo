import { isAllowedUser, UnauthorizedUserError, type AdspId, type User } from '@abgov/adsp-service-sdk';
import type { CoreUserMessage, Metric } from '@mastra/core';
import type { Agent, ToolsInput } from '@mastra/core/agent';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { Logger } from 'winston';
import { AgentConfiguration } from '../configuration';
import { BrokerInputProcessor } from '../types';

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
    private inputProcessors: BrokerInputProcessor[],
    private agent: Agent<TAgentId, TTools, TMetrics>,
    { userRoles }: Partial<AgentConfiguration>
  ) {
    this.userRoles = userRoles || [];
  }

  public async stream(
    user: User,
    threadId: string,
    input: CoreUserMessage | CoreUserMessage[],
    context: Record<string, unknown> = {}
  ) {
    if (this.userRoles.length > 0 && !isAllowedUser(user, this.tenantId, this.userRoles)) {
      throw new UnauthorizedUserError('use agent', user);
    }

    const runtimeContext = new RuntimeContext<Record<string, unknown>>();
    runtimeContext.set('tenantId', this.tenantId);
    runtimeContext.set('user', user);

    for (const [key, value] of Object.entries(context || {})) {
      runtimeContext.set(key, value);
    }

    // This is necessarily because normal Mastra input processors run after message normalization.
    // For example, assets already downloaded, so we cannot use an input processor to download files with a credential.
    for (const inputProcessor of this.inputProcessors) {
      await inputProcessor.processInput(runtimeContext, input);
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
