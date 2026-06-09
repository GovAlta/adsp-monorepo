import axios from 'axios';
import {
  AdspId,
  EventService,
  ServiceDirectory,
  TokenProvider,
  UnauthorizedUserError,
  adspId,
  isAllowedUser,
} from '@abgov/adsp-service-sdk';
import {
  InvalidOperationError,
  NotFoundError,
  UnauthorizedError,
  createValidationHandler,
  decodeAfter,
} from '@core-services/core-common';
import { Request, RequestHandler, Response, Router } from 'express';
import { body, param, query } from 'express-validator';
import * as HttpStatusCodes from 'http-status-codes';
import { Logger } from 'winston';
import { commentCreated, commentDeleted, commentUpdated, topicCreated, topicDeleted, topicUpdated } from '../events';
import { TopicEntity, TopicTypeEntity } from '../model';
import { TopicRepository } from '../repository';
import { DirectoryServiceRoles, ExportServiceRoles, ServiceRoles } from '../roles';
import { Topic, TopicType } from '../types';

interface TopicRouterProps {
  apiId: AdspId;
  logger: Logger;
  eventService: EventService;
  repository: TopicRepository;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}

type TopicTypeResponse = Omit<TopicType, 'tenantId'>;
function mapTopicType(type: TopicType): TopicTypeResponse | null {
  return type
    ? {
        id: type.id,
        name: type.name,
        adminRoles: type.adminRoles,
        readerRoles: type.readerRoles,
        commenterRoles: type.commenterRoles,
        securityClassification: type.securityClassification,
      }
    : null;
}

type TopicResponse = Omit<Topic, 'tenantId' | 'type'> & { type: TopicTypeResponse; urn: string };
function mapTopic(apiId: AdspId, topic: Topic): TopicResponse {
  return {
    type: mapTopicType(topic.type),
    id: topic.id,
    urn: `${apiId}:/topics/${topic.id}`,
    name: topic.name,
    description: topic.description,
    resourceId: topic.resourceId?.toString(),
    commenters: topic.commenters,
    securityClassification: topic.securityClassification,
    requiresAttention: topic.requiresAttention,
  };
}

export function getTopicTypes(): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id || user?.tenantId;
      if (!user) {
        throw new UnauthorizedError('User must be authenticated to get topic types.');
      }

      if (!isAllowedUser(user, tenantId, ServiceRoles.TopicSetter, true)) {
        throw new UnauthorizedUserError('get topic types', user);
      }

      const types = await req.getConfiguration<Record<string, TopicTypeEntity>, Record<string, TopicTypeEntity>>(
        tenantId
      );

      res.send(Object.values(types || {}).map(mapTopicType));
    } catch (err) {
      next(err);
    }
  };
}

export function getTopicType(): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id || user?.tenantId;
      if (!user) {
        throw new UnauthorizedError('User must be authenticated to get a topic type.');
      }

      if (!isAllowedUser(user, tenantId, ServiceRoles.TopicSetter, true)) {
        throw new UnauthorizedUserError('get topic type', user);
      }

      const topicTypeId = req.params.topicTypeId;
      const types = await req.getConfiguration<Record<string, TopicTypeEntity>, Record<string, TopicTypeEntity>>(
        tenantId
      );
      const type = types?.[topicTypeId];
      if (!type) {
        throw new NotFoundError('topic type', topicTypeId);
      }

      res.send(mapTopicType(type));
    } catch (err) {
      next(err);
    }
  };
}

