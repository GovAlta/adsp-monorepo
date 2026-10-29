import { AdspId, AuditCategories, AuditSeverities, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import {
  assertAuthenticatedHandler,
  createValidationHandler,
  InvalidOperationError,
  NotFoundError,
} from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { body, param, query } from 'express-validator';
import * as HttpStatusCodes from 'http-status-codes';
import { CatalogService, FailedEventService, RetentionService } from '../model';
import { APPLICATION_MAX_LENGTH, APPLICATION_PATTERN } from '../configuration';
import { AuditServiceRoles } from '../roles';
import { EventReader, EventSubmitter } from '../types';
import { assertWriteScope } from '../utils/write-access';
import { requireAuditRole } from '../utils/authorization';
import { SelfAuditor } from '../utils/self-audit';
import { validateWriteRequest } from '../utils/request-validation';
import { writeEvents } from './write-events';
import { limitWriteRate, WriteRateLimitOptions } from './rate-limit';
import { failedEventHandler, validateFailedEventId, validateFailedEventPage } from './failed-events';
import { readEvent, readEvents, readNamespaces, validateEventId, validateEventQuery } from './read-events';
import { exportEvents } from './export-events';
import type { Logger } from 'winston';

interface AuditRouterOptions {
  catalogs: CatalogService;
  retention: RetentionService;
  logger: Logger;
  submitter?: EventSubmitter;
  failedEvents?: FailedEventService;
  reader?: EventReader;
  // The service's own client ID; enables recording of reads as audit events.
  serviceId?: AdspId;
  // Overrides the auditor created from serviceId, so the host can observe its failure count.
  auditor?: SelfAuditor;
  // Applies per tenant and namespace event rate limiting to writes when provided.
  rateLimit?: WriteRateLimitOptions;
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

export const readCatalogs =
  (catalogs: CatalogService): RequestHandler =>
  async (req, res, next) => {
    try {
      const listings = await catalogs.listCatalogs(req.tenant?.id);
      res.send(
        listings.map(({ application, core, actions }) => ({
          application,
          core,
          actions: Object.entries(actions).map(([name, definition]) => ({ ...definition, name })),
        })),
      );
    } catch (err) {
      next(err);
    }
  };

export const addAction =
  (catalogs: CatalogService): RequestHandler =>
  async (req, res, next) => {
    try {
      const tenantId = req.tenant?.id;
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
      if (!tenantId || !token) {
        throw new InvalidOperationError('Adding an action requires a tenant context.');
      }
      const { namespace } = req.params;
      const { name, ...definition } = req.body;
      await catalogs.addAction(namespace, name, definition, tenantId, token);
      res.status(HttpStatusCodes.CREATED).send({ ...definition, name });
    } catch (err) {
      next(err);
    }
  };

export const validateAction = createValidationHandler(
  body('name')
    .isString()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9]+(?:[._:-][a-zA-Z0-9]+)*$/),
  body('version').isInt({ min: 1 }),
  body('category').isIn(Object.values(AuditCategories)),
  body('severity').isIn(Object.values(AuditSeverities)),
  body('retentionClass').isString().matches(APPLICATION_PATTERN),
  body('description').optional().isString().notEmpty(),
  body('resourceType').optional().isString().notEmpty(),
  body('captureChangeSet').optional().isBoolean({ strict: true }),
  body('forwardToSiem').optional().isBoolean({ strict: true }),
);

export const readRetention =
  (catalogs: CatalogService, retention: RetentionService): RequestHandler =>
  async (req, res, next) => {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.send({ tenant: {}, applications: {} });
        return;
      }
      const listings = await catalogs.listCatalogs(tenantId);
      res.send(
        await retention.getConfigured(
          tenantId,
          listings.map(({ application }) => application),
        ),
      );
    } catch (err) {
      next(err);
    }
  };

export function createAuditRouter(options: AuditRouterOptions): Router {
  const router = Router();
  // Without a submitter the auditor still exists, so unrecorded reads are logged and counted rather than silently skipped.
  const auditor =
    options.auditor ?? (options.serviceId ? new SelfAuditor({ ...options, serviceId: options.serviceId }) : undefined);
  const validateNamespace = createValidationHandler(
    param('namespace').isString().isLength({ min: 1, max: APPLICATION_MAX_LENGTH }).matches(APPLICATION_PATTERN),
  );
  router.get(
    '/namespaces',
    assertAuthenticatedHandler,
    requireAuditRole(AuditServiceRoles.Reader),
    readNamespaces(options.reader),
  );
  router.get(
    '/actions',
    assertAuthenticatedHandler,
    requireAuditRole(AuditServiceRoles.Reader),
    readCatalogs(options.catalogs),
  );
  router.get(
    '/retention',
    assertAuthenticatedHandler,
    requireAuditRole(AuditServiceRoles.Reader),
    readRetention(options.catalogs, options.retention),
  );
  router.get(
    '/:namespace/actions',
    assertAuthenticatedHandler,
    requireAuditRole(AuditServiceRoles.Reader),
    validateNamespace,
    readActions(options.catalogs),
  );
  router.post(
    '/:namespace/actions',
    assertAuthenticatedHandler,
    requireAuditRole(AuditServiceRoles.Admin),
    validateNamespace,
    validateAction,
    addAction(options.catalogs),
  );
  router.get(
    '/events/export',
    assertAuthenticatedHandler,
    requireAuditRole(AuditServiceRoles.Reader),
    validateEventQuery,
    exportEvents(options.reader, auditor),
  );
  router.get(
    '/:namespace/events/export',
    assertAuthenticatedHandler,
    requireAuditRole(AuditServiceRoles.Reader),
    validateNamespace,
    validateEventQuery,
    exportEvents(options.reader, auditor),
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
    ...(options.rateLimit ? [limitWriteRate(options.rateLimit)] : []),
    writeEvents(options),
  );
  router.get(
    '/failed-events',
    assertAuthenticatedHandler,
    requireAuditRole(AuditServiceRoles.Admin),
    validateFailedEventPage,
    failedEventHandler(options.failedEvents, options.logger, 'list', auditor),
  );
  router.post(
    '/failed-events/:id/replay',
    assertAuthenticatedHandler,
    requireAuditRole(AuditServiceRoles.Admin),
    validateFailedEventId,
    failedEventHandler(options.failedEvents, options.logger, 'replay'),
  );
  return router;
}
