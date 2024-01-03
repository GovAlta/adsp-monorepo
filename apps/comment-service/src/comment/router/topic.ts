import { AdspId, EventService, UnauthorizedUserError, adspId, isAllowedUser } from '@abgov/adsp-service-sdk';
import { NotFoundError, createValidationHandler, decodeAfter } from '@core-services/core-common';
import { Request, RequestHandler, Response, Router } from 'express';
import { body, param, query } from 'express-validator';
import { Logger } from 'winston';
import { commentCreated, commentDeleted, commentUpdated, topicCreated, topicDeleted, topicUpdated } from '../events';
import { TopicEntity, TopicTypeEntity } from '../model';
import { TopicRepository } from '../repository';
import { ServiceRoles } from '../roles';
import { Topic } from '../types';

interface TopicRouterProps {
  apiId: AdspId;
  logger: Logger;
  eventService: EventService;
  repository: TopicRepository;
}

function mapTopic(apiId: AdspId, topic: Topic) {
  return topic
    ? {
        type: topic.type
          ? {
              id: topic.type?.id,
              name: topic.type?.name,
            }
          : null,
        id: topic.id,
        urn: adspId`${apiId}:/topics/${topic.id}`.toString(),
        name: topic.name,
        description: topic.description,
        resourceId: topic.resourceId?.toString(),
        commenters: topic.commenters,
        securityClassification: topic.securityClassification,
      }
    : null;
}

export function getTopics(apiId: AdspId, repository: TopicRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;
      const { top: topValue, after, criteria: criteriaValue } = req.query;
      const top = topValue ? parseInt(topValue as string) : 10;
      const criteria = criteriaValue ? JSON.parse(criteriaValue as string) : null;

      const types = await req.getConfiguration<Record<string, TopicTypeEntity>, Record<string, TopicTypeEntity>>(
        tenantId
      );
      const { page, results } = await repository.getTopics(types, top, after as string, {
        ...criteria,
        tenantIdEquals: tenantId,
      });

      res.send({
        page,
        results: results.filter((r) => r.canRead(user)).map((r) => mapTopic(apiId, r)),
      });
    } catch (err) {
      next(err);
    }
  };
}

export function createTopic(
  apiId: AdspId,
  logger: Logger,
  repository: TopicRepository,
  eventService: EventService
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant.id;
      const { typeId, resourceId: resourceIdValue, ...topic } = req.body;

      const types = await req.getConfiguration<Record<string, TopicTypeEntity>, Record<string, TopicTypeEntity>>(
        tenantId
      );
      const type = types[typeId];
      if (!type) {
        throw new NotFoundError('topic type', typeId);
      }
      const result = await TopicEntity.create(user, repository, type, {
        typeId,
        resourceId: AdspId.isAdspId(resourceIdValue) ? AdspId.parse(resourceIdValue) : resourceIdValue,
        ...topic,
      });
      res.send(mapTopic(apiId, result));

      eventService.send(topicCreated(result, user));

      logger.info(
        `Topic ${result.name} (ID: ${result.id}) of type ${typeId} created by user ${user.name} (ID: ${user.id}).`,
        {
          context: 'comment-router',
          tenantId: tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
        }
      );
    } catch (err) {
      next(err);
    }
  };
}

const TopicKey = 'topic';
export function getTopic(repository: TopicRepository): RequestHandler {
  return async (req, _res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;
      const { topicId: topicIdValue } = req.params;
      const topicId = parseInt(topicIdValue);

      const types = await req.getConfiguration<Record<string, TopicTypeEntity>, Record<string, TopicTypeEntity>>(
        tenantId
      );
      const entity = await repository.getTopic(types, topicId, tenantId);
      if (!entity) {
        throw new NotFoundError('topic', topicIdValue);
      }

      if (!entity.canRead(user) && !isAllowedUser(user, tenantId, ServiceRoles.TopicSetter, true)) {
        throw new UnauthorizedUserError('get topic', user);
      }

      req[TopicKey] = entity;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function updateTopic(apiId: AdspId, logger: Logger, eventService: EventService): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const update = req.body;
      const topic: TopicEntity = req[TopicKey];

      const result = await topic.update(user, update);

      res.send(mapTopic(apiId, result));

      eventService.send(topicUpdated(result, user));

      logger.info(`Topic ${result.name} (ID: ${result.id}) updated by user ${user.name} (ID: ${user.id}).`, {
        context: 'comment-router',
        tenantId: topic.tenantId?.toString(),
        user: `${user.name} (ID: ${user.id})`,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function deleteTopic(logger: Logger, eventService: EventService): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const topic: TopicEntity = req[TopicKey];

      const deleted = await topic.delete(user);

      res.send({ deleted });

      if (deleted) {
        eventService.send(topicDeleted(topic, user));

        logger.info(`Topic ${topic.name} (ID: ${topic.id}) deleted by user ${user.name} (ID: ${user.id}).`, {
          context: 'comment-router',
          tenantId: topic.tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
        });
      }
    } catch (err) {
      next(err);
    }
  };
}

export function getTopicComments(): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const topic: TopicEntity = req[TopicKey];
      const { top: topValue, after, criteria: criteriaValue } = req.query;
      const top = topValue ? parseInt(topValue as string) : 10;
      const criteria = criteriaValue ? JSON.parse(criteriaValue as string) : null;

      const result = await topic.getComments(user, top, after as string, criteria);
      res.send(result);
    } catch (err) {
      next(err);
    }
  };
}

