import { isAllowedUser, Tenant, TenantService, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import type { Mastra } from '@mastra/core';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { Request, Router } from 'express';
import { Namespace as IoNamespace, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { Logger } from 'winston';
import { ServiceRoles } from './roles';

export function onIoConnection(mastra: Mastra, logger: Logger) {
  return async (socket: Socket): Promise<void> => {
    try {
      const req = socket.request as Request;
      const user = req.user;
      const tenant = req.tenant;

      const resourceId = user?.id || socket.id;

      if (!isAllowedUser(user, tenant.id, ServiceRoles.AgentUser)) {
        throw new UnauthorizedUserError('use agent', user);
      }

      logger.info(`User ${user?.name} (ID: ${user?.id}) connected.`, {
        context: 'AgentRouter',
        tenant: tenant?.id?.toString(),
        user: `${user?.name} (ID: ${user?.id})`,
      });

      socket.send(`Connected as user ${user?.name} (ID: ${user?.id}) for tenant ${tenant.name}...`);
      socket.on('message', async (payload) => {
        try {
          if (typeof payload !== 'object') {
            throw new InvalidOperationError('payload for message must be a JSON object.');
          } else {
            const { agent, threadId: threadIdValue, messageId: messageIdValue, content, context } = payload;
            const threadId = threadIdValue || uuid();
            const messageId = messageIdValue || uuid();

            const aiAgent = mastra.getAgent(agent);
            if (!aiAgent) {
              throw new NotFoundError('agent', agent);
            }

            logger.info(`User ${user?.name} (ID: ${user?.id}) messaged agent ${agent}.`, {
              context: 'AgentRouter',
              tenant: tenant?.id?.toString(),
              user: `${user?.name} (ID: ${user?.id})`,
            });

            // TODO: form definition ID is specific to the form agent and should be abstracted away.
            const runtimeContext = new RuntimeContext<Record<string, unknown>>();
            runtimeContext.set('tenant', tenant);
            runtimeContext.set('formDefinitionId', context?.formDefinitionId);

            const result = await aiAgent.stream(
              { role: 'user', content },
              {
                format: 'mastra',
                runtimeContext: runtimeContext as RuntimeContext<unknown>,
                memory: { thread: threadId, resource: resourceId },
              }
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

interface AgentRouterProps {
  logger: Logger;
  tenantService: TenantService;
}

export function createAgentRouter(
  mastra: Mastra,
  ios: IoNamespace[],
  { logger, tenantService }: AgentRouterProps
): Router {
  const router = Router();

  router.get('/agents', async (req, res, next) => {
    try {
      const agents = mastra.getAgents();
      res.send({ agents: Object.keys(agents) });
    } catch (err) {
      next(err);
    }
  });

  for (const io of ios) {
    io.use(tenantHandler(tenantService));
    io.on('connection', onIoConnection(mastra, logger));
  }

  return router;
}