export function createTopicType(
  apiId: AdspId,
  logger: Logger,
  directory: ServiceDirectory,
  tokenProvider: TokenProvider
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id || user?.tenantId;
      if (!user) {
        throw new UnauthorizedError('User must be authenticated to create a topic type.');
      }

      if (!isAllowedUser(user, tenantId, ServiceRoles.TopicSetter, true)) {
        throw new UnauthorizedUserError('create topic type', user);
      }

      const { id, name, readRoles, readerRoles, writeRoles = [] } = req.body;
      const resolvedReaderRoles = readerRoles || readRoles || [];
      const types = await req.getConfiguration<Record<string, TopicTypeEntity>, Record<string, TopicTypeEntity>>(
        tenantId
      );

      const existingTypeWithName = Object.values(types || {}).find((type) => type.name === name && type.id !== id);
      if (types?.[id] || existingTypeWithName) {
        throw new InvalidOperationError(`Topic type '${name}' already exists.`, {
          statusCode: HttpStatusCodes.CONFLICT,
        });
      }

      const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);
      const configurationUrl = new URL(`v2/configuration/${apiId.namespace}/${apiId.service}`, configurationServiceUrl);
      const token = await tokenProvider.getAccessToken();
      const topicType = {
        id,
        name,
        adminRoles: [],
        readerRoles: resolvedReaderRoles,
        commenterRoles: writeRoles,
      };

      await axios.patch(
        configurationUrl.href,
        {
          operation: 'UPDATE',
          update: {
            [id]: topicType,
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId?.toString() },
        }
      );

      res.send({ id });

      logger.info(`Topic type ${name} (ID: ${id}) created by user ${user.name} (ID: ${user.id}).`, {
        context: 'comment-router',
        tenantId: tenantId?.toString(),
        user: `${user.name} (ID: ${user.id})`,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function updateTopicType(
  apiId: AdspId,
  logger: Logger,
  directory: ServiceDirectory,
  tokenProvider: TokenProvider
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id || user?.tenantId;
      if (!user) {
        throw new UnauthorizedError('User must be authenticated to update a topic type.');
      }

      if (!isAllowedUser(user, tenantId, ServiceRoles.TopicSetter, true)) {
        throw new UnauthorizedUserError('update topic type', user);
      }

      const topicTypeId = req.params.topicTypeId;
      const types = await req.getConfiguration<Record<string, TopicTypeEntity>, Record<string, TopicTypeEntity>>(
        tenantId
      );
      const type = types?.[topicTypeId];
      if (!type) {
        throw new NotFoundError('topic type', topicTypeId);
      }

      const { name, readRoles, readerRoles, writeRoles } = req.body;
      const topicType = {
        id: type.id,
        name: name ?? type.name,
        adminRoles: type.adminRoles,
        readerRoles: readerRoles ?? readRoles ?? type.readerRoles,
        commenterRoles: writeRoles ?? type.commenterRoles,
        securityClassification: type.securityClassification,
      };

      const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);
      const configurationUrl = new URL(`v2/configuration/${apiId.namespace}/${apiId.service}`, configurationServiceUrl);
      const token = await tokenProvider.getAccessToken();

      await axios.patch(
        configurationUrl.href,
        {
          operation: 'UPDATE',
          update: {
            [topicTypeId]: topicType,
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId?.toString() },
        }
      );

      res.send(mapTopicType({ ...topicType, tenantId }));

      logger.info(`Topic type ${topicTypeId} updated by user ${user.name} (ID: ${user.id}).`, {
        context: 'comment-router',
        tenantId: tenantId?.toString(),
        user: `${user.name} (ID: ${user.id})`,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function deleteTopicType(
  apiId: AdspId,
  logger: Logger,
  repository: TopicRepository,
  directory: ServiceDirectory,
  tokenProvider: TokenProvider
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id || user?.tenantId;
      if (!user) {
        throw new UnauthorizedError('User must be authenticated to delete a topic type.');
      }

      if (!isAllowedUser(user, tenantId, ServiceRoles.TopicSetter, true)) {
        throw new UnauthorizedUserError('delete topic type', user);
      }

      const topicTypeId = req.params.topicTypeId;
      const types = await req.getConfiguration<Record<string, TopicTypeEntity>, Record<string, TopicTypeEntity>>(
        tenantId
      );

      if (!types?.[topicTypeId]) {
        throw new NotFoundError('topic type', topicTypeId);
      }

      const associatedTopics = await repository.countTopicsByType(tenantId, topicTypeId);

      if (associatedTopics > 0) {
        res.status(HttpStatusCodes.CONFLICT).send({
          errorMessage: `Topic type '${topicTypeId}' cannot be deleted because ${associatedTopics} topic(s) are associated with it.`,
          topics: associatedTopics,
        });
        return;
      }

      const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);
      const configurationUrl = new URL(`v2/configuration/${apiId.namespace}/${apiId.service}`, configurationServiceUrl);
      const token = await tokenProvider.getAccessToken();

      await axios.patch(
        configurationUrl.href,
        {
          operation: 'DELETE',
          property: topicTypeId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId?.toString() },
        }
      );

      res.send({ deleted: true, id: topicTypeId });

      logger.info(`Topic type ${topicTypeId} deleted by user ${user.name} (ID: ${user.id}).`, {
        context: 'comment-router',
        tenantId: tenantId?.toString(),
        user: `${user.name} (ID: ${user.id})`,
      });
    } catch (err) {
      next(err);
    }
  };
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
      const { page, results: entities } = await repository.getTopics(types, top, after as string, {
        ...criteria,
        tenantIdEquals: tenantId,
      });

      const results = isAllowedUser(user, tenantId, ExportServiceRoles.ExportJob, true)
        ? entities
        : entities.filter((r) => r.canRead(user));

      res.send({
        page,
        results: results.map((r) => mapTopic(apiId, r)),
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

      eventService.send(topicCreated(apiId, result, user));

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
export function getTopic(repository: TopicRepository, ...roles: string[]): RequestHandler {
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

      if (!entity.canRead(user) && !isAllowedUser(user, tenantId, [ServiceRoles.TopicSetter, ...roles], true)) {
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

      eventService.send(topicUpdated(apiId, result, user));

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

export function deleteTopic(apiId: AdspId, logger: Logger, eventService: EventService): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const topic: TopicEntity = req[TopicKey];

      const deleted = await topic.delete(user);

      res.send({ deleted });

      if (deleted) {
        eventService.send(topicDeleted(apiId, topic, user));

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

export function createTopicComment(apiId: AdspId, logger: Logger, eventService: EventService): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { requiresAttention, ...comment } = req.body;
      const topic: TopicEntity = req[TopicKey];

      const result = await topic.postComment(user, comment, requiresAttention);
      res.send(result);

      eventService.send(commentCreated(apiId, topic, result));

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

export function updateTopicComment(apiId: AdspId, logger: Logger, eventService: EventService): RequestHandler {
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

      eventService.send(commentUpdated(apiId, topic, result));

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

export function deleteTopicComment(apiId: AdspId, logger: Logger, eventService: EventService): RequestHandler {
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
        eventService.send(commentDeleted(apiId, topic, comment, user));
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

export function createTopicRouter({
  apiId,
  logger,
  eventService,
  repository,
  directory,
  tokenProvider,
}: TopicRouterProps): Router {
  const router = Router();

  router.get('/topic-types', getTopicTypes());
  router.post(
    '/topic-types',
    createValidationHandler(
      body('id').isString().isLength({ min: 1, max: 50 }).matches(/^[a-zA-Z0-9-_ ]{1,50}$/),
      body('name').isString().isLength({ min: 1, max: 50 }),
      body('readRoles').optional().isArray(),
      body('readRoles.*').optional().isString(),
      body('readerRoles').optional().isArray(),
      body('readerRoles.*').optional().isString(),
      body('writeRoles').optional().isArray(),
      body('writeRoles.*').optional().isString()
    ),
    createTopicType(apiId, logger, directory, tokenProvider)
  );
  router.get(
    '/topic-types/:topicTypeId',
    createValidationHandler(param('topicTypeId').isString().isLength({ min: 1, max: 50 }).matches(/^[a-zA-Z0-9-_ ]{1,50}$/)),
    getTopicType()
  );
  router.patch(
    '/topic-types/:topicTypeId',
    createValidationHandler(
      param('topicTypeId').isString().isLength({ min: 1, max: 50 }).matches(/^[a-zA-Z0-9-_ ]{1,50}$/),
      body('name').optional().isString().isLength({ min: 1, max: 50 }),
      body('readRoles').optional().isArray(),
      body('readRoles.*').optional().isString(),
      body('readerRoles').optional().isArray(),
      body('readerRoles.*').optional().isString(),
      body('writeRoles').optional().isArray(),
      body('writeRoles.*').optional().isString()
    ),
    updateTopicType(apiId, logger, directory, tokenProvider)
  );
  router.delete(
    '/topic-types/:topicTypeId',
    createValidationHandler(param('topicTypeId').isString().isLength({ min: 1, max: 50 }).matches(/^[a-zA-Z0-9-_ ]{1,50}$/)),
    deleteTopicType(apiId, logger, repository, directory, tokenProvider)
  );

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
    getTopic(repository, DirectoryServiceRoles.ResourceResolver),
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
    deleteTopic(apiId, logger, eventService)
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
      body('title').optional({ nullable: true }).isString().isLength({ min: 1, max: 255 }),
      body('content').isString().isLength({ min: 1 }),
      body('context').optional().isObject(),
      body('requiresAttention').optional({ nullable: true }).isBoolean()
    ),
    getTopic(repository),
    createTopicComment(apiId, logger, eventService)
  );

  router.get(
    '/topics/:topicId/comments/:commentId',
    createValidationHandler(param('topicId').isInt(), param('commentId').isInt()),
    getTopic(repository),
    getTopicComment()
  );
  router.patch(
    '/topics/:topicId/comments/:commentId',
    createValidationHandler(
      param('topicId').isInt(),
      param('commentId').isInt(),
      body('title').optional({ nullable: true }).isString().isLength({ min: 1, max: 255 }),
      body('content').optional().isString().isLength({ min: 1 }),
      body('context').optional().isObject()
    ),
    getTopic(repository),
    updateTopicComment(apiId, logger, eventService)
  );
  router.delete(
    '/topics/:topicId/comments/:commentId',
    createValidationHandler(param('topicId').isInt(), param('commentId').isInt()),
    getTopic(repository),
    deleteTopicComment(apiId, logger, eventService)
  );

  return router;
}
