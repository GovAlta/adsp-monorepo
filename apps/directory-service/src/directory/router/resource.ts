import {
  AdspId,
  DomainEvent,
  EventService,
  isAllowedUser,
  ServiceDirectory,
  UnauthorizedUserError,
} from '@abgov/adsp-service-sdk';
import { createValidationHandler, InvalidOperationError } from '@core-services/core-common';
import * as dashify from 'dashify';
import { RequestHandler, Router } from 'express';
import { body, query } from 'express-validator';
import { Logger } from 'winston';
import { DirectoryRepository } from '../repository';
import { ServiceRoles } from '../roles';
import { Resource, Tag } from '../types';
import { TAG_OPERATION_TAG, TAG_OPERATION_UNTAG, TagOperationRequests } from './types';
import { taggedResource, untaggedResource } from '../events';
import { DirectoryConfiguration } from '../configuration';

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
        type: resource.type,
        _links: {
          represents: { href: resource.urn.toString() },
        },
        _embedded: resource.data && {
          represents: resource.data,
        },
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
  directory: ServiceDirectory,
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
        user: `${user.name} (ID: ${user.id})`,
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

      const resourceUrl = await directory.getResourceUrl(urn);
      if (!resourceUrl) {
        throw new InvalidOperationError(
          'Resource URL cannot be resolved. Associated API must be registered in the directory.'
        );
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
          const { tag, resource, tagged, isNewResource } = await repository.applyTag(targetTag, targetResource);

          result = {
            tagged,
            tag: mapTag(tag),
            resource: mapResource(resource),
          };

          if (tagged) {
            event = taggedResource(resource, tag, user, isNewResource);
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
          user: `${user.name} (ID: ${user.id})`,
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
      const { top: topValue, after, includeRepresents: includeRepresentsValue } = req.query;
      const top = topValue ? parseInt(topValue as string) : 10;
      const includeRepresents = includeRepresentsValue === 'true';

      if (!isAllowedUser(user, tenantId, [ServiceRoles.ResourceBrowser, ServiceRoles.ResourceTagger])) {
        throw new UnauthorizedUserError('get tagged resources', user);
      }

      const { results, page } = await repository.getTaggedResources(tenantId, tag, top, after as string);

      // If includeData is true, then resolve the represented resource.
      // This is effectively a join across APIs.
      if (includeRepresents) {
        const configuration = await req.getServiceConfiguration<DirectoryConfiguration, DirectoryConfiguration>(
          null,
          tenantId
        );

        for (const result of results) {
          const type = configuration.getResourceType(result.urn);
          if (type) {
            const resolved = await type.resolve(user.token.bearer, result);
            if (resolved) {
              result.data = resolved.data;
            }
          }
        }
      }

      res.send({
        results: results.map(mapResource),
        page,
      });
    } catch (err) {
      next(err);
    }
  };
}

interface ResourceRouterProps {
  logger: Logger;
  directory: ServiceDirectory;
  eventService: EventService;
  repository: DirectoryRepository;
}

export function createResourceRouter({ logger, directory, eventService, repository }: ResourceRouterProps) {
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
      body('resource.urn').isString().isLength({ min: 1, max: 2000 }),
      body('resource.name').optional().isString().isLength({ min: 1, max: 250 }),
      body('resource.description').optional().isString().isLength({ min: 1, max: 2000 })
    ),
    tagOperation(logger, directory, eventService, repository)
  );

  router.get(
    '/tags/:tag/resources',
    createValidationHandler(
      query('top').optional().isInt({ min: 1, max: 500 }),
      query('after').optional().isString(),
      query('includeRepresents').optional().isBoolean()
    ),
    getTaggedResources(repository)
  );

  return router;
}
