import { adspId, User } from '@abgov/adsp-service-sdk';
import { DomainEventSubscriberService, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { NextFunction, Request, Router } from 'express';
import { Instance as WsApplication } from 'express-ws';
import { map, share } from 'rxjs/operators';
import { Server as IoServer } from 'socket.io';
import { Logger } from 'winston';
import { EventCriteria } from '../types';
import { StreamEntity } from '../model';

interface StreamRouterProps {
  logger: Logger;
  eventService: DomainEventSubscriberService;
}

const STREAM_KEY = 'stream';
export const getStream = async (req: Request, stream: string, next: NextFunction): Promise<void> => {
  try {
    const user = req.user as User;
    const { tenant } = req.query;

    const tenantId = user?.tenantId || adspId`urn:ads:platform:tenant-service:v2:/tenants/${tenant as string}`;
    if (!tenantId) {
      throw new InvalidOperationError('No tenant specified for request.');
    }

    const [entities] = await req.getConfiguration<Record<string, StreamEntity>>(tenantId);
    const entity = entities?.[stream];
    if (!entity) {
      throw new NotFoundError('stream', stream);
    }

    req[STREAM_KEY] = entity;
    next();
  } catch (err) {
    next(err);
  }
};

export const createStreamRouter = (
  ws: WsApplication,
  io: IoServer,
  { logger, eventService }: StreamRouterProps
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
  ws.applyTo(streamRouter);

  streamRouter.get('/streams', async (req, res, next) => {
    const user = req.user as User;
    const { tenant } = req.query;

    const tenantId = user?.tenantId || adspId`urn:ads:platform:tenant-service:v2:/tenants/${tenant as string}`;
    if (!tenantId) {
      next(new InvalidOperationError('No tenant specified for request.'));
      return;
    }

    const [entities] = await req.getConfiguration<Record<string, StreamEntity>>(tenantId);
    res.send(entities);
  });

  streamRouter.get(
    '/streams/:stream',
    (req, _res, next) => getStream(req, req.params.stream, next),
    async (req, res, next) => {
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

        res.on('close', () => sub.unsubscribe());
        res.on('error', () => sub.unsubscribe());
      } catch (err) {
        next(err);
      }
    }
  );

  streamRouter.ws(
    '/streams/:stream',
    (_ws, req, next) => getStream(req, req.params.stream, next),
    async (ws, req, next) => {
      try {
        const user = req.user;
        const { criteria: criteriaValue } = req.query;
        const criteria: EventCriteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};
        const entity: StreamEntity = req[STREAM_KEY];

        entity.connect(events);
        const sub = entity.getEvents(user, criteria).subscribe((next) => ws.send(JSON.stringify(next)));

        ws.on('close', () => sub.unsubscribe());
        ws.on('error', () => sub.unsubscribe());
      } catch (err) {
        next(err);
      }
    }
  );

  io.of('/').on('connection', async (socket) => {
    try {
      const req = socket.request as Request;
      const user = req.user;
      const { criteria: criteriaValue, stream } = socket.handshake.query;
      const criteria: EventCriteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};

      await getStream(req, stream as string, (err: unknown) => {
        if (err) {
          socket.disconnect(true);
        }
      });

      const entity: StreamEntity = req[STREAM_KEY];
      if (entity) {
        entity.connect(events);
        const sub = entity.getEvents(user, criteria).subscribe((next) => socket.emit(stream as string, next));

        socket.on('disconnect', () => sub.unsubscribe());
      }
    } catch (err) {
      socket.disconnect(true);
    }
  });

  return streamRouter;
};
