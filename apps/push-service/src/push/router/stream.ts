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
import { StreamEntity, WebhookEntity } from '../model';
import { webhookTriggered } from '../events';
import { BufferTailer, RedisEventBuffer } from '../../buffer';
import { mapStreamItem, STREAM_KEY } from './item';
import { getStreamEvents, ResumableStreamOptions, subscribeBySseResumable } from './resumable';

export { mapStreamItem } from './item';

interface StreamRouterProps {
  logger: Logger;
  eventServiceAmp: DomainEventSubscriberService;
  eventServiceAmpWebhooks: DomainEventSubscriberService;
  tenantService: TenantService;
  tokenProvider: TokenProvider;
  eventService: EventService;
  configurationService: ConfigurationService;
  serviceId: AdspId;
  buffer?: RedisEventBuffer;
  tailer?: BufferTailer;
  resumable?: ResumableStreamOptions;
}

/**
 * Selects the event source for a stream; tenant streams read from the replay buffer tail when it's enabled.
 */
export type StreamEventSource = Observable<DomainEvent> | ((entity: StreamEntity) => Observable<DomainEvent>);

function resolveSource(source: StreamEventSource, entity: StreamEntity): Observable<DomainEvent> {
  return typeof source === 'function' ? source(entity) : source;
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

  res.send(
    Object.values(entities)
      .filter((stream) => stream.canSubscribe(user))
      .reduce((streams, stream) => ({ ...streams, [stream.id]: mapStream(stream) }), {})
  );
};

export function subscribeBySse(logger: Logger, events: StreamEventSource): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { criteria: criteriaValue } = req.query;
      const criteria: EventCriteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};
      const entity: StreamEntity = req[STREAM_KEY];

      entity.connect(resolveSource(events, entity));
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

export function onIoConnection(logger: Logger, events: StreamEventSource) {
  return async (socket: Socket): Promise<void> => {
    try {
      const req = socket.request as Request;
      const user = req.user;
      const { criteria: criteriaValue } = req.query;
      const criteria: EventCriteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};
      const entity: StreamEntity = req[STREAM_KEY];

      entity.connect(resolveSource(events, entity));
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
    buffer,
    tailer,
    resumable = { keepAliveMs: 25000, replayPageSize: 200 },
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

  // With the buffer enabled, tenant streams are fed from the buffer tail instead of this instance's exclusive queue,
  // so events published while the instance was down are still delivered. Cross-tenant streams remain live only.
  const source: StreamEventSource = tailer
    ? (entity) => (entity.tenantId ? tailer.observe(entity.tenantId).pipe(map(({ event }) => event)) : events)
    : events;

  const legacySse = subscribeBySse(logger, source);
  const resumableSse = buffer && tailer && subscribeBySseResumable(logger, buffer, tailer, resumable);
  const resolveStream: RequestHandler = (req, _res, next) =>
    getStream(logger, tenantService, req, req.query.tenant as string, req.params.stream, next);

  const streamRouter = Router();
  streamRouter.get('/streams', getStreams);
  streamRouter.get('/streams/:stream', resolveStream, (req, res, next) =>
    resumableSse && (req[STREAM_KEY] as StreamEntity).tenantId ? resumableSse(req, res, next) : legacySse(req, res, next)
  );
  if (buffer) {
    streamRouter.get('/streams/:stream/events', resolveStream, getStreamEvents(buffer, resumable.replayPageSize));
  }

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

    io.on('connection', onIoConnection(logger, source));
  }

  return streamRouter;
};
