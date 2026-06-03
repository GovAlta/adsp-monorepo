import { AdspId, ServiceDirectory, TokenProvider, User, EventService } from '@abgov/adsp-service-sdk';
import * as hasha from 'hasha';
import { Mastra } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import type { RequestContext } from '@mastra/core/request-context';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { MCPClient, type MastraMCPServerDefinition } from '@mastra/mcp';
import { PostgresStore } from '@mastra/pg';
import { Logger } from 'winston';
import { environment } from '../../environments/environment';
import { AgentBroker } from '../model';
import { createApiRequestTool, createTools } from '../tools';
import { createBrokerInputProcessors, createInputProcessors } from '../processors';
import { clearThreadWorkspace, createWorkspaceResolver, type AgentWorkspaceConfiguration } from '../workspace';
import { createFileServiceClient } from '../clients';
import { scheduleAgentJobs } from '../jobs';
import { createAuthenticatedMcpFetch, loadKnownMcpServerSecrets, normalizeMcpServerUrl } from './mcpCredentials';

/**
 * Wraps agent instructions to automatically inject contextual information on each request.
 * Includes current date/time and user information to help agents with temporal awareness
 * and personalized responses. Returns a function matching Mastra's DynamicArgument signature,
 * evaluated per-request.
 */
function withContextualInstructions(instructions: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ({ requestContext }: { requestContext: RequestContext<any> }) => {
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
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  api: string;
  path: string;
  useServiceAccount?: boolean;
}

export interface McpServerConfiguration {
  url: string;
  headers?: Record<string, string>;
  capabilities?: string[];
}

function deriveMcpServerIdFromUrl(url: URL) {
  const normalized = normalizeMcpServerUrl(url);
  const host = url.hostname.replace(/\./g, '-').toLowerCase();
  const path = (url.pathname || '/')
    .replace(/^\/+/g, '')
    .replace(/\/+$/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .toLowerCase();
  const hash = createStableHash(normalized);

  const candidate = `${host}${path ? `-${path}` : ''}`.replace(/-+/g, '-').replace(/^-|-$/g, '');
  const prefix = candidate ? candidate.slice(0, 41) : 'mcp-server';
  return `${prefix}-${hash}`;
}

function createStableHash(value: string) {
  return hasha(value, { algorithm: 'sha256' }).slice(0, 8);
}

export interface McpConfiguration {
  servers: McpServerConfiguration[];
}

type ToolConfiguration = string | ApiRequestToolConfiguration;

export interface AgentConfiguration {
  name: string;
  description?: string;
  instructions: string;
  outputSchema?: Record<string, unknown> | null;
  workspace?: AgentWorkspaceConfiguration;
  userRoles?: string[];
  agents?: string[];
  tools?: ToolConfiguration[];
  mcp?: McpConfiguration;
}
export type AgentConfigurations = Record<string, AgentConfiguration>;

export class AgentServiceConfiguration {
  private mastra!: Mastra;
  private brokers: Record<string, AgentBroker> = {};
  private readonly knownMcpServers: ReturnType<typeof loadKnownMcpServerSecrets>;
  constructor(
    private logger: Logger,
    private directory: ServiceDirectory,
    private tokenProvider: TokenProvider,
    private eventService: EventService,
    tenantId: AdspId,
    tenant: AgentConfigurations,
    core: AgentConfigurations,
  ) {
    this.knownMcpServers = loadKnownMcpServerSecrets(environment.AGENT_MCP_SERVER_CREDENTIALS_FILE, this.logger);
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

      const storage = environment.DB_HOST
        ? new PostgresStore({
            host: environment.DB_HOST,
            port: environment.DB_PORT,
            user: environment.DB_USER,
            password: environment.DB_PASSWORD,
            ssl: environment.DB_TLS,
          })
        : new LibSQLStore({
            id: 'memoryStore',
            url: ':memory:',
          });

      const sharedMemory = new Memory({
        storage,
        options: {
          lastMessages: environment.AGENT_LAST_MESSAGES,
          observationalMemory: environment.AGENT_OBSERVATIONAL_MEMORY
            ? {
                model: environment.MODEL_URL
                  ? {
                      providerId: 'custom',
                      modelId: environment.MODEL,
                      url: environment.MODEL_URL,
                      apiKey: environment.MODEL_API_KEY,
                    }
                  : environment.MODEL,
              }
            : false,
        },
      });

      const mcpToolsByAgent = Object.fromEntries(
        await Promise.all(
          Object.entries(configuration).map(async ([agentId, agentConfiguration]) => {
            const mcpTools = await this.createMcpTools(tenantId, agentId, agentConfiguration.mcp);
            return [agentId, mcpTools] as const;
          }),
        ),
      );

      this.mastra = new Mastra({
        storage,
        agents: Object.entries(configuration)
          .sort(([_xk, x], [_yk, y]) => (x?.agents?.length || 0) - (y?.agents?.length || 0)) // Sort the agents with agents to later.
          .reduce(
            (agents, [key, configuration]) => {
              const externalTools = mcpToolsByAgent[key] || {};
              const availableToolMap = availableTools as Record<string, unknown>;

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
                  defaultOptions: (configuration.outputSchema
                    ? {
                        structuredOutput: {
                          schema: configuration.outputSchema,
                          errorStrategy: 'warn',
                        },
                      }
                    : undefined) as unknown as never,
                  agents: () => {
                    const toolAgents: Record<string, Agent> = {};
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
                  tools: {
                    ...externalTools,
                    ...(configuration.tools?.reduce(
                      (tools, toolConfig) => {
                        if (typeof toolConfig === 'string' && availableToolMap[toolConfig]) {
                          tools[toolConfig] = availableToolMap[toolConfig];
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
                      },
                      {} as Record<string, unknown>,
                    ) || {}),
                  } as unknown as never,
                  memory: sharedMemory,
                  workspace: configuration.workspace?.enabled ? createWorkspaceResolver(this.logger, key) : undefined,
                  inputProcessors: ({ requestContext }) =>
                    createInputProcessors({
                      logger: this.logger,
                      requestContext: requestContext as RequestContext<Record<string, unknown>>,
                    }),
                }) as Agent,
              };
            },
            {} as Record<string, Agent>,
          ),
      });

      const inputProcessors = createBrokerInputProcessors({
        logger: this.logger,
        directory: this.directory,
        tokenProvider: this.tokenProvider,
      });
      const fileServiceClient = createFileServiceClient({
        logger: this.logger,
        directory: this.directory,
        tokenProvider: this.tokenProvider,
      });
      this.brokers = Object.entries(this.mastra.listAgents()).reduce((brokers, [key, agent]) => {
        const agentConfiguration: Partial<AgentConfiguration> = configuration[key] || {};
        const broker = new AgentBroker(
          this.logger,
          tenantId,
          inputProcessors,
          agent as never,
          agentConfiguration,
          fileServiceClient,
          this.eventService,
          key,
        );
        return {
          ...brokers,
          [key]: broker,
        };
      }, {});

      // Schedule here (not middleware) because memory is tenant-scoped, so cleanup must run in tenant context too.
      scheduleAgentJobs({
        logger: this.logger,
        tenantId,
        memory: sharedMemory,
        clearWorkspace: (tenantId: string, userId: string, threadId: string) =>
          clearThreadWorkspace(this.logger, { tenantId, userId, threadId }),
        eventService: this.eventService,
      });
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

  private async createMcpTools(tenantId: AdspId, agentId: string, mcp?: McpConfiguration) {
    if (!mcp?.servers?.length) {
      return {};
    }

    const allowedCapabilities = new Map<string, Set<string>>();
    const usedServerUrls = new Set<string>();
    const servers = mcp.servers.reduce(
      (result, server) => {
        try {
          const serverUrl = new URL(server.url);
          const normalizedUrl = normalizeMcpServerUrl(serverUrl);
          if (usedServerUrls.has(normalizedUrl)) {
            this.logger.warn(
              `Ignoring duplicate MCP server URL '${server.url}' for agent '${agentId}'. Only one configuration per URL is supported.`,
              {
                context: 'AgentServiceConfiguration',
                tenant: tenantId?.toString(),
              },
            );
            return result;
          }

          usedServerUrls.add(normalizedUrl);
          const baseId = deriveMcpServerIdFromUrl(serverUrl).trim();
          const serverId = baseId;
          const requestInit = server.headers
            ? {
                headers: server.headers,
              }
            : undefined;
          const knownServer = this.knownMcpServers.get(normalizedUrl);

          result[serverId] = {
            url: serverUrl,
            requestInit: knownServer?.authentication ? undefined : requestInit,
            fetch: knownServer?.authentication
              ? createAuthenticatedMcpFetch(knownServer.authentication, requestInit)
              : undefined,
          };

          if (server.capabilities?.length) {
            allowedCapabilities.set(serverId, new Set(server.capabilities));
          }

          this.logger.debug(`Generated MCP server ID '${serverId}' from URL '${server.url}' for agent '${agentId}'.`, {
            context: 'AgentServiceConfiguration',
            tenant: tenantId?.toString(),
          });
        } catch {
          this.logger.warn(`Ignoring invalid MCP server URL '${server.url}' for agent '${agentId}'.`, {
            context: 'AgentServiceConfiguration',
            tenant: tenantId?.toString(),
          });
        }

        return result;
      },
      {} as Record<string, MastraMCPServerDefinition>,
    );

    const serverEntries = Object.entries(servers);
    if (serverEntries.length < 1) {
      return {};
    }

    const mcpClient = new MCPClient({
      id: `${tenantId?.toString()}:${agentId}`,
      servers,
    });

    try {
      const toolsets = await mcpClient.listToolsets();

      return serverEntries.reduce(
        (tools, [serverId]) => {
          const serverTools = toolsets[serverId] || {};
          const allowed = allowedCapabilities.get(serverId);

          for (const [toolId, tool] of Object.entries(serverTools)) {
            if (!allowed || allowed.has(toolId)) {
              tools[`${serverId}_${toolId}`] = tool;
            }
          }

          return tools;
        },
        {} as Record<string, unknown>,
      );
    } catch (err) {
      this.logger.warn(`Failed to load MCP tools for agent '${agentId}'.`, {
        context: 'AgentServiceConfiguration',
        tenant: tenantId?.toString(),
        error: err instanceof Error ? err.message : String(err),
      });

      return {};
    } finally {
      mcpClient.disconnect().catch((err) => {
        this.logger.debug(`Failed to disconnect MCP client for agent '${agentId}'.`, {
          context: 'AgentServiceConfiguration',
          tenant: tenantId?.toString(),
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }
  }
}
