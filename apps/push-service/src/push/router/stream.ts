import { adspId, TenantService, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
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
import { Logger } from 'winston';
import { EventCriteria, Stream } from '../types';
import { StreamEntity } from '../model';
import { ExtendedError } from 'socket.io/dist/namespace';

interface StreamRouterProps {
  logger: Logger;
  eventService: DomainEventSubscriberService;
  tenantService: TenantService;
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

const STREAM_KEY = 'stream';
export const getStream = async (
  tenantService: TenantService,
  req: Request,
  tenant: string,
  stream: string,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as User;

    const tenantId = (tenant && (await tenantService.getTenantByName(tenant.replace('-', ' '))))?.id || user?.tenantId;
    if (!tenantId) {
      throw new InvalidOperationError('No tenant specified for request.');
    }

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
        res.write(`data: ${JSON.stringify(next)}\n\n`);
        res.flush();
      });

      logger.info(
        `Client connected on stream '${entity.name}' for user ${user?.name || 'anonymous'} (ID: ${
          user?.id || 'anonymous'
        }) on server side event.`,
        {
          ...LOG_CONTEXT,
          tenant: entity.tenantId?.toString(),
        }
      );

      res.on('close', () => {
        sub.unsubscribe();
        logger.info(`Client disconnected from stream '${entity.name}' on server side event.`, {
          ...LOG_CONTEXT,
          tenant: entity.tenantId?.toString(),
        });
      });
      res.on('error', (err) => {
        sub.unsubscribe();
        logger.info(`Client disconnected from stream '${entity.name}' on server side event. ${err}`, {
          ...LOG_CONTEXT,
          tenant: entity.tenantId?.toString(),
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
      const entity = req[STREAM_KEY];

      entity.connect(events);
      const sub = entity
        .getEvents(user, criteria)
        .subscribe((next) => socket.emit(`${next.namespace}:${next.name}`, next));

      logger.info(
        `Client connected on stream '${entity.name}' for user ${user?.name || 'anonymous'} (ID: ${
          user?.id || 'anonymous'
        }) on socket.io with ID ${socket.id}.`,
        {
          ...LOG_CONTEXT,
          tenant: entity.tenantId?.toString(),
        }
      );

      socket.on('disconnect', () => {
        sub.unsubscribe();
        logger.info(`Client disconnected from stream '${entity.name}' on socket.io with ID ${socket.id}.`, {
          ...LOG_CONTEXT,
          tenant: entity.tenantId?.toString(),
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
  io: IoNamespace,
  { logger, eventService, tenantService }: StreamRouterProps
): Router => {
  const events = eventService.getItems().pipe(
    map(({ item, done }) => {
      done();
      return item;
    }),
    share()
  );

  events.subscribe((next) => {
    logger.debug(`Processing event ${next.namespace}:${next.name} ...`);
  });

  const streamRouter = Router();
  streamRouter.get('/streams', getStreams);
  streamRouter.get(
    '/streams/:stream',
    (req, _res, next) => getStream(tenantService, req, req.query.tenant as string, req.params.stream, next),
    subscribeBySse(logger, events)
  );

  io.use((socket, next) => {
    const tenant = socket.nsp.name?.replace(/^\//, '');
    const req = socket.request as Request;
    const user = req.user;
    req.query = socket.handshake.query;

    getStream(tenantService, req, tenant, req.query.stream as string, (err?: unknown) => {
      if (!err && !(req[STREAM_KEY] as StreamEntity).canSubscribe(user)) {
        next(new UnauthorizedUserError('connect stream', user));
      } else {
        next(err as ExtendedError);
      }
    });
  });

  io.on('connection', onIoConnection(logger, events));

  return streamRouter;
};
