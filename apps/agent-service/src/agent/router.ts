import { isAllowedUser, Tenant, TenantService, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, RequestHandler, Router } from 'express';
import { Namespace as IoNamespace, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { Logger } from 'winston';
import { ServiceRoles } from './roles';
import { AgentServiceConfiguration } from './configuration';
import { AgentBroker } from './model';

export function onIoConnection(logger: Logger) {
  return async (socket: Socket): Promise<void> => {
    try {
      const req = socket.request as Request;
      const user = req.user;
      const tenant = req.tenant;

      if (!isAllowedUser(user, tenant.id, ServiceRoles.AgentUser)) {
        throw new UnauthorizedUserError('use agent', user);
      }

      logger.info(`User ${user.name} (ID: ${user.id}) connected.`, {
        context: 'AgentRouter',
        tenant: tenant?.id?.toString(),
        user: `${user.name} (ID: ${user.id})`,
      });

      const configuration = await req.getServiceConfiguration<AgentServiceConfiguration, AgentServiceConfiguration>();

      socket.send(`Connected as user ${user.name} (ID: ${user.id}) for tenant ${tenant.name}...`);
      socket.on('message', async (payload) => {
        try {
          if (typeof payload !== 'object') {
            throw new InvalidOperationError('payload for message must be a JSON object.');
          } else {
            const { agent, threadId: threadIdValue, messageId: messageIdValue, content, context } = payload;
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

            // TODO: form definition ID is specific to the form agent and should be abstracted away.
            // const runtimeContext = new RuntimeContext<Record<string, unknown>>();
            // runtimeContext.set('tenant', tenant);
            // runtimeContext.set('formDefinitionId', context?.formDefinitionId);

            const result = await aiAgent.stream(
              user,
              threadId,
              {
                role: 'user',
                content,
              },
              context
            );
            const replyId = uuid();
            for await (const content of result.textStream) {
              socket.emit('stream', {
                agent,
                threadId,
                messageId: replyId,
                replyTo: messageId,
                content,
              });
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

export const messageAgent: RequestHandler = async function (req, res, next) {
  try {
    const user = req.user;
    const input = Array.isArray(req.body) ? req.body : [req.body];
    // NOTE: Currently this can't persist between messages due to horizontal scaling of pods
    // Need to share agent memory via persistent storage for a thread across requests.
    const threadId = uuid();

    const agent = req[AGENT_KEY] as AgentBroker;
    const result = await agent.generate(
      user,
      threadId,
      input.map(({ content }) => ({ content, role: 'user' }))
    );
    res.send({
      agent: agent.Agent.id,
      content: result.text,
    });
  } catch (err) {
    next(err);
  }
};

interface AgentRouterProps {
  logger: Logger;
  tenantService: TenantService;
}

export function createAgentRouter(ios: IoNamespace[], { logger, tenantService }: AgentRouterProps): Router {
  const router = Router();

  router.get('/agents', getAgents);

  router.get('/agents/:agentId', getAgent, messageAgent);

  router.post('/agents/:agentId', getAgent, async (req, res) => {
    const agent = req[AGENT_KEY] as AgentBroker;
    res.send({
      id: agent.Agent.id,
      name: agent.Agent.name,
    });
  });

  for (const io of ios) {
    io.use(tenantHandler(tenantService));
    io.on('connection', onIoConnection(logger));
  }

  return router;
}
