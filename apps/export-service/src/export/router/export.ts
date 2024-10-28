import { AdspId, EventService, isAllowedUser, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import {
  createValidationHandler,
  InvalidOperationError,
  NotFoundError,
  WorkQueueService,
} from '@core-services/core-common';
import { FileResult, FileService, JobRepository, mapJob } from '@core-services/job-common';
import { RequestHandler, Router } from 'express';
import { Logger } from 'winston';
import { ExportServiceWorkItem } from '../job';
import { ServiceRoles } from '../roles';
import { EXPORT_FILE } from '../fileTypes';
import { exportQueued } from '../events';
import { body, param } from 'express-validator';

export function createExportJob(
  serviceId: AdspId,
  logger: Logger,
  eventService: EventService,
  fileService: FileService,
  queueService: WorkQueueService<ExportServiceWorkItem>,
  repository: JobRepository<FileResult>
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant.id;
      const { fileType, filename, format, formatOptions, resourceId: resourceIdValue } = req.body;
      const resourceId = AdspId.parse(resourceIdValue);

      if (!isAllowedUser(user, tenantId, ServiceRoles.Exporter, true)) {
        throw new UnauthorizedUserError('create export job', user);
      }

      if (fileType) {
        const typeExists = await fileService.typeExists(tenantId, fileType);
        if (!typeExists) {
          throw new InvalidOperationError(`Specified target file type '${fileType}' cannot be found.`);
        }
      }

      const job = await repository.create(tenantId);
      await queueService.enqueue({
        timestamp: new Date(),
        jobId: job.id,
        tenantId: `${tenantId}`,
        resourceId: resourceIdValue,
        params: req.query,
        format,
        formatOptions: formatOptions || {},
        fileType: fileType || EXPORT_FILE,
        filename: filename || 'exported',
        requestedBy: {
          id: user.id,
          name: user.name,
        },
      });

      eventService.send(exportQueued(tenantId, user, job.id, resourceId, format, filename));
      res.send(mapJob(serviceId, job));

      logger.info(`Queued export job (ID: ${job.id}) for export of resource: ${resourceId}.`, {
        context: 'ExportRouter',
        tenantId: tenantId.toString(),
        user: user ? `${user.name} (ID: ${user.id})` : null,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function getExportJob(serviceId: AdspId, repository: JobRepository<FileResult>): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { jobId } = req.params;

      if (!isAllowedUser(user, req.tenant.id, ServiceRoles.Exporter)) {
        throw new UnauthorizedUserError('get export job', user);
      }

      const job = await repository.get(jobId);
      if (!job) {
        throw new NotFoundError('export job', jobId);
      }

      res.send(mapJob(serviceId, job));
    } catch (err) {
      next(err);
    }
  };
}

interface RouterProps {
  serviceId: AdspId;
  logger: Logger;
  eventService: EventService;
  fileService: FileService;
  queueService: WorkQueueService<ExportServiceWorkItem>;
  repository: JobRepository<FileResult>;
}

export function createExportRouter({
  serviceId,
  logger,
  eventService,
  fileService,
  repository,
  queueService,
}: RouterProps) {
  const router = Router();

  router.post(
    '/jobs',
    createValidationHandler(
      body('format').isIn(['csv', 'json']),
      body('formatOptions').optional().isObject(),
      body('resourceId').custom((input) => AdspId.isAdspId(input)),
      body('filename').optional({ nullable: true }).isString().isLength({ min: 1, max: 100 }),
      body('fileType').optional({ nullable: true }).isString().isLength({ min: 1, max: 50 })
    ),
    createExportJob(serviceId, logger, eventService, fileService, queueService, repository)
  );

  router.get('/jobs/:jobId', createValidationHandler(param('jobId').isUUID()), getExportJob(serviceId, repository));

  return router;
}
