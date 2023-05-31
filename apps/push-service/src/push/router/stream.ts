import {
  adspId,
  ConfigurationService,
  TenantService,
  UnauthorizedUserError,
  User,
  ServiceDirectory,
  TokenProvider,
  EventService,
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
  tenantService: TenantService;
  configurationService: ConfigurationService;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  eventService: EventService;
}

export interface Webhooks {
  id: string;
  url: string;
  name: string;
  targetId: string;
  intervalSeconds: number;
  eventTypes: { id: string }[];
  description: string;
}

interface NextPayload {
  application: { appKey: string };
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

const LOG_CONTEXT = { context: 'StreamRouter' };
export const createStreamRouter = (
  ios: IoNamespace[],
  { logger, eventServiceAmp, tenantService, directory, tokenProvider, eventService }: StreamRouterProps
): Router => {
  const events = eventServiceAmp.getItems().pipe(
    map(({ item, done }) => {
      done();
      return item;
    }),
    share()
  );

  events.subscribe((next) => {
    logger.debug(`Processing event ${next.namespace}:${next.name} ...`);

    tenantService.getTenants().then((tenant) => {
      const tenantId = tenant[0]?.id;

      const user = {
        tenantId,
        roles: [ServiceUserRoles.Admin],
      } as User;

      directory.getServiceUrl(adspId`urn:ads:platform:configuration-service`).then((configurationServiceUrl) => {
        tokenProvider.getAccessToken().then((token) => {
          const subscribersUrl = new URL(
            `/configuration/v2/configuration/platform/push-service?tenantId=${tenant[0].id}`,
            configurationServiceUrl
          );

          try {
            axios
              .get(subscribersUrl.href, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .then(({ data }) => {
                const webhooks = data.latest.configuration;

                Object.keys(webhooks).map(async (key) => {
                  const eventMatches = [];
                  const webhook = webhooks[key] as Webhooks;
                  const eventTypes = webhook.eventTypes;

                  eventTypes.map((et) => {
                    const nextPayload = next.payload as unknown as NextPayload;
                    if (`${next.namespace}:${next.name}` === et.id && et.id !== 'push-service:webhook-triggered') {
                      if (!nextPayload?.application?.appKey || nextPayload?.application?.appKey === webhook.targetId) {
                        next.payload;
                        eventMatches.push(et.id);
                      }
                    }
                  });
                  const endpointWebsocket = webhooks[key].url;

                  if (eventMatches.length > 0) {
                    let response: any;
                    let callResponseTime = 0;
                    try {
                      if (isValidUrl(endpointWebsocket)) {
                        const beforeWebhook = new Date().getTime();
                        response = await axios.post(endpointWebsocket, next);
                        callResponseTime = new Date().getTime() - beforeWebhook;
                      }
                    } catch (err) {
                      logger.info(`Failed sending request from status.`);
                      logger.info(`Error: ${JSON.stringify(err)}`);
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
                });
              });
          } catch (e) {
            console.error(JSON.stringify(e) + '< eee---');
          }
        });
      });
    });
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
