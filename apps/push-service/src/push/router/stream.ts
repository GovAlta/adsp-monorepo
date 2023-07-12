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
import { Logger } from 'winston';
import { EventCriteria, Stream } from '../types';
import { StreamEntity, StreamItem } from '../model';
import { ExtendedError } from 'socket.io/dist/namespace';
import axios from 'axios';
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

export interface Webhook {
  id: string;
  url: string;
  name: string;
  targetId: string;
  intervalMinutes: number;
  eventTypes: { id: string }[];
  description: string;
  generatedByTest?: boolean;
}

interface NextPayload {
  application: { appKey?: string; id?: string };
}

export enum ServiceUserRoles {
  Admin = 'push-service-admin',
}

const isValidUrl = (urlString) => {
  let url;
  try {
    url = new URL(urlString);
  } catch (e) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
};

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

function mapStreamItem(item: StreamItem): Record<string, unknown> {
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

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

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

export interface StatusResponse {
  statusText?: string;
  status?: number;
  headers?: {
    date: Date;
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
    logger.debug(`Processing event ${next.namespace}:${next.name} ...`);
  });

  webhookEvents.subscribe(async (next) => {
    if (`${next.namespace}:${next.name}` !== 'push-service:webhook-triggered') {
      const tenant = await tenantService.getTenants();
      const tenantId = tenant[0]?.id;

      const token = await tokenProvider.getAccessToken();

      const user = {
        name: 'Push Service Admin',
        id: 'push-service-admin',
        tenantId,
        roles: [ServiceUserRoles.Admin],
      } as User;

      try {
        const response = await configurationService.getConfiguration<Record<string, Webhook>, Record<string, Webhook>>(
          serviceId,
          token,
          tenantId
        );

        const webhooks = response?.webhooks;

        Object.keys(webhooks).map(async (key) => {
          if (webhooks[key]) {
            const eventMatches = [];
            const webhook = webhooks[key] as Webhook;
            const eventTypes = webhook.eventTypes;

            eventTypes.map((et) => {
              const nextPayload = next.payload as unknown as NextPayload;
              if (`${next.namespace}:${next.name}` === et.id) {
                if (
                  (nextPayload?.application?.appKey && nextPayload?.application?.appKey === webhook.targetId) ||
                  (nextPayload?.application?.id && nextPayload?.application?.id === webhook.targetId)
                ) {
                  next.payload;
                  eventMatches.push(et.id);
                }
              }
            });
            const endpointWebsocket = webhooks[key].url;

            if (eventMatches.length > 0) {
              logger.debug(`Processing webhooks: ${next.namespace}:${next.name} ...`);
              let response: StatusResponse = {};
              let callResponseTime = 0;
              const beforeWebhook = new Date().getTime();
              try {
                if (isValidUrl(endpointWebsocket)) {
                  response = await axios.post(endpointWebsocket, next);
                  callResponseTime = new Date().getTime() - beforeWebhook;
                }
              } catch (err) {
                response.statusText = err.message;
                response.status = 400;
                response.headers = { date: new Date() };
                logger.info(`Failed sending request from status.`);
                logger.info(`Error: ${JSON.stringify(err.message, getCircularReplacer())}`);
                callResponseTime = new Date().getTime() - beforeWebhook;
              } finally {
                eventService.send(
                  webhookTriggered(
                    user,
                    tenantId,
                    webhook.url,
                    webhook.targetId,
                    webhook.eventTypes,
                    webhook.name,
                    response?.statusText,
                    response?.status,
                    response?.headers?.date,
                    callResponseTime
                  )
                );
              }
            }
          }
        });
      } catch (e) {
        console.error('Error: ' + JSON.stringify(e));
      }
    }
  });

  const streamRouter = Router();
  streamRouter.get('/streams', getStreams);
  streamRouter.get(
    '/streams/:stream',
    (req, _res, next) => getStream(tenantService, req, req.query.tenant as string, req.params.stream, next),
    subscribeBySse(logger, events)
  );

  for (const io of ios) {
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
  }

  return streamRouter;
};
