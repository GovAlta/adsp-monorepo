import { AdspId, ServiceDirectory, TokenProvider, User } from '@abgov/adsp-service-sdk';
import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import type { RequestContext } from '@mastra/core/request-context';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { Logger } from 'winston';
import { environment } from '../../environments/environment';
import { AgentBroker } from '../model';
import { createApiRequestTool, createTools } from '../tools';
import { createBrokerInputProcessors, createInputProcessors } from '../processors';

/**
 * Wraps agent instructions to automatically inject contextual information on each request.
 * Includes current date/time and user information to help agents with temporal awareness
 * and personalized responses. Returns a function matching Mastra's DynamicArgument signature,
 * evaluated per-request.
 */
function withContextualInstructions(instructions: string) {
  return ({ requestContext }: { requestContext: RequestContext<Record<string, unknown>> }) => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentDateTime = now.toISOString();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

    const user = requestContext.get('user') as User | undefined;
    const userName = user?.name || 'User';

    return `Current date: ${currentDate} (${dayOfWeek})
Current time: ${currentDateTime}
User: ${userName}

Tool call contract:
- Before each tool call, verify required input fields and types.
- If required input is missing, ask a concise clarifying question first.
- Use exact schema field names and provide complete input objects.

${instructions}`;
  };
}

interface TypedToolConfiguration {
  id: string;
  type: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

export interface ApiRequestToolConfiguration extends TypedToolConfiguration {
  type: 'api';
  method: 'GET' | 'POST' | 'PUT';
  api: string;
  path: string;
  userContext?: boolean;
}
type ToolConfiguration = string | ApiRequestToolConfiguration;

export interface AgentConfiguration {
  name: string;
  description?: string;
  instructions: string;
  userRoles?: string[];
  agents?: string[];
  tools?: ToolConfiguration[];
}
export type AgentConfigurations = Record<string, AgentConfiguration>;

export class AgentServiceConfiguration {
  private mastra: Mastra;
  private brokers: Record<string, AgentBroker> = {};
  constructor(
    private logger: Logger,
    private directory: ServiceDirectory,
    private tokenProvider: TokenProvider,
    tenantId: AdspId,
    tenant: AgentConfigurations,
    core: AgentConfigurations,
  ) {
    const configuration = { ...tenant, ...core };
    this.initializeBrokers(tenantId, configuration);
  }

  private async initializeBrokers(tenantId: AdspId, configuration: AgentConfigurations) {
    try {
      const availableTools = await createTools({
        logger: this.logger,
        directory: this.directory,
        tokenProvider: this.tokenProvider,
      });

      this.mastra = new Mastra({
        agents: {
          ...Object.entries(configuration)
            .sort(([_xk, x], [_yk, y]) => (x?.agents?.length || 0) - (y?.agents?.length || 0)) // Sort the agents with agents to later.
            .reduce(
              (agents, [key, configuration]) => {
                return {
                  ...agents,
                  [key]: new Agent({
                    id: key,
                    name: configuration.name,
                    description: configuration.description,
                    instructions: withContextualInstructions(configuration.instructions),
                    model: environment.MODEL_URL
                      ? {
                          id: `custom/${environment.MODEL}`,
                          modelId: environment.MODEL,
                          url: environment.MODEL_URL,
                          apiKey: environment.MODEL_API_KEY,
                        }
                      : environment.MODEL,
                    agents: () => {
                      const toolAgents = {};
                      for (const agent of configuration.agents || []) {
                        const toolAgent = agents[agent];
                        if (toolAgent) {
                          toolAgents[agent] = toolAgent;
                        } else {
                          this.logger.warn(
                            `Agent '${agent}' not found and cannot be provided to agent '${configuration.name}'.`,
                            {
                              context: 'AgentServiceConfiguration',
                              tenant: tenantId?.toString(),
                            },
                          );
                        }
                      }

                      return toolAgents;
                    },
                    tools:
                      configuration.tools?.reduce((tools, toolConfig) => {
                        if (typeof toolConfig === 'string' && availableTools[toolConfig]) {
                          tools[toolConfig] = availableTools[toolConfig];
                        } else if (typeof toolConfig === 'object') {
                          switch (toolConfig.type) {
                            case 'api': {
                              tools[toolConfig.id] = createApiRequestTool(
                                {
                                  logger: this.logger,
                                  directory: this.directory,
                                  tokenProvider: this.tokenProvider,
                                },
                                toolConfig,
                              );
                              break;
                            }
                          }
                        }
                        return tools;
                      }, {}) || {},
                    memory: new Memory({
                      storage: new LibSQLStore({
                        id: 'memoryStore',
                        url: ':memory:',
                      }),
                    }),
                    inputProcessors: ({ requestContext }) =>
                      createInputProcessors({
                        logger: this.logger,
                        requestContext: requestContext as RequestContext<Record<string, unknown>>,
                      }),
                  }),
                };
              },
              {} as Record<string, Agent>,
            ),
        },
      });

      const inputProcessors = createBrokerInputProcessors({
        logger: this.logger,
        directory: this.directory,
        tokenProvider: this.tokenProvider,
      });
      this.brokers = Object.entries(this.mastra.listAgents()).reduce(
        (brokers, [key, agent]) => ({
          ...brokers,
          [key]: new AgentBroker(this.logger, tenantId, inputProcessors, agent, configuration[key] || {}),
        }),
        {},
      );
    } catch (err) {
      this.logger.error('Error encountered initializing agent brokers.', {
        context: 'AgentServiceConfiguration',
        tenant: tenantId?.toString(),
      });
    }
  }

  public getAgent(agent: string) {
    return this.brokers[agent];
  }

  public getAgents() {
    return Object.entries(this.brokers).map(([key, broker]) => ({
      id: key,
      name: broker.Agent.name,
    }));
  }
}
