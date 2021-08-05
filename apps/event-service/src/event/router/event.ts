import { assertAuthenticatedHandler, InvalidOperationError } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { Logger } from 'winston';
import { NamespaceEntity } from '../model';
import { AdspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { DomainEventService } from '../service';
import { EventServiceRoles } from '../role';

interface EventRouterProps {
  logger: Logger;
  eventService: DomainEventService;
}

export const assertUserCanSend: RequestHandler = async (req, res, next) => {
  const user = req.user;
  const { tenantId: tenantIdValue } = req.body;

  if (!user?.roles?.includes(EventServiceRoles.sender)) {
    next(new UnauthorizedUserError('send event', user));
    return;
  }

  // If tenant is explicity specified, then the user must be a core user.
  if (tenantIdValue && !user.isCore) {
    next(new UnauthorizedUserError('send tenant event.', user));
    return;
  }

  // Use specified tenantId or the user's tenantId.
  const tenantId = tenantIdValue ? AdspId.parse(tenantIdValue as string) : user.tenantId;
  req['tenantId'] = tenantId;

  next();
};

export const createEventRouter = ({ logger, eventService }: EventRouterProps): Router => {
  const eventRouter = Router();

  eventRouter.post('/events', assertAuthenticatedHandler, assertUserCanSend, async (req, res, next) => {
    const user = req.user;
    const { namespace, name, timestamp: timeValue } = req.body;
    const tenantId: AdspId = req['tenantId'];

    logger.debug(`Processing sent event: ${namespace}:${name}...`);

    if (!namespace || !name) {
      next(new InvalidOperationError('Event must include namespace and name of the event.'));
      return;
    }

    if (!timeValue) {
      next(new InvalidOperationError('Event must include a timestamp representing the time when the event occurred.'));
      return;
    }
    const timestamp = new Date(timeValue);

    const [configuration, options] = await req.getConfiguration<
      Record<string, NamespaceEntity>,
      Record<string, NamespaceEntity>
    >(tenantId);

    const namespaces: Record<string, NamespaceEntity> = {
      ...(configuration || {}),
      ...(options || {}),
    };

    // If the namespace or definition doesn't exist, then we treat it as an ad hoc event and skip validation.
    const entity: NamespaceEntity = namespaces[namespace];
    const definition = entity?.definitions[name];

    try {
      const event = { ...req.body, timestamp, tenantId };
      if (definition) {
        definition.validate(event);
      }
      eventService.send(event);

      res.sendStatus(200);
      logger.info(`Event ${namespace}:${name} sent by user ${user.name} (ID: ${user.id}).`, {
        context: 'event-service-router',
        tenantId: tenantId.toString(),
      });
    } catch (err) {
      next(err);
    }
  });

  return eventRouter;
};
