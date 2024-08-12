import { AdspId, DomainEvent, EventService, isAllowedUser, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { createValidationHandler, InvalidOperationError } from '@core-services/core-common';
import * as dashify from 'dashify';
import { RequestHandler, Router } from 'express';
import { Logger } from 'winston';
import { DirectoryRepository } from '../repository';
import { ServiceRoles } from '../roles';
import { Resource, Tag } from '../types';
import { TAG_OPERATION_TAG, TAG_OPERATION_UNTAG, TagOperationRequests } from './types';
import { taggedResource, untaggedResource } from '../events';
import { body, query } from 'express-validator';

interface ResourceRouterProps {
  logger: Logger;
  eventService: EventService;
  repository: DirectoryRepository;
}

function mapTag(tag: Tag) {
  return tag
    ? {
        label: tag.label,
        value: tag.value,
      }
    : null;
}

function mapResource(resource: Resource) {
  return resource
    ? {
        urn: resource.urn.toString(),
        name: resource.name,
        description: resource.description,
      }
    : null;
}

export function getTags(repository: DirectoryRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;
      const { top: topValue, after, resource: resourceValue } = req.query;
      const top = topValue ? parseInt(topValue as string) : 10;
      const resource = resourceValue ? AdspId.parse(resourceValue as string) : null;

      if (!isAllowedUser(user, tenantId, [ServiceRoles.ResourceBrowser, ServiceRoles.ResourceTagger])) {
        throw new UnauthorizedUserError('get tags', user);
      }

      const { results, page } = await repository.getTags(top, after as string, {
        tenantIdEquals: tenantId,
        resourceUrnEquals: resource,
      });
      res.send({
        results: results.map(mapTag),
        page,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function tagOperation(
  logger: Logger,
  eventService: EventService,
  repository: DirectoryRepository
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;
      const tagRequest: TagOperationRequests = req.body;

      logger.debug(`Performing tag operation '${tagRequest.operation}'...`, {
        context: 'ResourceRouter',
        tenantId: tenantId?.toString,
        user: { id: user.id, name: user.name },
      });

      if (!isAllowedUser(user, tenantId, ServiceRoles.ResourceTagger)) {
        throw new UnauthorizedUserError('tag resource', user);
      }

      const { tag: tagValue, resource: resourceValue } = tagRequest;

      if (!tagValue || !(tagValue.label || tagValue.value)) {
        throw new InvalidOperationError('Tag with either label or value must be specified.');
      }

      const targetTag = {
        tenantId,
        label: tagValue.label,
        value: tagValue.value || dashify(tagValue.label),
      };

      if (!resourceValue) {
        throw new InvalidOperationError('Resource must be specified.');
      }

      if (!AdspId.isAdspId(resourceValue.urn)) {
        throw new InvalidOperationError('Resource URN is not valid.');
      }

      const urn = AdspId.parse(resourceValue.urn);
      if (urn.type !== 'resource') {
        throw new InvalidOperationError('Resource URN is not valid.');
      }

      const targetResource = {
        tenantId,
        urn,
        name: resourceValue.name,
        description: resourceValue.description,
      };

      let result, event: DomainEvent;
      switch (tagRequest.operation) {
        case TAG_OPERATION_TAG: {
          const { tag, resource, tagged } = await repository.applyTag(targetTag, targetResource);

          result = {
            tagged,
            tag: mapTag(tag),
            resource: mapResource(resource),
          };

          if (tagged) {
            event = taggedResource(resource, tag, user);
          }
          break;
        }
        case TAG_OPERATION_UNTAG: {
          const { tag, resource, untagged } = await repository.removeTag(targetTag, targetResource);

          result = {
            untagged,
            tag: mapTag(tag),
            resource: mapResource(resource),
          };

          if (untagged) {
            event = untaggedResource(resource, tag, user);
          }
          break;
        }
        default:
          throw new InvalidOperationError('Operation not supported.');
      }

      res.send(result);

      logger.info(
        `Completed tag operation '${tagRequest.operation}' for user '${user.name}' (ID: ${user.id})` +
          ` with result: ${result.tagged || result.untagged}.`,
        {
          context: 'ResourceRouter',
          tenantId: tenantId?.toString,
          user: { id: user.id, name: user.name },
        }
      );

      if (event) {
        eventService.send(event);
      }
    } catch (err) {
      next(err);
    }
  };
}

export function getTaggedResources(repository: DirectoryRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;
      const { tag } = req.params;
      const { top: topValue, after } = req.query;
      const top = topValue ? parseInt(topValue as string) : 10;

      if (!isAllowedUser(user, tenantId, [ServiceRoles.ResourceBrowser, ServiceRoles.ResourceTagger])) {
        throw new UnauthorizedUserError('get tagged resources', user);
      }

      const { results, page } = await repository.getTaggedResources(tenantId, tag, top, after as string);

      res.send({
        results: results.map(mapResource),
        page,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function createResourceRouter({ logger, eventService, repository }: ResourceRouterProps) {
  const router = Router();

  router.get(
    '/tags',
    createValidationHandler(
      query('top').optional().isInt({ min: 1, max: 500 }),
      query('after').optional().isString(),
      query('resource').optional().isString().isLength({ min: 1, max: 2000 })
    ),
    getTags(repository)
  );
  router.post(
    '/tags',
    createValidationHandler(
      body('operation').isIn([TAG_OPERATION_TAG, TAG_OPERATION_UNTAG]),
      body('tag').isObject(),
      body('tag.label').optional().isString().isLength({ min: 1, max: 100 }),
      body('tag.value')
        .optional()
        .isString()
        .matches(/^[0-9a-z-]{1,100}$/),
      body('resource').isObject(),
      body('resource.urn').isString().isLength({ min: 1, max: 2000 })
    ),
    tagOperation(logger, eventService, repository)
  );

  router.get(
    '/tags/:tag/resources',
    createValidationHandler(query('top').optional().isInt({ min: 1, max: 500 }), query('after').optional().isString()),
    getTaggedResources(repository)
  );

  return router;
}
