import { isAllowedUser, Tenant, TenantService, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, InvalidValueError, NotFoundError } from '@core-services/core-common';
import { Request, RequestHandler, Router } from 'express';
import { Namespace as IoNamespace, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { Logger } from 'winston';
import { ServiceRoles } from './roles';
import { AgentServiceConfiguration } from './configuration';
import { AgentBroker } from './model';
import { CoreUserMessage } from '@mastra/core/llm';
import { environment } from '../environments/environment';

const TOKEN_EXPIRY_THRESHOLD_MS = environment.AGENT_TOKEN_EXPIRY_THRESHOLD_MS;

// Track in-progress workspace initializations to prevent concurrent init requests.
// Key format: `${tenantId}:${userId}:${threadId}`
const workspaceInitsInProgress = new Set<string>();

// Chunk types that the client understands and can render.
// Other stream parts (step-start, step-finish, finish, raw, etc.) contain
// complex non-serializable data (getters, circular refs via messageList)
// that breaks socket.io JSON serialization.
const FORWARDABLE_CHUNK_TYPES = new Set([
  'text-delta',
  'tool-call',
  'tool-result',
  'tool-error',
  'reasoning-start',
  'reasoning-delta',
  'reasoning-end',
  'error',
  'tripwire',
]);

const PROJECTABLE_TOOL_CHUNK_TYPES = new Set(['tool-call', 'tool-result', 'tool-error']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

interface ToolChunk {
  type: 'tool-call' | 'tool-result' | 'tool-error';
  payload: unknown;
}

function toProjectableToolChunks(candidate: unknown): ToolChunk[] {
  if (!isRecord(candidate)) {
    return [];
  }

  const type = typeof candidate.type === 'string' ? candidate.type : undefined;
  if (type && PROJECTABLE_TOOL_CHUNK_TYPES.has(type)) {
    return [{ type: type as ToolChunk['type'], payload: candidate.payload }];
  }

  const toolName = typeof candidate.toolName === 'string' ? candidate.toolName : undefined;
  const toolCallId = typeof candidate.toolCallId === 'string' ? candidate.toolCallId : undefined;
  if (!toolName || !toolCallId) {
    return [];
  }

  const chunks: ToolChunk[] = [];

  if ('args' in candidate) {
    chunks.push({
      type: 'tool-call',
      payload: {
        toolName,
        toolCallId,
        args: candidate.args,
      },
    });
  }
  if (candidate.isError === true || 'error' in candidate) {
    chunks.push({
      type: 'tool-error',
      payload: {
        toolName,
        toolCallId,
        error: 'error' in candidate ? candidate.error : candidate.result,
      },
    });
  } else if ('result' in candidate) {
    chunks.push({
      type: 'tool-result',
      payload: {
        toolName,
        toolCallId,
        result: candidate.result,
      },
    });
  }

  return chunks;
}

/**
 * Extract projectable nested tool chunks from sub-agent tool payloads.
 * Supports one nested level only. Multi-level supervisor nesting is intentionally
 * unsupported to keep projection deterministic.
 */
function getNestedToolChunks(payload: unknown): ToolChunk[] {
  if (!isRecord(payload)) {
    return [];
  }

  const containers: unknown[] = [];
  const nestedKeys = ['chunks', 'events', 'steps', 'toolCalls', 'toolResults', 'toolErrors', 'subAgentToolResults'];
  for (const key of nestedKeys) {
    if (key in payload) {
      containers.push(payload[key]);
    }
  }

  if ('result' in payload && isRecord(payload.result)) {
    for (const key of nestedKeys) {
      if (key in payload.result) {
        containers.push(payload.result[key]);
      }
    }
  }

  const nested: ToolChunk[] = [];
  for (const container of containers) {
    if (!Array.isArray(container)) {
      continue;
    }

    for (const item of container) {
      nested.push(...toProjectableToolChunks(item));
    }
  }

  return nested;
}

function getUserTokenExpiry(user: User): number | null {
  const exp = user?.token?.exp;

  return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : null;
}

function isUserTokenExpired(user: User): boolean {
  const expiry = getUserTokenExpiry(user);

  return expiry !== null && expiry - TOKEN_EXPIRY_THRESHOLD_MS <= Date.now();
}

function disconnectExpiredSocket(socket: Socket, logger: Logger, user: User, tenant: Tenant): void {
  if (!socket.connected) {
    return;
  }

  logger.info(`Disconnecting socket for user ${user.name} (ID: ${user.id}) due to token expiry.`, {
    context: 'AgentRouter',
    tenant: tenant?.id?.toString(),
    user: `${user.name} (ID: ${user.id})`,
  });
  socket.emit('session-expired', {
    code: 'USER_TOKEN_EXPIRED',
    message: 'Reconnect with a fresh token.',
  });
  socket.disconnect(true);
}

export function onIoConnection(logger: Logger) {
  return async (socket: Socket): Promise<void> => {
    try {
      const req = socket.request as Request;
      const user = req.user;
      const tenant = req.tenant;

      if (!isAllowedUser(user, tenant.id, ServiceRoles.AgentUser)) {
        throw new UnauthorizedUserError('use agent', user);
      }

      if (isUserTokenExpired(user)) {
        disconnectExpiredSocket(socket, logger, user, tenant);
        return;
      }

      const expiry = getUserTokenExpiry(user);
      const timeToExpiry = expiry !== null ? Math.max(expiry - TOKEN_EXPIRY_THRESHOLD_MS - Date.now(), 0) : null;

      // Track whether an agent response is currently being streamed so that
      // token-expiry disconnects can be deferred until the stream finishes.
      let streaming = false;
      let disconnectDeferred = false;

      const deferredDisconnect = () => {
        if (streaming) {
          // An agent response is in-flight — defer the disconnect until it completes.
          disconnectDeferred = true;
          logger.info(
            `Deferring token-expiry disconnect for user ${user.name} (ID: ${user.id}) while stream is in progress.`,
            {
              context: 'AgentRouter',
              tenant: tenant?.id?.toString(),
              user: `${user.name} (ID: ${user.id})`,
            },
          );
          return;
        }
        disconnectExpiredSocket(socket, logger, user, tenant);
      };

      const expiryTimeout = timeToExpiry !== null ? setTimeout(() => deferredDisconnect(), timeToExpiry) : null;

      logger.info(`User ${user.name} (ID: ${user.id}) connected.`, {
        context: 'AgentRouter',
        tenant: tenant?.id?.toString(),
        user: `${user.name} (ID: ${user.id})`,
      });

      const configuration = await req.getServiceConfiguration<AgentServiceConfiguration, AgentServiceConfiguration>();

      socket.send(`Connected as user ${user.name} (ID: ${user.id}) for tenant ${tenant.name}...`);
      socket.on('message', async (payload) => {
        try {
          if (isUserTokenExpired(user)) {
            disconnectExpiredSocket(socket, logger, user, tenant);
            return;
          }

          if (typeof payload !== 'object') {
            throw new InvalidOperationError('payload for message must be a JSON object.');
          } else {
            const { agent, threadId: threadIdValue, messageId: messageIdValue, content, context, rawChunks } = payload;
            const threadId = threadIdValue || uuid();
            const messageId = messageIdValue || uuid();

            const aiAgent = configuration.getAgent(agent);
            if (!aiAgent) {
              throw new NotFoundError('agent', agent);
            }

            logger.info(`User ${user.name} (ID: ${user.id}) messaged agent ${agent}.`, {
              context: 'AgentRouter',
              tenant: tenant?.id?.toString(),
              user: `${user.name} (ID: ${user.id})`,
            });

            let userContent: CoreUserMessage['content'];
            if (Array.isArray(content)) {
              userContent = content;
            } else if (typeof content === 'string') {
              userContent = [{ type: 'text', text: content }];
            } else {
              throw new InvalidValueError('content', 'content must string or array of text, image, or file parts.');
            }

            const result = await aiAgent.stream(
              user,
              threadId,
              {
                role: 'user',
                content: userContent,
              },
              context,
            );
            const replyId = uuid();

            streaming = true;
            // Send periodic heartbeats during streaming to prevent reverse proxy
            // (e.g. OpenShift HAProxy route) from timing out the WebSocket connection
            // during long LLM thinking or tool execution gaps.
            const streamStartTime = Date.now();
            const heartbeatInterval = setInterval(() => {
              if (socket.connected) {
                socket.emit('stream', {
                  agent,
                  threadId,
                  messageId: replyId,
                  replyTo: messageId,
                  chunk: { type: 'heartbeat', payload: { timestamp: Date.now() } },
                });
              }
            }, 15_000);
            try {
              if (rawChunks === true) {
                const projector = await aiAgent.createProjector(user, threadId);
                const projectWorkspaceChange = async (type: string, payload: unknown) => {
                  if (type === 'tool-call') {
                    projector.onToolCall(payload);
                  } else if (type === 'tool-error') {
                    projector.onToolError(payload);
                  } else if (type === 'tool-result') {
                    const workspaceChange = await projector.onToolResult(payload);
                    if (workspaceChange) {
                      socket.emit('workspace-change', {
                        agent,
                        threadId,
                        messageId: replyId,
                        replyTo: messageId,
                        ...workspaceChange,
                      });
                    }
                  }
                };

                for await (const chunk of result.fullStream) {
                  if (!FORWARDABLE_CHUNK_TYPES.has(chunk.type)) {
                    continue;
                  }

                  // Forward only type and payload; other properties on fullStream chunks
                  // (e.g. step-finish, finish) can contain non-serializable data
                  // (getters, circular refs via messageList) that breaks socket.io serialization.
                  const { type, payload } = chunk as { type: string; payload?: unknown };
                  socket.emit('stream', {
                    agent,
                    threadId,
                    messageId: replyId,
                    replyTo: messageId,
                    chunk: { type, payload },
                  });

                  await projectWorkspaceChange(type, payload);

                  // One-level nested projection support for sub-agent tool chunks.
                  for (const nested of getNestedToolChunks(payload)) {
                    await projectWorkspaceChange(nested.type, nested.payload);
                  }
                }
              } else {
                for await (const content of result.textStream) {
                  socket.emit('stream', {
                    agent,
                    threadId,
                    messageId: replyId,
                    replyTo: messageId,
                    content,
                  });
                }
              }

              let output: unknown;
              const streamLoopDurationMs = Date.now() - streamStartTime;
              try {
                output = await result.object;
              } catch (err) {
                logger.warn(
                  `Invalid structured output produced for agent ${agent}; falling back to text output only.`,
                  {
                    context: 'AgentRouter',
                    tenant: tenant?.id?.toString(),
                    user: `${user.name} (ID: ${user.id})`,
                    error: err instanceof Error ? err.message : String(err),
                  },
                );
              }

              const totalDurationMs = Date.now() - streamStartTime;
              logger.info(
                `Stream complete for agent ${agent}: total=${totalDurationMs}ms, streamLoop=${streamLoopDurationMs}ms, resultObject=${totalDurationMs - streamLoopDurationMs}ms`,
                {
                  context: 'AgentRouter',
                  tenant: tenant?.id?.toString(),
                  user: `${user.name} (ID: ${user.id})`,
                  totalDurationMs,
                  streamLoopDurationMs,
                },
              );

              socket.emit('stream', {
                agent,
                threadId,
                messageId: replyId,
                replyTo: messageId,
                output,
                done: true,
              });
            } finally {
              clearInterval(heartbeatInterval);
              streaming = false;

              // If a token-expiry disconnect was deferred while the stream was
              // in progress, execute it now that the response has been delivered.
              if (disconnectDeferred) {
                disconnectDeferred = false;
                disconnectExpiredSocket(socket, logger, user, tenant);
              }
            }
          }
        } catch (err) {
          socket.emit('error', err.message);
        }
      });
      socket.on('workspace-init', async (payload) => {
        try {
          if (isUserTokenExpired(user)) {
            disconnectExpiredSocket(socket, logger, user, tenant);
            return;
          }

          if (typeof payload !== 'object') {
            throw new InvalidOperationError('payload for workspace-init must be a JSON object.');
          }

          const { agent, threadId: threadIdValue, workspaceTarball } = payload;
          const threadId = threadIdValue || uuid();

          if (!workspaceTarball || typeof workspaceTarball !== 'string') {
            throw new InvalidValueError('workspaceTarball', 'workspaceTarball must be a URN string.');
          }

          const aiAgent = configuration.getAgent(agent);
          if (!aiAgent) {
            throw new NotFoundError('agent', agent);
          }

          // Guard against concurrent init requests for the same workspace
          const initKey = `${tenant.id}:${user.id}:${threadId}`;
          if (workspaceInitsInProgress.has(initKey)) {
            logger.info(`Workspace initialization already in progress for thread ${threadId}, skipping duplicate.`, {
              context: 'AgentRouter',
              tenant: tenant?.id?.toString(),
              user: `${user.name} (ID: ${user.id})`,
            });
            return;
          }

          workspaceInitsInProgress.add(initKey);

          logger.info(`User ${user.name} (ID: ${user.id}) initializing workspace for agent ${agent}.`, {
            context: 'AgentRouter',
            tenant: tenant?.id?.toString(),
            user: `${user.name} (ID: ${user.id})`,
          });

          let revision;
          try {
            revision = await aiAgent.initializeWorkspace(user, threadId, workspaceTarball);
          } finally {
            workspaceInitsInProgress.delete(initKey);
          }

          socket.emit('workspace-ready', {
            agent,
            threadId,
            revision: revision.revision,
            updatedAt: revision.updatedAt,
          });
        } catch (err) {
          const payloadRecord =
            typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : null;
          const agent = payloadRecord && typeof payloadRecord.agent === 'string' ? payloadRecord.agent : undefined;
          const threadId =
            payloadRecord && typeof payloadRecord.threadId === 'string' ? payloadRecord.threadId : undefined;
          const workspaceTarball =
            payloadRecord && typeof payloadRecord.workspaceTarball === 'string'
              ? payloadRecord.workspaceTarball
              : undefined;
          const errorMessage = err instanceof Error ? err.message : String(err);

          logger.warn(`Workspace initialization failed for agent ${agent ?? 'unknown'}.`, {
            context: 'AgentRouter',
            tenant: tenant?.id?.toString(),
            user: `${user.name} (ID: ${user.id})`,
            threadId,
            workspaceTarball,
            error: errorMessage,
          });

          socket.emit('error', errorMessage);
        }
      });
      socket.on('workspace-update', async (payload) => {
        try {
          if (isUserTokenExpired(user)) {
            disconnectExpiredSocket(socket, logger, user, tenant);
            return;
          }

          if (typeof payload !== 'object') {
            throw new InvalidOperationError('payload for workspace-update must be a JSON object.');
          }

          const { agent, threadId: threadIdValue, files, writes, deletes } = payload;
          const threadId = threadIdValue || uuid();

          if (files !== undefined && !Array.isArray(files)) {
            throw new InvalidValueError('files', 'files must be an array of { path, content } objects.');
          }

          if (writes !== undefined && !Array.isArray(writes)) {
            throw new InvalidValueError('writes', 'writes must be an array of { path, content } objects.');
          }

          if (deletes !== undefined && !Array.isArray(deletes)) {
            throw new InvalidValueError('deletes', 'deletes must be an array of file paths.');
          }

          const aiAgent = configuration.getAgent(agent);
          if (!aiAgent) {
            throw new NotFoundError('agent', agent);
          }

          const result = await aiAgent.updateWorkspace(user, threadId, {
            writes: Array.isArray(writes) ? writes : Array.isArray(files) ? files : [],
            deletes: Array.isArray(deletes) ? deletes : [],
          });

          socket.emit('workspace-updated', {
            agent,
            threadId,
            revision: result.revision.revision,
            updatedAt: result.revision.updatedAt,
            writeCount: result.writeCount,
            deleteCount: result.deleteCount,
          });
        } catch (err) {
          socket.emit('error', err.message);
        }
      });
      socket.on('workspace-read', async (payload) => {
        try {
          if (isUserTokenExpired(user)) {
            disconnectExpiredSocket(socket, logger, user, tenant);
            return;
          }

          if (typeof payload !== 'object') {
            throw new InvalidOperationError('payload for workspace-read must be a JSON object.');
          }

          const { agent, threadId: threadIdValue } = payload;
          const threadId = threadIdValue || uuid();

          const aiAgent = configuration.getAgent(agent);
          if (!aiAgent) {
            throw new NotFoundError('agent', agent);
          }

          const result = await aiAgent.readWorkspace(user, threadId);

          socket.emit('workspace-state', {
            agent,
            threadId,
            revision: result.revision.revision,
            updatedAt: result.revision.updatedAt,
            files: result.files,
          });
        } catch (err) {
          socket.emit('error', err.message);
        }
      });
      socket.on('disconnect', () => {
        if (expiryTimeout) {
          clearTimeout(expiryTimeout);
        }

        logger.info(`User ${user.name} (ID: ${user.id}) disconnected.`, {
          context: 'AgentRouter',
          tenant: tenant?.id?.toString(),
          user: `${user.name} (ID: ${user.id})`,
        });
      });
    } catch (err) {
      logger.warn(`Error encountered on socket.io connection. ${err}`);
      socket.disconnect(true);
    }
  };
}

function tenantHandler(tenantService: TenantService) {
  return async (socket, next) => {
    const tenantName = socket.nsp.name?.replace(/^\//, '');
    const req = socket.request as Request;
    const user = req.user;
    req.query = socket.handshake.query;

    let tenant: Tenant;
    if (!user || user.isCore) {
      tenant = await tenantService.getTenantByName(tenantName);
    } else {
      tenant = await tenantService.getTenant(user.tenantId);
    }

    if (!tenant) {
      next(new InvalidOperationError('Tenant context is required.'));
    } else {
      req['tenant'] = tenant;

      next();
    }
  };
}

const AGENT_KEY = 'agent';
export const getAgents: RequestHandler = async function (req, res, next) {
  try {
    const configuration = await req.getServiceConfiguration<AgentServiceConfiguration, AgentServiceConfiguration>();
    const agents = configuration.getAgents();
    res.send({ agents });
  } catch (err) {
    next(err);
  }
};

export const getAgent: RequestHandler = async function (req, res, next) {
  try {
    const { agentId } = req.params;
    const configuration = await req.getServiceConfiguration<AgentServiceConfiguration, AgentServiceConfiguration>();
    const agent = configuration.getAgent(agentId);
    if (!agent) {
      throw new NotFoundError('Agent', agentId);
    }

    req[AGENT_KEY] = agent;
    next();
  } catch (err) {
    next(err);
  }
};

export function messageAgent(logger: Logger): RequestHandler {
  return async function (req, res, next) {
    try {
      const tenant = req.tenant;
      const user = req.user;
      const input = Array.isArray(req.body) ? req.body : [req.body];
      const agent = req[AGENT_KEY] as AgentBroker;

      logger.debug(`User ${user.name} (ID: ${user.id}) messaging agent ${agent}...`, {
        context: 'AgentRouter',
        tenant: tenant?.id?.toString(),
        user: `${user.name} (ID: ${user.id})`,
      });

      // NOTE: Currently this can't persist between messages due to horizontal scaling of pods
      // Need to share agent memory via persistent storage for a thread across requests.
      const threadId = uuid();
      const result = await agent.generate(
        user,
        threadId,
        input.map(({ content }) => ({ content, role: 'user' })),
      );

      logger.info(`Agent ${agent} responded to user ${user.name} (ID: ${user.id}) message.`, {
        context: 'AgentRouter',
        tenant: tenant?.id?.toString(),
        user: `${user.name} (ID: ${user.id})`,
      });

      res.send({
        agent: agent.Agent.id,
        content: result.text,
        output: result.object,
      });
    } catch (err) {
      next(err);
    }
  };
}
interface AgentRouterProps {
  logger: Logger;
  tenantService: TenantService;
}

export function createAgentRouter(ios: IoNamespace[], { logger, tenantService }: AgentRouterProps): Router {
  const router = Router();

  router.get('/agents', getAgents);

  router.get('/agents/:agentId', getAgent, async (req, res) => {
    const agent = req[AGENT_KEY] as AgentBroker;
    res.send({
      id: req.params.agentId,
      name: agent.Agent.name,
    });
  });

  router.post('/agents/:agentId', getAgent, messageAgent(logger));

  for (const io of ios) {
    io.use(tenantHandler(tenantService));
    io.on('connection', onIoConnection(logger));
  }

  return router;
}
