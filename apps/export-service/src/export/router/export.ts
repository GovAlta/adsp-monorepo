import { AdspId, assertAdspId, EventService, isAllowedUser, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
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
import { ExportServiceConfiguration } from '../configuration';

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
      const { fileType, filename, format, formatOptions, resourceId: resourceIdValue, params, resultsPath } = req.body;
      const resourceId = AdspId.parse(resourceIdValue);

      assertAdspId(resourceId, 'Value of resourceId must be a valid ADSP URN for an API resource.', 'resource');

      const configuration = await req.getServiceConfiguration<ExportServiceConfiguration, ExportServiceConfiguration>(
        null,
        tenantId
      );

      const source = configuration?.getSource(resourceId);
      if (!isAllowedUser(user, tenantId, [ServiceRoles.Exporter, ...(source?.exporterRoles || [])], true)) {
        throw new UnauthorizedUserError('create export job', user);
      }

      if (fileType) {
        const typeExists = await fileService.typeExists(tenantId, fileType);
        if (!typeExists) {
          throw new InvalidOperationError(`Specified target file type '${fileType}' cannot be found.`);
        }
      }

      const job = await repository.create(user, tenantId);
      await queueService.enqueue({
        timestamp: new Date(),
        jobId: job.id,
        tenantId: `${tenantId}`,
        resourceId: resourceIdValue,
        params,
        resultsPath: resultsPath || 'results',
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

      const job = await repository.get(jobId);
      if (!job) {
        throw new NotFoundError('export job', jobId);
      }

      if (user?.id !== job?.createdBy?.id && !isAllowedUser(user, req.tenant.id, ServiceRoles.Exporter)) {
        throw new UnauthorizedUserError('get export job', user);
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
      body('params').optional().isObject(),
      body('resultsPath').optional().isString().isLength({ min: 1, max: 150 }),
      body('filename').optional({ nullable: true }).isString().isLength({ min: 1, max: 100 }),
      body('fileType').optional({ nullable: true }).isString().isLength({ min: 1, max: 50 })
    ),
    createExportJob(serviceId, logger, eventService, fileService, queueService, repository)
  );

  router.get('/jobs/:jobId', createValidationHandler(param('jobId').isUUID()), getExportJob(serviceId, repository));

  return router;
}
