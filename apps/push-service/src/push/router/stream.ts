import { Router } from 'express';
import { Instance as WsApplication } from 'express-ws';
import { map, share } from 'rxjs/operators';
import { Logger } from 'winston';
import { adspId, User } from '@abgov/adsp-service-sdk';
import { DomainEventSubscriberService, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { EventCriteria } from '../types';
import { StreamEntity } from '../model';

interface StreamRouterProps {
  logger: Logger;
  eventService: DomainEventSubscriberService;
}

export const createStreamRouter = (ws: WsApplication, { logger, eventService }: StreamRouterProps): Router => {
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

  streamRouter.get('/streams/:stream', async (req, res, next) => {
    const user = req.user as User;
    const { stream } = req.params;
    const { criteria: criteriaValue, tenant } = req.query;
    const criteria: EventCriteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};

    const tenantId = user?.tenantId || adspId`urn:ads:platform:tenant-service:v2:/tenants/${tenant as string}`;
    if (!tenantId) {
      next(new InvalidOperationError('No tenant specified for request.'));
      return;
    }

    const [entities] = await req.getConfiguration<Record<string, StreamEntity>>(tenantId);
    const entity = entities?.[stream];
    if (!entity) {
      next(new NotFoundError('stream', stream));
      return;
    }

    try {
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
  });

  streamRouter.ws('/streams/:stream', async (ws, req, next) => {
    const user = req.user as User;
    const { stream } = req.params;
    const { criteria: criteriaValue, tenant } = req.query;
    const criteria: EventCriteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};

    const tenantId = user?.tenantId || adspId`urn:ads:platform:tenant-service:v2:/tenants/${tenant as string}`;
    if (!tenantId) {
      next(new InvalidOperationError('No tenant specified for request.'));
      return;
    }

    const [entities] = await req.getConfiguration<Record<string, StreamEntity>>(tenantId);
    const entity = entities?.[stream];
    if (!entity) {
      next(new NotFoundError('stream', stream));
      return;
    }

    try {
      entity.connect(events);
      const sub = entity.getEvents(user, criteria).subscribe((next) => ws.send(JSON.stringify(next)));

      ws.on('close', () => sub.unsubscribe());
      ws.on('error', () => sub.unsubscribe());
    } catch (err) {
      next(err);
    }
  });

  return streamRouter;
};
