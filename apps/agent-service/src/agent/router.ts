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

const TOKEN_EXPIRY_THRESHOLD_MS = 30 * 1000;

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
      const expiryTimeout =
        expiry !== null
          ? setTimeout(
              () => disconnectExpiredSocket(socket, logger, user, tenant),
              Math.max(expiry - TOKEN_EXPIRY_THRESHOLD_MS - Date.now(), 0)
            )
          : null;

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
              userContent = [{type: 'text',  text: content}];
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
              context
            );
            const replyId = uuid();

            if (rawChunks === true) {
              for await (const chunk of result.fullStream) {
                socket.emit('stream', {
                  agent,
                  threadId,
                  messageId: replyId,
                  replyTo: messageId,
                  chunk,
                });
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
            
            socket.emit('stream', {
              agent,
              threadId,
              messageId: replyId,
              replyTo: messageId,
              done: true,
            });
          }
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
        input.map(({ content }) => ({ content, role: 'user' }))
      );

      logger.info(`Agent ${agent} responded to user ${user.name} (ID: ${user.id}) message.`, {
        context: 'AgentRouter',
        tenant: tenant?.id?.toString(),
        user: `${user.name} (ID: ${user.id})`,
      });

      res.send({
        agent: agent.Agent.id,
        content: result.text,
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
