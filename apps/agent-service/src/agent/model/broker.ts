import { isAllowedUser, UnauthorizedUserError, type AdspId, type User } from '@abgov/adsp-service-sdk';
import type { Agent, ToolsInput } from '@mastra/core/agent';
import type { CoreUserMessage } from '@mastra/core/llm';
import { RequestContext } from '@mastra/core/request-context';
import { Logger } from 'winston';
import { AgentConfiguration } from '../configuration';
import { BrokerInputProcessor } from '../types';

export class AgentBroker<
  TAgentId extends string = string,
  TTools extends ToolsInput = ToolsInput
> {
  private userRoles: string[];
  public get Agent() {
    return this.agent;
  }

  constructor(
    private logger: Logger,
    private tenantId: AdspId,
    private inputProcessors: BrokerInputProcessor[],
    private agent: Agent<TAgentId, TTools>,
    { userRoles }: Partial<AgentConfiguration>
  ) {
    this.userRoles = userRoles || [];
  }

  private async prepareAgentRequest(
    user: User,
    input: CoreUserMessage | CoreUserMessage[],
    context: Record<string, unknown> = {}
  ): Promise<RequestContext<Record<string, unknown>>> {
    if (this.userRoles.length > 0 && !isAllowedUser(user, this.tenantId, this.userRoles)) {
      throw new UnauthorizedUserError('use agent', user);
    }

    const requestContext = new RequestContext<Record<string, unknown>>();
    requestContext.set('tenantId', this.tenantId);
    requestContext.set('user', user);

    for (const [key, value] of Object.entries(context || {})) {
      requestContext.set(key, value);
    }

    // This is necessarily because normal Mastra input processors run after message normalization.
    // For example, assets already downloaded, so we cannot use an input processor to download files with a credential.
    for (const inputProcessor of this.inputProcessors) {
      await inputProcessor.processInput(requestContext, input);
    }

    return requestContext;
  }

  public async stream(
    user: User,
    threadId: string,
    input: CoreUserMessage | CoreUserMessage[],
    context: Record<string, unknown> = {}
  ) {
    const requestContext = await this.prepareAgentRequest(user, input, context);

    return this.agent.stream(input, {
      requestContext,
      memory: { thread: threadId, resource: user.id },
      onStepFinish: ({ finishReason, usage }) => {
        this.logger.debug(
          `Agent ${this.agent.name} finished step for reason '${finishReason}' and used ${usage.totalTokens} tokens.`,
          { context: 'AgentBroker', tenant: this.tenantId?.toString() }
        );
      },
    });
  }

  public async generate(
    user: User,
    threadId: string,
    input: CoreUserMessage | CoreUserMessage[],
    context: Record<string, unknown> = {}
  ) {
    const requestContext = await this.prepareAgentRequest(user, input, context);

    return this.agent.generate(input, {
      requestContext,
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
