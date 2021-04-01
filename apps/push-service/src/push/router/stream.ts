import { Router } from 'express';
import { Instance as WsApplication } from 'express-ws';
import { map, share } from 'rxjs/operators';
import { Logger } from 'winston';
import { DomainEventSubscriberService, NotFoundError, User } from '@core-services/core-common';
import { StreamRepository } from '../repository';
import { EventCriteria } from '../types';

interface StreamRouterProps {
  logger: Logger;
  eventService: DomainEventSubscriberService;
  streamRepository: StreamRepository;
}

export const createStreamRouter = (
  ws: WsApplication,
  { logger, eventService, streamRepository }: StreamRouterProps
) => {
  const events = eventService.getEvents().pipe(
    map(({ event, done }) => {
      done();
      return event;
    }),
    share()
  );

  events.subscribe((next) => {
    logger.debug(`Processing event ${next.namespace}:${next.name} ...`);
  });

  const streamRouter = Router();
  ws.applyTo(streamRouter);

  streamRouter.get('/:space/:stream', (req, res, next) => {
    const user = req.user as User;
    const { space, stream } = req.params;
    const criteria: EventCriteria = req.query.criteria ? JSON.parse(req.query.criteria as string) : {};

    streamRepository
      .get({ spaceId: space, id: stream })
      .then((entity) => {
        if (!entity) {
          throw new NotFoundError('stream', `${space}:${stream}`);
        }
        return entity;
      })
      .then((stream) => stream.connect(events))
      .then((stream) => {
        res.set({
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        res.flushHeaders();

        const sub = stream.getEvents(user, criteria).subscribe((next) => {
          res.write(`data: ${JSON.stringify(next)}\n\n`);
          res.flush();
        });

        res.on('close', () => sub.unsubscribe());
        res.on('error', () => sub.unsubscribe());
      })
      .catch((err) => next(err));
  });

  streamRouter.ws('/:space/:stream', (ws, req, next) => {
    const user = req.user as User;
    const { space, stream } = req.params;
    const criteria: EventCriteria = req.query.criteria ? JSON.parse(req.query.criteria as string) : {};

    streamRepository
      .get({ spaceId: space, id: stream })
      .then((entity) => {
        if (!entity) {
          throw new NotFoundError('stream', `${space}:${stream}`);
        }
        return entity;
      })
      .then((stream) => stream.connect(events))
      .then((stream) => {
        const sub = stream.getEvents(user, criteria).subscribe((next) => ws.send(JSON.stringify(next)));

        ws.on('close', () => sub.unsubscribe());
        ws.on('error', () => sub.unsubscribe());
      })
      .catch((err) => next(err));
  });

  return streamRouter;
};
