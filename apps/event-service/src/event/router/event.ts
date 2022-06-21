import { assertAuthenticatedHandler, createValidationHandler, InvalidOperationError } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { checkSchema } from 'express-validator';
import { Logger } from 'winston';
import { NamespaceEntity } from '../model';
import { AdspId, benchmark, EventService, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { DomainEventService } from '../service';
import { EventServiceRoles } from '../role';

interface EventRouterProps {
  logger: Logger;
  eventService: DomainEventService;
}

export const assertUserCanSend: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const { tenantId: tenantIdValue } = req.body;

    if (!user?.roles?.includes(EventServiceRoles.sender)) {
      throw new UnauthorizedUserError('send event', user);
    }

    // If tenant is explicity specified, then the user must be a core user.
    if (tenantIdValue && !user.isCore) {
      throw new UnauthorizedUserError('send tenant event.', user);
    }

    // Use specified tenantId or the user's tenantId.
    const tenantId = tenantIdValue ? AdspId.parse(tenantIdValue as string) : user.tenantId;
    if (!tenantId) {
      throw new InvalidOperationError('Cannot send event without tenant context.');
    }

    req.tenant = { id: tenantId, name: null, realm: null };

    next();
  } catch (err) {
    next(err);
  }
};

export const sendEvent =
  (logger: Logger, eventService: EventService): RequestHandler =>
  async (req, res, next) => {
    const user = req.user;
    const tenantId: AdspId = req.tenant.id;
    const { namespace, name, timestamp: timeValue } = req.body;

    try {
      const namespaces = await req.getConfiguration<Record<string, NamespaceEntity>, Record<string, NamespaceEntity>>(
        tenantId
      );

      logger.debug(`Processing sent event: ${namespace}:${name}...`);
      benchmark(req, 'operation-handler-time');

      if (!namespace || !name) {
        throw new InvalidOperationError('Event must include namespace and name of the event.');
      }

      if (!timeValue) {
        throw new InvalidOperationError(
          'Event must include a timestamp representing the time when the event occurred.'
        );
      }
      const timestamp = new Date(timeValue);

      // If the namespace or definition doesn't exist, then we treat it as an ad hoc event and skip validation.
      const entity: NamespaceEntity = namespaces[namespace];
      const definition = entity?.definitions[name];

      const event = { ...req.body, timestamp, tenantId };
      if (definition) {
        definition.validate(event);
      }
      eventService.send(event);

      benchmark(req, 'operation-handler-time');
      res.sendStatus(200);

      logger.info(`Event ${namespace}:${name} sent by user ${user.name} (ID: ${user.id}).`, {
        context: 'event-router',
        tenantId: tenantId.toString(),
        user: `${user.name} (ID: ${user.id})`,
      });
    } catch (err) {
      logger.warn(
        `Error encountered for event ${namespace}:${name} sent by user ${user.name} (ID: ${user.id}). ${err}`,
        {
          context: 'event-router',
          tenantId: tenantId.toString(),
          user: `${user.name} (ID: ${user.id})`,
        }
      );
      next(err);
    }
  };

export const createEventRouter = ({ logger, eventService }: EventRouterProps): Router => {
  const eventRouter = Router();

  eventRouter.post(
    '/events',
    assertAuthenticatedHandler,
    assertUserCanSend,
    createValidationHandler(
      ...checkSchema(
        {
          namespace: {
            isString: true,
            isLength: { options: { min: 1, max: 50 } },
          },
          name: {
            isString: true,
            isLength: { options: { min: 1, max: 50 } },
          },
          timestamp: {
            isISO8601: true,
          },
          correlationId: {
            optional: { options: { nullable: true } },
            isString: true,
          },
          context: {
            optional: { options: { nullable: true } },
            isObject: true,
          },
          payload: {
            isObject: true,
          },
        },
        ['body']
      )
    ),
    sendEvent(logger, eventService)
  );

  return eventRouter;
};
