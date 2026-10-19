import { AdspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createValidationHandler, NotFoundError } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { param, query } from 'express-validator';
import { CatalogService, RetentionService } from '../model';
import { APPLICATION_MAX_LENGTH, APPLICATION_PATTERN } from '../configuration';
import { AuditServiceRoles } from '../roles';
import { EventReader, EventSubmitter } from '../types';
import { assertWriteScope } from '../utils/write-access';
import { requireAuditRole } from '../utils/authorization';
import { SelfAuditor } from '../utils/self-audit';
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
  // The service's own client ID; enables recording of reads as audit events.
  serviceId?: AdspId;
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
  // Without a submitter the auditor still exists, so unrecorded reads are logged and counted rather than silently skipped.
  const auditor = options.serviceId ? new SelfAuditor({ ...options, serviceId: options.serviceId }) : undefined;
  const validateNamespace = createValidationHandler(
    param('namespace').isString().isLength({ min: 1, max: APPLICATION_MAX_LENGTH }).matches(APPLICATION_PATTERN),
  );
  router.get(
    '/:namespace/actions',
    assertAuthenticatedHandler,
    requireAuditRole(AuditServiceRoles.Reader),
    validateNamespace,
    readActions(options.catalogs),
  );
  router.get(
    '/events',
    assertAuthenticatedHandler,
    requireAuditRole(AuditServiceRoles.Reader),
    validateEventQuery,
    readEvents(options.reader, auditor),
  );
  router.get(
    '/:namespace/events',
    assertAuthenticatedHandler,
    requireAuditRole(AuditServiceRoles.Reader),
    validateNamespace,
    validateEventQuery,
    readEvents(options.reader, auditor),
  );
  router.get(
    '/:namespace/events/:id',
    assertAuthenticatedHandler,
    requireAuditRole(AuditServiceRoles.Reader),
    validateNamespace,
    validateEventId,
    readEvent(options.reader, auditor),
  );
  router.post(
    '/:namespace/events',
    assertAuthenticatedHandler,
    requireAuditRole(AuditServiceRoles.Writer),
    validateNamespace,
    assertWriteScope,
    validateWriteRequest,
    writeEvents(options),
  );
  return router;
}
