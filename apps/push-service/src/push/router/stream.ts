import {
  adspId,
  TenantService,
  UnauthorizedUserError,
  User,
  TokenProvider,
  EventService,
  ConfigurationService,
  AdspId,
} from '@abgov/adsp-service-sdk';
import {
  DomainEvent,
  DomainEventSubscriberService,
  InvalidOperationError,
  NotFoundError,
} from '@core-services/core-common';
import 'compression'; // For unit tests to load the type extensions.
import { NextFunction, Request, RequestHandler, Router } from 'express';
import { Observable } from 'rxjs';
import { map, share } from 'rxjs/operators';
import { Namespace as IoNamespace, Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { Logger } from 'winston';
import { EventCriteria, Stream } from '../types';
import { StreamEntity, StreamItem, WebhookEntity } from '../model';
import { webhookTriggered } from '../events';

interface StreamRouterProps {
  logger: Logger;
  eventServiceAmp: DomainEventSubscriberService;
  eventServiceAmpWebhooks: DomainEventSubscriberService;
  tenantService: TenantService;
  tokenProvider: TokenProvider;
  eventService: EventService;
  configurationService: ConfigurationService;
  serviceId: AdspId;
}

export enum ServiceUserRoles {
  Admin = 'push-service-admin',
}

function mapStream(entity: StreamEntity): Stream {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    publicSubscribe: entity.publicSubscribe,
    subscriberRoles: entity.subscriberRoles,
    events: entity.events,
  };
}

export function mapStreamItem(item: StreamItem): Record<string, unknown> {
  const result: Record<string, unknown> = {
    ...item,
  };

  if (result.tenantId) {
    result.tenantId = result.tenantId.toString();
  }

  return result;
}

const STREAM_KEY = 'stream';
export const getStream = async (
  logger: Logger,
  tenantService: TenantService,
  req: Request,
  tenant: string,
  stream: string,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as User;

    const tenantId = (tenant && (await tenantService.getTenantByName(tenant.replace(/-/g, ' '))))?.id || user?.tenantId;
    if (!tenantId && !user?.isCore) {
      throw new InvalidOperationError('No tenant specified for request.');
    }

    logger.debug(`Getting stream '${stream}'...`, {
      ...LOG_CONTEXT,
      tenant: tenantId?.toString(),
      user: user ? `${user.name} (ID: ${user.id})` : null,
    });

    const entities = await req.getConfiguration<Record<string, StreamEntity>, Record<string, StreamEntity>>(tenantId);
    const entity = entities[stream];
    if (!entity) {
      throw new NotFoundError('stream', stream);
    }

    req[STREAM_KEY] = entity;
    next();
  } catch (err) {
    next(err);
  }
};

export const getStreams: RequestHandler = async (req, res, next) => {
  const user = req.user as User;
  const { tenant } = req.query;

  const tenantId =
    (tenant && adspId`urn:ads:platform:tenant-service:v2:/tenants/${tenant as string}`) || user?.tenantId;
  if (!tenantId) {
    next(new InvalidOperationError('No tenant specified for request.'));
    return;
  }

  const entities = await req.getConfiguration<Record<string, StreamEntity>, Record<string, StreamEntity>>(tenantId);

  res.send(Object.values(entities).reduce((streams, stream) => ({ ...streams, [stream.id]: mapStream(stream) }), {}));
};

export function subscribeBySse(logger: Logger, events: Observable<DomainEvent>): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { criteria: criteriaValue } = req.query;
      const criteria: EventCriteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};
      const entity: StreamEntity = req[STREAM_KEY];

      entity.connect(events);
      res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.flushHeaders();

      const sub = entity.getEvents(user, criteria).subscribe((next) => {
        res.write(`data: ${JSON.stringify(mapStreamItem(next))}\n\n`);
        res.flush();
      });

      logger.info(
        `Client connected on stream '${entity.name}' for user ${user?.name || 'anonymous'} (ID: ${
          user?.id || 'anonymous'
        }) on server side event.`,
        {
          ...LOG_CONTEXT,
          tenant: entity.tenantId?.toString(),
          user: user ? `${user.name} (ID: ${user.id})` : null,
        }
      );

      res.on('close', () => {
        sub.unsubscribe();
        logger.info(`Client disconnected from stream '${entity.name}' on server side event.`, {
          ...LOG_CONTEXT,
          tenant: entity.tenantId?.toString(),
          user: user ? `${user.name} (ID: ${user.id})` : null,
        });
      });
      res.on('error', (err) => {
        sub.unsubscribe();
        logger.info(`Client disconnected from stream '${entity.name}' on server side event. ${err}`, {
          ...LOG_CONTEXT,
          tenant: entity.tenantId?.toString(),
          user: user ? `${user.name} (ID: ${user.id})` : null,
        });
      });
    } catch (err) {
      next(err);
    }
  };
}

