import { AdspId, isAllowedUser, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createValidationHandler, NotFoundError } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { param, query } from 'express-validator';
import { CatalogService, RetentionService } from '../model';
import { APPLICATION_MAX_LENGTH, APPLICATION_PATTERN } from '../configuration';
import { AuditServiceRoles } from '../roles';
import { EventReader, EventSubmitter } from '../types';
import { assertCanWriteEvents } from '../utils/write-access';
import { validateWriteRequest } from '../utils/request-validation';
import { writeEvents } from './write-events';
import { readEvent, readEvents, validateEventId, validateEventQuery } from './read-events';
import type { Logger } from 'winston';

interface AuditRouterOptions {
  catalogs: CatalogService;
  retention: RetentionService;
  logger: Logger;
  submitter?: EventSubmitter;
  reader?: EventReader;
}

export const validateTenantContext = createValidationHandler(
  query('tenantId')
    .optional()
    .isString()
    .bail()
    .custom((value: string) => {
      const id = AdspId.parse(value);
      return (
        id.namespace === 'platform' &&
        id.service === 'tenant-service' &&
        id.api === 'v2' &&
        /^\/tenants\/[^/]+$/.test(id.resource || '')
      );
    }),
);

export const assertTenantContext: RequestHandler = (req, _res, next) => {
  const requestedTenant = req.query.tenantId;
  if (!req.user?.isCore && requestedTenant && requestedTenant !== req.user?.tenantId?.toString()) {
    next(new UnauthorizedUserError('access another tenant audit data', req.user));
    return;
  }
  next();
};

export const readActions =
  (catalogs: CatalogService): RequestHandler =>
  async (req, res, next) => {
    try {
      const tenantId = req.tenant?.id;
      if ((!req.user.isCore && !tenantId) || !isAllowedUser(req.user, tenantId, AuditServiceRoles.Reader, true)) {
        throw new UnauthorizedUserError('read action catalog', req.user);
      }
      const { namespace } = req.params;
      const catalog = await catalogs.getCatalog(namespace, tenantId);
      if (!catalog) {
        throw new NotFoundError('action catalog', namespace);
      }
      res.send(Object.entries(catalog.actions).map(([name, definition]) => ({ ...definition, name })));
    } catch (err) {
      next(err);
    }
  };

export function createAuditRouter(options: AuditRouterOptions): Router {
  const router = Router();
  const validateNamespace = createValidationHandler(
    param('namespace').isString().isLength({ min: 1, max: APPLICATION_MAX_LENGTH }).matches(APPLICATION_PATTERN),
  );
  router.get('/:namespace/actions', assertAuthenticatedHandler, validateNamespace, readActions(options.catalogs));
  router.get('/events', assertAuthenticatedHandler, validateEventQuery, readEvents(options.reader));
  router.get(
    '/:namespace/events',
    assertAuthenticatedHandler,
    validateNamespace,
    validateEventQuery,
    readEvents(options.reader),
  );
  router.get(
    '/:namespace/events/:id',
    assertAuthenticatedHandler,
    validateNamespace,
    validateEventId,
    readEvent(options.reader),
  );
  router.post(
    '/:namespace/events',
    assertAuthenticatedHandler,
    validateNamespace,
    assertCanWriteEvents,
    validateWriteRequest,
    writeEvents(options),
  );
  return router;
}
