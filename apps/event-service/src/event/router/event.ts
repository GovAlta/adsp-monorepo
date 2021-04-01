import {
  assertAuthenticatedHandler,
  DomainEventService,
  InvalidOperationError,
  NotFoundError,
  User,
} from '@core-services/core-common';
import { Router } from 'express';
import { Logger } from 'winston';
import { EventRepository } from '../repository';

interface EventRouterProps {
  logger: Logger;
  eventService: DomainEventService;
  eventRepository: EventRepository;
}

export const createEventRouter = ({ logger, eventService, eventRepository }: EventRouterProps): Router => {
  const eventRouter = Router();

  /**
   * @swagger
   *
   * /event/v1/event:
   *   post:
   *     tags:
   *     - Event
   *     description: Send an event.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               namespace:
   *                 type: string
   *               name:
   *                 type: string
   *               timestamp:
   *                 type: string
   *                 format: datetime
   *             required:
   *               - namespace
   *               - name
   *               - timestamp
   *             additionalProperties: true
   *     responses:
   *       200:
   *         description: Event successfully sent.
   *       401:
   *         description: User not authorized to send event.
   *       404:
   *         description: Event definition not found.
   */
  eventRouter.post('/event', assertAuthenticatedHandler, (req, res, next) => {
    const user = req.user as User;
    const { namespace, name, timestamp: timeValue } = req.body;

    if (!timeValue) {
      throw new InvalidOperationError('Event must include a timestamp representing the time when the event occurred.');
    }

    const timestamp = new Date(timeValue);

    eventRepository
      .getDefinition(namespace, name)
      .then((definition) => {
        if (!definition) {
          throw new NotFoundError('Event Definition', `${namespace}:${name}`);
        }
        return definition;
      })
      .then((definition) => definition.send(eventService, user, { ...req.body, timestamp }))
      .then(() => res.sendStatus(200))
      .then(() => logger.debug(`Event ${namespace}:${name} sent by user ${user.name} (ID: ${user.id}).`))
      .catch((err) => next(err));
  });

  return eventRouter;
};
