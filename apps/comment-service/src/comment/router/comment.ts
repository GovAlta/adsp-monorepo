import { UnauthorizedUserError, isAllowedUser } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { TopicTypeEntity } from '../model';
import { TopicRepository } from '../repository';
import { ExportServiceRoles, ServiceRoles } from '../roles';
import { CommentCriteria } from '../types';

interface CommentRouterProps {
  repository: TopicRepository;
}

export function getComments(repository: TopicRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant.id;
      const { top: topValue, after, criteria: criteriaValue } = req.query;
      const top = topValue ? parseInt(topValue as string) : 10;
      const criteria: CommentCriteria = criteriaValue ? JSON.parse(criteriaValue as string) : null;

      // If type ID is specified in the criteria, then access is determined by the type configuration.
      // Otherwise user must be a comment service admin to search comments.
      if (criteria?.typeIdEquals) {
        const types = await req.getConfiguration<Record<string, TopicTypeEntity>, Record<string, TopicTypeEntity>>(
          tenantId
        );

        const type = types[criteria.typeIdEquals];
        if (!type) {
          throw new NotFoundError('topic type', criteria.typeIdEquals);
        }

        if (!type.canRead(user) && !isAllowedUser(user, tenantId, ExportServiceRoles.ExportJob)) {
          throw new UnauthorizedUserError('get comments', user);
        }
      } else if (
        !isAllowedUser(user, tenantId, ServiceRoles.Admin) &&
        !isAllowedUser(user, tenantId, ExportServiceRoles.ExportJob)
      ) {
        throw new UnauthorizedUserError('get comments', user);
      }

      const result = await repository.getComments(top, after as string, { ...criteria, tenantIdEquals: tenantId });

      res.send(result);
    } catch (err) {
      next(err);
    }
  };
}

export function createCommentRouter({ repository }: CommentRouterProps): Router {
  const router = Router();

  router.get('/comments', getComments(repository));

  return router;
}