export function createTopicComment(logger: Logger, eventService: EventService): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const comment = req.body;
      const topic: TopicEntity = req[TopicKey];

      const result = await topic.postComment(user, comment);
      res.send(result);

      eventService.send(commentCreated(topic, result));

      logger.info(
        `Topic ${topic.name} (ID: ${topic.id}) comment (ID: ${result.id}) created by user ${user.name} (ID: ${user.id}).`,
        {
          context: 'comment-router',
          tenantId: topic.tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
        }
      );
    } catch (err) {
      next(err);
    }
  };
}

export function getTopicComment(): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { commentId: commentIdValue } = req.params;
      const topic: TopicEntity = req[TopicKey];

      const comment = await topic.getComment(user, parseInt(commentIdValue));
      if (!comment) {
        throw new NotFoundError('topic comment', commentIdValue);
      }

      res.send(comment);
    } catch (err) {
      next(err);
    }
  };
}

export function updateTopicComment(logger: Logger, eventService: EventService): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { commentId: commentIdValue } = req.params;
      const update = req.body;
      const topic: TopicEntity = req[TopicKey];

      const comment = await topic.getComment(user, parseInt(commentIdValue));
      if (!comment) {
        throw new NotFoundError('topic comment', commentIdValue);
      }

      const result = await topic.updateComment(user, comment, update);
      res.send(result);

      eventService.send(commentUpdated(topic, result));

      logger.info(
        `Topic ${topic.name} (ID: ${topic.id}) comment (ID: ${result.id}) updated by user ${user.name} (ID: ${user.id}).`,
        {
          context: 'comment-router',
          tenantId: topic.tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
        }
      );
    } catch (err) {
      next(err);
    }
  };
}

export function deleteTopicComment(logger: Logger, eventService: EventService): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { commentId: commentIdValue } = req.params;
      const topic: TopicEntity = req[TopicKey];

      const comment = await topic.getComment(user, parseInt(commentIdValue));
      if (!comment) {
        throw new NotFoundError('topic comment', commentIdValue);
      }

      const deleted = await topic.deleteComment(user, comment);
      res.send({ deleted });

      if (deleted) {
        eventService.send(commentDeleted(topic, comment, user));
        logger.info(
          `Topic ${topic.name} (ID: ${topic.id}) comment (ID: ${comment.id}) deleted by user ${user.name} (ID: ${user.id}).`,
          {
            context: 'comment-router',
            tenantId: topic.tenantId?.toString(),
            user: `${user.name} (ID: ${user.id})`,
          }
        );
      }
    } catch (err) {
      next(err);
    }
  };
}

export function createTopicRouter({ apiId, logger, eventService, repository }: TopicRouterProps): Router {
  const router = Router();

  router.get(
    '/topics',
    createValidationHandler(
      query('top').optional().isInt({ min: 1, max: 5000 }),
      query('after')
        .optional()
        .isString()
        .custom((val) => {
          return !isNaN(decodeAfter(val));
        })
    ),
    getTopics(apiId, repository)
  );
  router.post(
    '/topics',
    createValidationHandler(
      body('typeId').isString().isLength({ min: 1, max: 50 }),
      body('name').isString().isLength({ min: 1, max: 50 }),
      body('description').optional().isString(),
      body('securityClassification').optional().isString(),
      body('resourceId').optional().isString().isLength({ min: 1, max: 1200 })
    ),
    createTopic(apiId, logger, repository, eventService)
  );

  router.get(
    '/topics/:topicId',
    createValidationHandler(param('topicId').isInt()),
    getTopic(repository),
    (req: Request, res: Response) => res.send(mapTopic(apiId, req[TopicKey]))
  );
  router.patch(
    '/topics/:topicId',
    createValidationHandler(
      param('topicId').isInt(),
      body('name').optional().isString().isLength({ min: 1, max: 50 }),
      body('description').optional().isString(),
      body('commenters').optional().isArray()
    ),
    getTopic(repository),
    updateTopic(apiId, logger, eventService)
  );
  router.delete(
    '/topics/:topicId',
    createValidationHandler(param('topicId').isInt()),
    getTopic(repository),
    deleteTopic(logger, eventService)
  );

  router.get(
    '/topics/:topicId/comments',
    createValidationHandler(
      param('topicId').isInt(),
      query('top').optional().isInt({ min: 1, max: 5000 }),
      query('after')
        .optional()
        .isString()
        .custom((val) => {
          return !isNaN(decodeAfter(val));
        })
    ),
    getTopic(repository),
    getTopicComments()
  );
  router.post(
    '/topics/:topicId/comments',
    createValidationHandler(
      param('topicId').isInt(),
      body('title').isString().isLength({ min: 1 }),
      body('content').isString().isLength({ min: 1 })
    ),
    getTopic(repository),
    createTopicComment(logger, eventService)
  );

  router.get(
    '/topics/:topicId/comments/:commentId',
    createValidationHandler(param('topicId').isInt(), param('commentId').isInt()),
    getTopic(repository),
    getTopicComment()
  );
  router.patch(
    '/topics/:topicId/comments/:commentId',
    createValidationHandler(param('topicId').isInt(), param('commentId').isInt()),
    getTopic(repository),
    updateTopicComment(logger, eventService)
  );
  router.delete(
    '/topics/:topicId/comments/:commentId',
    createValidationHandler(param('topicId').isInt(), param('commentId').isInt()),
    getTopic(repository),
    deleteTopicComment(logger, eventService)
  );

  return router;
}
