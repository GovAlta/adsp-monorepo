import { adspId, User } from '@abgov/adsp-service-sdk';
import {
  DomainEvent,
  DomainEventSubscriberService,
  InvalidOperationError,
  NotFoundError,
} from '@core-services/core-common';
import 'compression'; // For unit tests to load the type extensions.
import { Request, RequestHandler, Router } from 'express';
import { Observable } from 'rxjs';
import { map, share } from 'rxjs/operators';
import { Namespace as IoNamespace, Socket } from 'socket.io';
import { Logger } from 'winston';
import { EventCriteria, Stream } from '../types';
import { StreamEntity } from '../model';

interface StreamRouterProps {
  logger: Logger;
  eventService: DomainEventSubscriberService;
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
export const getStream: RequestHandler = async (req, _res, next) => {
  try {
    const user = req.user as User;
    const { stream } = req.params;
    const { tenant } = req.query;

    const tenantId =
      (tenant && adspId`urn:ads:platform:tenant-service:v2:/tenants/${tenant as string}`) || user?.tenantId;
    if (!tenantId) {
      throw new InvalidOperationError('No tenant specified for request.');
    }

    const [entities, coreEntities] = await req.getConfiguration<
      Record<string, StreamEntity>,
      Record<string, StreamEntity>
    >(tenantId);
    const entity = { ...coreEntities, ...entities }[stream];
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

  const [entities, coreEntities] = await req.getConfiguration<
    Record<string, StreamEntity>,
    Record<string, StreamEntity>
  >(tenantId);
  res.send(
    [...Object.values(coreEntities), ...Object.values(entities)].reduce(
      (streams, stream) => ({ ...streams, [stream.id]: mapStream(stream) }),
      {}
    )
  );
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
      const tenant = socket.nsp.name;
      const req = { ...socket.request, query: socket.handshake.query } as Request;
      const user = req.user;
      const { criteria: criteriaValue, stream } = req.query;
      const criteria: EventCriteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};

      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants${tenant as string}`;

      const [entities, coreEntities] = await req.getConfiguration<
        Record<string, StreamEntity>,
        Record<string, StreamEntity>
      >(tenantId);
      const entity = { ...coreEntities, ...entities }[stream as string];
      if (!entity) {
        throw new NotFoundError('stream', stream as string);
      }

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
export const createStreamRouter = (io: IoNamespace, { logger, eventService }: StreamRouterProps): Router => {
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
  streamRouter.get('/streams/:stream', getStream, subscribeBySse(logger, events));

  io.on('connection', onIoConnection(logger, events));

  return streamRouter;
};