export function onIoConnection(logger: Logger, events: Observable<DomainEvent>) {
  return async (socket: Socket): Promise<void> => {
    try {
      const req = socket.request as Request;
      const user = req.user;
      const { criteria: criteriaValue } = req.query;
      const criteria: EventCriteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};
      const entity: StreamEntity = req[STREAM_KEY];

      entity.connect(events);
      const sub = entity
        .getEvents(user, criteria)
        .subscribe((next) => socket.emit(`${next.namespace}:${next.name}`, mapStreamItem(next)));

      logger.info(
        `Client connected on stream '${entity.name}' for user ${user?.name || 'anonymous'} (ID: ${
          user?.id || 'anonymous'
        }) on socket.io with ID ${socket.id}.`,
        {
          ...LOG_CONTEXT,
          tenant: entity.tenantId?.toString(),
          user: user ? `${user.name} (ID: ${user.id})` : null,
        }
      );

      socket.on('disconnect', () => {
        sub.unsubscribe();
        logger.info(`Client disconnected from stream '${entity.name}' on socket.io with ID ${socket.id}.`, {
          ...LOG_CONTEXT,
          tenant: entity.tenantId?.toString(),
          user: user ? `${user.name} (ID: ${user.id})` : null,
        });
      });
    } catch (err) {
      logger.warn(`Error encountered on socket.io connection. ${err}`);
      socket.disconnect(true);
    }
  };
}

const LOG_CONTEXT = { context: 'StreamRouter' };
export const createStreamRouter = (
  ios: IoNamespace[],
  {
    logger,
    eventServiceAmp,
    eventServiceAmpWebhooks,
    tenantService,
    tokenProvider,
    eventService,
    configurationService,
    serviceId,
  }: StreamRouterProps
): Router => {
  const events = eventServiceAmp.getItems().pipe(
    map(({ item, done }) => {
      done();
      return item;
    }),
    share()
  );

  const webhookEvents = eventServiceAmpWebhooks.getItems().pipe(
    map(({ item, done }) => {
      done();
      return item;
    }),
    share()
  );

  events.subscribe(async (next) => {
    logger.debug(`Processing event ${next.namespace}:${next.name} for clients...`, {
      ...LOG_CONTEXT,
      tenantId: next?.tenantId?.toString(),
    });
  });

  webhookEvents.subscribe(async (next) => {
    logger.debug(`Processing event ${next.namespace}:${next.name} for webhooks...`, {
      ...LOG_CONTEXT,
      tenantId: next?.tenantId?.toString(),
    });
  });

  webhookEvents.subscribe(async (next) => {
    if (`${next.namespace}:${next.name}` !== 'push-service:webhook-triggered') {
      const tenantId = next.tenantId;

      try {
        const token = await tokenProvider.getAccessToken();

        const { webhooks } = await configurationService.getConfiguration<
          { webhooks: Record<string, WebhookEntity> },
          { webhooks: Record<string, WebhookEntity> }
        >(serviceId, token, tenantId);

        Object.values(webhooks || {}).map(async (webhook) => {
          const beforeWebhook = new Date().getTime();
          const response = await webhook?.process(next);
          if (response) {
            const callResponseTime = new Date().getTime() - beforeWebhook;
            eventService.send(webhookTriggered(tenantId, webhook, next, response, callResponseTime));
          }
        });
      } catch (err) {
        logger.error(`Error encountered processing webhook: ${err}`, {
          ...LOG_CONTEXT,
          tenantId: tenantId?.toString(),
        });
      }
    }
  });

  const streamRouter = Router();
  streamRouter.get('/streams', getStreams);
  streamRouter.get(
    '/streams/:stream',
    (req, _res, next) => getStream(logger, tenantService, req, req.query.tenant as string, req.params.stream, next),
    subscribeBySse(logger, events)
  );

  for (const io of ios) {
    io.use((socket, next) => {
      const tenant = socket.nsp.name?.replace(/^\//, '');
      const req = socket.request as Request;
      const user = req.user;
      req.query = socket.handshake.query;

      getStream(logger, tenantService, req, tenant, req.query.stream as string, (err?: unknown) => {
        if (!err && !(req[STREAM_KEY] as StreamEntity).canSubscribe(user)) {
          next(new UnauthorizedUserError('connect stream', user));
        } else {
          next(err as ExtendedError);
        }
      });
    });

    io.on('connection', onIoConnection(logger, events));
  }

  return streamRouter;
};
