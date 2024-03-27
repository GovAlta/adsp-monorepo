import { UnauthorizedUserError, isAllowedUser } from '@abgov/adsp-service-sdk';
import { WorkQueueService, createValidationHandler } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { checkSchema } from 'express-validator';
import * as hasha from 'hasha';
import { Logger } from 'winston';
import { FeedbackWorkItem } from './job';
import { ServiceRoles } from './roles';

export function sendFeedback(logger: Logger, queueService: WorkQueueService<FeedbackWorkItem>): RequestHandler {
  return async function (req, res, next) {
    try {
      const tenantId = req.tenant.id;
      const user = req.user;
      const { context, rating, comment } = req.body;

      if (!isAllowedUser(user, tenantId, ServiceRoles.FeedbackProvider)) {
        throw new UnauthorizedUserError('provide feedback', user);
      }

      const feedback = {
        context,
        rating: rating.toString(),
        comment,
      };

      // Hash the content for duplicate detection later.
      // Perform this here so the impact is on the producer side of the job queue.
      const digest = hasha(JSON.stringify(feedback), { algorithm: 'sha256' });

      await queueService.enqueue({
        tenantId: tenantId.toString(),
        timestamp: new Date().toISOString(),
        digest,
        feedback,
      });

      res.json({ sent: true });
    } catch (err) {
      next(err);
    }
  };
}

interface RouterProps {
  logger: Logger;
  queueService: WorkQueueService<FeedbackWorkItem>;
}

export function createFeedbackRouter({ logger, queueService }: RouterProps) {
  const router = Router();

  router.post(
    '/feedback',
    createValidationHandler(
      ...checkSchema(
        {
          context: { isObject: true },
          'context.site': { isString: true, isLength: { options: { min: 1, max: 100 } } },
          'context.view': { isString: true, isLength: { options: { min: 1, max: 500 } } },
          'context.correlationId': {
            isString: true,
            optional: { options: { nullable: true } },
            isLength: { options: { min: 1, max: 500 } },
          },
          rating: {
            isString: true,
            isIn: { options: [['terrible', 'bad', 'neutral', 'good', 'delightful']] },
          },
          comment: { isString: true, isLength: { options: { min: 1, max: 2000 } } },
        },
        ['body']
      )
    ),
    sendFeedback(logger, queueService)
  );

  return router;
}
